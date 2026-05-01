import * as musicMetadata from 'music-metadata-browser';

export async function parseAudioMetadata(file: File) {
  try {
    const metadata = await musicMetadata.parseBlob(file);
    return {
      title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ""),
      artist: metadata.common.artist || "Unknown Artist",
    };
  } catch (error) {
    console.warn("Could not parse metadata, using fallback.", error);
    return {
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Unknown Artist",
    };
  }
}
