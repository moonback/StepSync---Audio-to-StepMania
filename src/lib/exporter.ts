import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateSM, SMOptions } from './smGenerator';
import { processAudio } from './audioAnalysis';
import { fetchArtwork } from './itunesSearch';
import { SongItem } from './types';

export async function packageAndDownload(
  songFiles: SongItem[],
  settings: { difficulty: number, trimSilence: boolean, bpmOverride?: number, onsetThreshold?: number, mineProbability?: number },
  bgImageFile?: File,
  bannerImageFile?: File,
  videoFile?: File
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

    let downloadedBgBlob: Blob | null = null;
    let bgName = bgImageFile?.name;

    // Fetch artwork online if user did not provide a background or video
    if (!bgImageFile && !videoFile) {
      const artUrl = song.artworkUrl || await fetchArtwork(`${song.artist} ${song.title}`.trim() || song.title);
      if (artUrl) {
         try {
           const artRes = await fetch(artUrl);
           if (artRes.ok) {
             downloadedBgBlob = await artRes.blob();
             bgName = 'background.jpg';
           }
         } catch (e) { console.warn("Failed fetching artwork blob", e); }
      }
    }

    const audioExt = song.file.name.split('.').pop() || 'mp3';
    const safeAudioName = `${song.artist} - ${song.title}`.replace(/[\\/:*?"<>|]/g, '') + `.${audioExt}`;

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
      difficultyScale: settings.difficulty,
      trimSilence: settings.trimSilence,
      bpmOverride: settings.bpmOverride || song.bpm,
      onsetThreshold: settings.onsetThreshold,
      mineProbability: settings.mineProbability,
    };

    const safeBgName = bgName?.toLowerCase();
    const safeBannerName = bannerImageFile?.name.toLowerCase();
    const videoExt = videoFile?.name.split('.').pop()?.toLowerCase() || 'mp4';
    const safeVideoName = videoFile ? `videoplayback.${videoExt}` : undefined;

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
      if (bgImageFile) folder.file(safeBgName!, bgImageFile);
      else if (downloadedBgBlob) folder.file(safeBgName!, downloadedBgBlob);
      if (bannerImageFile) folder.file(safeBannerName!, bannerImageFile);
      if (videoFile) folder.file(safeVideoName!, videoFile);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'StepSync_Output.zip');
}
