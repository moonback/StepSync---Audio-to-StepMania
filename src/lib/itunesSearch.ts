export interface ITunesResult {
  artworkUrl100: string;
  artworkUrl600: string; // we can replace 100x100 with 600x600 for better quality
}

export async function fetchArtwork(term: string): Promise<string | null> {
  if (!term || term.trim() === '') return null;
  
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const url = result.artworkUrl100;
      // Replace with higher resolution
      return url ? url.replace('100x100bb', '600x600bb') : null;
    }
  } catch (error) {
    console.warn("Could not fetch artwork from iTunes", error);
  }
  return null;
}
