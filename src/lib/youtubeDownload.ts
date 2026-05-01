/**
 * YouTube audio downloader - Local Proxy & Invidious API
 * Utilise le proxy local intégré à Vite pour contourner TOUTES les restrictions CORS.
 */

const INVIDIOUS_INSTANCES = [
  'https://invidious.projectsegfau.lt',
  'https://inv.tux.rs',
  'https://invidious.fdn.fr',
  'https://vid.puffyan.us'
];

async function getInvidiousAudioUrl(videoId: string): Promise<string | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const apiUrl = `${instance}/api/v1/videos/${videoId}`;
      // On passe par le proxy local pour éviter les blocages CORS
      const proxyUrl = `/proxy?url=${encodeURIComponent(apiUrl)}`;
      
      const res = await fetch(proxyUrl, {
        signal: AbortSignal.timeout?.(5000) || undefined
      });
      
      if (!res.ok) continue;
      
      const data = await res.json();
      if (data && data.adaptiveFormats && data.adaptiveFormats.length > 0) {
        // Trouver le meilleur flux audio m4a (souvent itag 140)
        const audioFormats = data.adaptiveFormats.filter((f: any) => f.type && f.type.includes('audio/mp4'));
        const bestStream = audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        
        if (bestStream && bestStream.url) {
          console.log(`✅ Flux audio trouvé via Invidious (${instance})`);
          return bestStream.url;
        }
      }
    } catch (e) {
      console.warn(`Instance Invidious ${instance} injoignable via proxy.`);
      continue;
    }
  }
  return null;
}

export async function downloadYouTubeAsMP3(
  videoId: string,
  title: string,
  onProgress?: (pct: number) => void
): Promise<File> {
  onProgress?.(10);
  console.log(`📡 Recherche Invidious via Proxy Local pour: ${title}...`);

  // Phase 1: Obtenir l'URL de streaming direct depuis Invidious
  let streamUrl = await getInvidiousAudioUrl(videoId);
  
  if (!streamUrl) {
    throw new Error("Impossible de trouver un flux audio. Les instances Invidious sont peut-être saturées.");
  }

  onProgress?.(30);
  console.log(`⬇️ Téléchargement binaire du flux via Proxy Local...`);

  // Phase 2: Télécharger le flux binaire via NOTRE proxy local Vite !
  // Cela permet de télécharger directement depuis googlevideo.com sans CORS
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
