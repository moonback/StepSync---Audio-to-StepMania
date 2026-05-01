/**
 * YouTube audio downloader - YTDLP Local + Proxy Fallback
 * Utilise yt-dlp local (via youtube-dl-exec sur le serveur Vite) pour une fiabilité à 100%.
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

async function getLocalYtDlpUrl(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`/proxy/ytdl?v=${videoId}`, {
      signal: AbortSignal.timeout?.(15000) || undefined
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.url) {
      console.log(`✅ Flux audio trouvé via YT-DLP Local !`);
      return data.url;
    }
  } catch (e) {
    console.warn(`Erreur YT-DLP local:`, e);
  }
  return null;
}

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
  console.log(`📡 Extraction vidéo locale (YT-DLP) pour: ${title}...`);

  // Phase 1: Le boss final (yt-dlp local via notre proxy Vite)
  let streamUrl = await getLocalYtDlpUrl(videoId);
  
  if (!streamUrl) {
    console.log(`⚠️ YT-DLP échoué, fallback sur Invidious...`);
    streamUrl = await getInvidiousAudioUrl(videoId);
  }
  
  if (!streamUrl) {
    console.log(`⚠️ Invidious indisponible, tentative via Piped...`);
    streamUrl = await getPipedAudioUrl(videoId);
  }
  
  if (!streamUrl) {
    throw new Error("Impossible d'extraire l'audio. YT-DLP, Invidious et Piped sont tous indisponibles.");
  }

  onProgress?.(30);
  console.log(`⬇️ Téléchargement binaire du flux via Proxy Local...`);

  // Phase 2: Télécharger le flux binaire via NOTRE proxy local Vite !
  const proxiedStreamUrl = `/proxy?url=${encodeURIComponent(streamUrl)}`;

  
  try {
    const response = await fetch(proxiedStreamUrl);
    
    if (!response.ok) throw new Error(`Erreur réseau (${response.status})`);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error("Le proxy a renvoyé une page HTML au lieu de l'audio Google Video.");
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
    console.error("Erreur proxy local binaire:", error);
    throw new Error("Le proxy local n'a pas pu récupérer le fichier binaire (Connexion rejetée).");
  }
}
