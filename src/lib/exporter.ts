import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateSM, SMOptions } from './smGenerator';
import { processAudio } from './audioAnalysis';
import { fetchArtwork } from './itunesSearch';
import { SongItem } from './types';

export async function packageAndDownload(
  songFiles: SongItem[],
  settings: { trimSilence: boolean, bpmOverride?: number, onsetThreshold?: number, mineProbability?: number, gameModes?: string[] },
  bgImageFile?: File,
  bannerImageFile?: File,
  videoFile?: File,
  globalUseArtwork?: boolean
) {
  const zip = new JSZip();

  for (const song of songFiles) {
    const arrayBuffer = await song.file.arrayBuffer();
    
    // Process audio
    let durationSeconds = 0;
    let audioCtx: AudioContext | null = null;
    try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        durationSeconds = decoded.duration;
    } catch (e) {
        console.warn('Could not decode duration', e);
        durationSeconds = 120; // Fallback
    } finally {
        if (audioCtx && audioCtx.state !== 'closed') {
            await audioCtx.close();
        }
    }

    const analysis = await processAudio(arrayBuffer);

    const effectiveBgFile = song.customBg || bgImageFile;
    const effectiveBannerFile = song.customBanner || bannerImageFile;
    const effectiveVideoFile = song.customVideo || videoFile;

    let bgName = effectiveBgFile?.name;
    let bannerName = effectiveBannerFile?.name;
    let downloadedArtBlob: Blob | null = null;

    // Fetch artwork online only if user explicitly requested it (useArtwork flag) and no manual file is present
    const shouldFetchArt = (song.useArtwork || (!song.customBg && !song.customBanner && !song.customVideo && globalUseArtwork));
    
    if (shouldFetchArt && (!effectiveBgFile || !effectiveBannerFile) && !effectiveVideoFile) {
      const artUrl = song.artworkUrl || await fetchArtwork(`${song.artist} ${song.title}`.trim() || song.title);
      if (artUrl) {
         try {
           const artRes = await fetch(artUrl);
           if (artRes.ok) {
             downloadedArtBlob = await artRes.blob();
             if (!effectiveBgFile) bgName = 'background.jpg';
             if (!effectiveBannerFile) bannerName = 'banner.jpg';
           }
         } catch (e) { console.warn("Failed fetching artwork blob", e); }
      }
    }

    const audioExt = song.file.name.split('.').pop() || 'mp3';
    const safeAudioName = `${song.artist} - ${song.title}`.replace(/[\\/:*?"<>|]/g, '') + `.${audioExt}`;

    // ... (rest of the auto-tune logic remains same)

    // Auto-tune per song if processing a multiple pack
    let finalOnset = settings.onsetThreshold;
    let finalMine = settings.mineProbability;

    if (settings.onsetThreshold === undefined || settings.mineProbability === undefined) {
      const avgEnergy = analysis.energyProfile.length > 0 
        ? analysis.energyProfile.reduce((a, b) => a + b, 0) / analysis.energyProfile.length 
        : 0.1;
      const bpm = song.bpm || 120;
      
      let optimalOnset = 0.15;
      let optimalMine = 0.1;

      if (bpm > 160) { optimalOnset = 0.25; optimalMine = 0.15; }
      else if (bpm < 100) { optimalOnset = 0.10; optimalMine = 0.05; }

      if (avgEnergy > 0.05) optimalOnset += 0.05;
      else optimalOnset -= 0.05;

      finalOnset = Math.max(0.05, Math.min(0.5, optimalOnset));
      finalMine = Math.max(0, Math.min(0.3, optimalMine));
    }

    // Create the SM file
    const smOptions: SMOptions = {
      title: song.title,
      artist: song.artist,
      subtitle: song.subtitle,
      titleTranslit: song.titleTranslit,
      subtitleTranslit: song.subtitleTranslit,
      artistTranslit: song.artistTranslit,
      genre: song.genre,
      credit: song.credit,
      filename: safeAudioName,
      trimSilence: settings.trimSilence,
      bpmOverride: settings.bpmOverride || song.bpm,
      onsetThreshold: finalOnset,
      mineProbability: finalMine,
      gameModes: settings.gameModes,
    };

    const safeBgName = bgName?.toLowerCase();
    const safeBannerName = bannerName?.toLowerCase();
    const videoExt = effectiveVideoFile?.name.split('.').pop()?.toLowerCase() || 'mp4';
    const safeVideoName = effectiveVideoFile ? `videoplayback.${videoExt}` : undefined;

    if (safeBgName) smOptions.bgFileName = safeBgName;
    if (safeBannerName) smOptions.bannerFileName = safeBannerName;
    if (safeVideoName) smOptions.videoFileName = safeVideoName;

    const smContent = generateSM(smOptions, analysis, durationSeconds);

    // Create a folder for the song
    const safeTitle = `${song.artist} - ${song.title}`.replace(/[^a-zA-Z0-9 -]/g, '').trim() || 'Unknown_Song';
    const folder = zip.folder(safeTitle);

    if (folder) {
      folder.file(`${safeTitle}.sm`, smContent);
      folder.file(safeAudioName, song.file);
      if (effectiveBgFile) folder.file(safeBgName!, effectiveBgFile);
      else if (downloadedArtBlob && safeBgName === 'background.jpg') folder.file(safeBgName, downloadedArtBlob);

      if (effectiveBannerFile) folder.file(safeBannerName!, effectiveBannerFile);
      else if (downloadedArtBlob && safeBannerName === 'banner.jpg') folder.file(safeBannerName, downloadedArtBlob);

      if (effectiveVideoFile) folder.file(safeVideoName!, effectiveVideoFile);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'StepSync_Output.zip');
}
