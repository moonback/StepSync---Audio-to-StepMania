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
    console.log("[StepSync] Starting parseBlob for:", file.name);
    
    // Safety check for empty files
    if (file.size === 0) {
      console.warn("[StepSync] File is empty, skipping metadata parse");
      return fromFile;
    }

    const metadata = await musicMetadata.parseBlob(file);
    console.log("[StepSync] Metadata parsed successfully:", metadata.common.title);
    
    return {
      title: metadata.common.title || fromFile.title,
      artist: metadata.common.artist || fromFile.artist,
    };
  } catch (error) {
    console.error("[StepSync] Metadata parsing error (falling back to filename):", error);
    return fromFile;
  }
}
