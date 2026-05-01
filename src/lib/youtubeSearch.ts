/**
 * YouTube Search via public Invidious API instances.
 * No API key required – uses open-source YouTube frontend mirrors.
 */

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  author: string;
  authorId: string;
  lengthSeconds: number;
  viewCount: number;
  thumbnail: string;
  published: number;
}

// List of public Invidious instances (tried in order until one works)
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.privacydev.net',
  'https://yt.cdaut.de',
  'https://invidious.dhusch.de',
  'https://iv.melmac.space',
];

async function fetchFromInstance(instance: string, query: string): Promise<YouTubeSearchResult[]> {
  const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,authorId,lengthSeconds,viewCount,videoThumbnails,published&page=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Invalid response');

  return data.slice(0, 10).map((item: any) => {
    const thumb = item.videoThumbnails?.find((t: any) => t.quality === 'medium')
      || item.videoThumbnails?.[0];
    return {
      videoId: item.videoId,
      title: item.title,
      author: item.author,
      authorId: item.authorId,
      lengthSeconds: item.lengthSeconds || 0,
      viewCount: item.viewCount || 0,
      thumbnail: thumb?.url || `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
      published: item.published || 0,
    };
  });
}

/**
 * Search YouTube videos. Tries multiple Invidious instances for reliability.
 */
export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  const errors: string[] = [];
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const results = await fetchFromInstance(instance, query);
      return results;
    } catch (e: any) {
      errors.push(`${instance}: ${e.message}`);
    }
  }
  throw new Error(`All Invidious instances failed.\n${errors.join('\n')}`);
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}k`;
  return String(count);
}
