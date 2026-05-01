/**
 * YouTube audio downloader - Proxy Fallback
 * Utilise le proxy local intégré à Vite pour contourner TOUTES les restrictions CORS en développement.
 * Attention: Ce proxy Vite ne fonctionnera qu'en développement local (`npm run dev`).
 */

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://iv.ggtyler.dev',
  'https://yt.artemislena.eu',
  'https://invidious.flokinet.to',
  'https://invidious.privacyredirect.com',
  'https://invidious.slipfox.xyz',
  'https://invidious.weblibre.org',
  'https://inv.bp.projectsegfau.lt'
];

const PIPED_INSTANCES = [
  'https://pipedapi.in.projectsegfau.lt',
  'https://api.piped.privacydev.net',
  'https://ytapi.drgns.space',
  'https://pipedapi.r4fo.com'
];

async function getInvidiousAudioUrl(videoId: string): Promise<string | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const apiUrl = `${instance}/api/v1/videos/${videoId}`;
      const proxyUrl = `/proxy?url=${encodeURIComponent(apiUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout?.(5000) || undefined });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.adaptiveFormats?.length > 0) {
        const audioFormats = data.adaptiveFormats.filter((f: any) => f.type && f.type.includes('audio/mp4'));
        const bestStream = audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        if (bestStream && bestStream.url) {
          console.log(`✅ Flux audio trouvé via Invidious (${instance})`);
          return bestStream.url;
        }
      }
    } catch (e) { continue; }
  }
  return null;
}

async function getPipedAudioUrl(videoId: string): Promise<string | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const apiUrl = `${instance}/streams/${videoId}`;
      const proxyUrl = `/proxy?url=${encodeURIComponent(apiUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout?.(5000) || undefined });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.audioStreams?.length > 0) {
        const bestStream = data.audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        if (bestStream && bestStream.url) {
          console.log(`✅ Flux audio trouvé via Piped (${instance})`);
          return bestStream.url;
        }
      }
    } catch (e) { continue; }
  }
  return null;
}

export async function downloadYouTubeAsMP3(
  videoId: string,
  title: string,
  onProgress?: (pct: number) => void
): Promise<File> {
  onProgress?.(10);
  console.log(`📡 Extraction audio via API Vercel pour: ${title}...`);

  const apiUrl = `/api/download?v=${encodeURIComponent(videoId)}`;

  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Erreur serveur (${response.status})`);
    }

    onProgress?.(30);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const errData = await response.json();
      throw new Error(errData.error || "Erreur de l'API");
    }

    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Flux illisible");

    const chunks: any[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
      }
      if (total > 0) onProgress?.(30 + Math.round((received / total) * 70));
    }

    const blob = new Blob(chunks, { type: 'audio/mp4' });
    const safeName = title.replace(/[^\w\s\-]/g, '').trim() || videoId;
    return new File([blob], `${safeName}.m4a`, { type: 'audio/mp4' });

  } catch (error: any) {
    console.error("Erreur téléchargement Vercel:", error);
    throw new Error(error.message || "L'API de téléchargement est temporairement indisponible.");
  }
}
