/**
 * YouTube Search - Ultra Robust Text-based Scraper
 */

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
}

/**
 * Scrapes YouTube search results via API Vercel
 */
export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  console.log(`📡 Recherche YouTube via API Vercel pour: "${query}"...`);

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Erreur serveur API");
    
    const html = await res.text();
    
    // Extraction de ytInitialData depuis le HTML brut
    const scriptRegex = /var ytInitialData = (\{.*?\});<\/script>/s;
    const match = html.match(scriptRegex);
    
    if (match && match[1]) {
      const data = JSON.parse(match[1]);
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
      
      if (contents) {
        let results: YouTubeSearchResult[] = [];
        
        for (const section of contents) {
          const itemSection = section.itemSectionRenderer?.contents;
          if (!itemSection) continue;
          
          for (const item of itemSection) {
            const video = item.videoRenderer;
            if (!video || !video.videoId) continue;
            
            // Ignore les diffusions en direct
            if (video.badges?.some((b: any) => b.metadataBadgeRenderer?.label === 'LIVE')) continue;

            const durationText = video.lengthText?.simpleText || "0:00";
            let durationSeconds = 0;
            const timeParts = durationText.split(':').map(Number);
            if (timeParts.length === 3) durationSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
            else if (timeParts.length === 2) durationSeconds = timeParts[0] * 60 + timeParts[1];
            
            results.push({
              videoId: video.videoId,
              title: video.title?.runs?.[0]?.text || "Titre inconnu",
              author: video.ownerText?.runs?.[0]?.text || "Auteur inconnu",
              duration: durationSeconds,
              thumbnail: video.thumbnail?.thumbnails?.[0]?.url || ""
            });
          }
        }
        
        if (results.length > 0) {
          console.log(`✅ ${results.length} résultats trouvés via l'API Vercel !`);
          return results.slice(0, 15);
        }
      }
    }
  } catch (error) {
    console.error("Erreur de recherche via l'API Vercel:", error);
  }
  
  throw new Error("Impossible de récupérer les résultats de recherche. L'API a peut-être bloqué la requête.");
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
