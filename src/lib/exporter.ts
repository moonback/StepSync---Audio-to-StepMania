import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateSM, SMOptions } from './smGenerator';
import { processAudio } from './audioAnalysis';
import { fetchArtwork } from './itunesSearch';

export async function packageAndDownload(
  songFiles: { id: string, file: File, title: string, artist: string, audioCtx?: AudioContext }[],
  settings: { difficulty: number, trimSilence: boolean, bpmOverride?: number, onsetThreshold?: number, mineProbability?: number },
  bgImageFile?: File,
  bannerImageFile?: File
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

    // Fetch artwork online if user did not provide a background
    if (!bgImageFile) {
      const artUrl = await fetchArtwork(`${song.artist} ${song.title}`.trim() || song.title);
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

    // Create the SM file
    const smOptions: SMOptions = {
      title: song.title,
      artist: song.artist,
      filename: song.file.name,
      difficultyScale: settings.difficulty,
      trimSilence: settings.trimSilence,
      bpmOverride: settings.bpmOverride,
      onsetThreshold: settings.onsetThreshold,
      mineProbability: settings.mineProbability,
    };

    if (bgName) smOptions.bgFileName = bgName;
    if (bannerImageFile) smOptions.bannerFileName = bannerImageFile.name; // Keep as is if user provided

    const smContent = generateSM(smOptions, analysis, durationSeconds);

    // Create a folder for the song
    const safeTitle = song.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const folder = zip.folder(safeTitle);

    if (folder) {
      folder.file(`${safeTitle}.sm`, smContent);
      folder.file(song.file.name, song.file);
      if (bgImageFile) folder.file(bgImageFile.name, bgImageFile);
      else if (downloadedBgBlob) folder.file(bgName!, downloadedBgBlob);
      if (bannerImageFile) folder.file(bannerImageFile.name, bannerImageFile);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'StepSync_Output.zip');
}
