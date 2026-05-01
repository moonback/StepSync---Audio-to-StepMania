import * as musicMetadata from 'music-metadata-browser';

function parseFilename(filename: string) {
  const base = filename.replace(/\.[^/.]+$/, "");
  const parts = base.split(" - ");
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(" - ").trim(),
    };
  }
  return { title: base, artist: "Unknown Artist" };
}

export async function parseAudioMetadata(file: File) {
  const fromFile = parseFilename(file.name);
  
  try {
    const metadata = await musicMetadata.parseBlob(file);
    return {
      title: metadata.common.title || fromFile.title,
      artist: metadata.common.artist || fromFile.artist,
    };
  } catch (error) {
    console.warn("Could not parse metadata, using fallback.", error);
    return fromFile;
  }
}
