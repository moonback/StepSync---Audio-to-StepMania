/**
 * YouTube Search - Ultra Robust Text-based Scraper
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

const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
];

/**
 * Scrapes YouTube search results directly via raw HTML proxy
 */
export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  console.log(`📡 Recherche directe YouTube (Mode Brut) pour: "${query}"...`);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;

  for (const proxyFn of PROXIES) {
    try {
      const proxiedUrl = proxyFn(searchUrl);
      const res = await fetch(proxiedUrl, { signal: AbortSignal.timeout?.(7000) || undefined });
      
      if (!res.ok) continue;

      const html = await res.text();
      if (!html || html.length < 500) continue; // Too short, probably an error page

      // Look for the JSON data hidden in the HTML
      const startTag = 'var ytInitialData = ';
      const endTag = ';</script>';
      const startIndex = html.indexOf(startTag);
      if (startIndex === -1) continue;

      const dataPart = html.substring(startIndex + startTag.length);
      const endIndex = dataPart.indexOf(endTag);
      if (endIndex === -1) continue;

      const jsonStr = dataPart.substring(0, endIndex);
      const parsed = JSON.parse(jsonStr);
      
      const contents = parsed.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
      if (!contents || !Array.isArray(contents)) continue;

      const results: YouTubeSearchResult[] = [];
      for (const item of contents) {
        const video = item.videoRenderer;
        if (!video || !video.videoId) continue;

        results.push({
          videoId: video.videoId,
          title: video.title?.runs?.[0]?.text || "Titre inconnu",
          author: video.ownerText?.runs?.[0]?.text || "Auteur inconnu",
          authorId: video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || "",
          lengthSeconds: parseDuration(video.lengthText?.simpleText || video.lengthText?.accessibility?.accessibilityData?.label || "0:00"),
          viewCount: 0,
          thumbnail: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
          published: 0
        });

        if (results.length >= 15) break;
      }

      if (results.length > 0) {
        console.log(`✅ ${results.length} résultats trouvés !`);
        return results;
      }
    } catch (e) {
      console.warn("Proxy fail, trying next...");
      continue;
    }
  }

  throw new Error("YouTube est temporairement indisponible via nos serveurs de secours. Réessayez dans 30 secondes.");
}

function parseDuration(duration: string): number {
  if (!duration) return 0;
  // Handle "10 minutes, 30 seconds" or "10:30"
  const clean = duration.replace(/[^\d:]/g, '');
  const parts = clean.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatViewCount(count: number): string {
  return String(count);
}
