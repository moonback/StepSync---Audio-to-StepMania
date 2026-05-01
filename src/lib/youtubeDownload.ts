/**
 * YouTube audio downloader via the public Invidious API.
 *
 * Strategy:
 *  1. Fetch video metadata from Invidious (/api/v1/videos/{id}) to discover
 *     available audio-only stream itags.
 *  2. Download the audio via Invidious's built-in proxy endpoint:
 *       /latest_version?id={id}&itag={itag}&local=true
 *     This proxies the YouTube CDN through Invidious, bypassing CORS entirely.
 *  3. Preferred itags: 140 (m4a/128kbps) → 251 (webm/opus 160kbps) → 250 → 249.
 *
 * No API key, no third-party service, no authentication required.
 */

// Same instances used for search — reuse working one
export const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.privacydev.net',
  'https://yt.cdaut.de',
  'https://invidious.dhusch.de',
  'https://iv.melmac.space',
  'https://invidious.nerdvpn.de',
  'https://invidious.lunar.icu',
];

/** Audio itag preference list: m4a first (most compatible), then webm/opus */
const PREFERRED_AUDIO_ITAGS = [140, 251, 250, 249, 139];

interface AdaptiveFormat {
  itag: number;
  type: string;
  mimeType?: string;
  bitrate?: number;
  audioQuality?: string;
}

function mimeForItag(itag: number): string {
  if (itag === 140 || itag === 139) return 'audio/mp4';
  return 'audio/webm';
}

function extForItag(itag: number): string {
  if (itag === 140 || itag === 139) return 'm4a';
  return 'webm';
}

/**
 * Try one Invidious instance to get video metadata + best audio itag.
 */
async function fetchVideoInfo(
  instance: string,
  videoId: string
): Promise<{ itag: number; title: string; author: string }> {
  const url = `${instance}/api/v1/videos/${videoId}?fields=adaptiveFormats,title,author`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const formats: AdaptiveFormat[] = data.adaptiveFormats ?? [];
  // Keep only audio-only streams
  const audioFormats = formats.filter(
    f => (f.type || f.mimeType || '').startsWith('audio/')
  );

  for (const preferred of PREFERRED_AUDIO_ITAGS) {
    if (audioFormats.find(f => f.itag === preferred)) {
      return { itag: preferred, title: data.title ?? videoId, author: data.author ?? '' };
    }
  }

  // Fallback: use whatever audio format we find
  if (audioFormats.length > 0) {
    return {
      itag: audioFormats[0].itag,
      title: data.title ?? videoId,
      author: data.author ?? '',
    };
  }

  throw new Error('No audio-only stream found for this video');
}

/**
 * Download the audio via Invidious proxy (/latest_version).
 * Invidious proxies the YouTube CDN stream, so no CORS issues.
 */
async function downloadViaProxy(
  instance: string,
  videoId: string,
  itag: number,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const url = `${instance}/latest_version?id=${videoId}&itag=${itag}&local=true`;
  const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
  if (!response.ok) throw new Error(`Proxy download failed: HTTP ${response.status}`);

  const contentLength = response.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (total && response.body) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total > 0) onProgress?.(Math.round((received / total) * 100));
    }

    return new Blob(chunks, { type: mimeForItag(itag) });
  }

  // No content-length: read all at once
  const blob = await response.blob();
  onProgress?.(100);
  return new Blob([blob], { type: mimeForItag(itag) });
}

/**
 * Download a YouTube video as audio and return a File object.
 *
 * @param videoId    YouTube video ID (e.g. "dQw4w9WgXcQ")
 * @param title      Human-readable title used as filename
 * @param onProgress Callback with download progress 0–100
 */
export async function downloadYouTubeAsMP3(
  videoId: string,
  title: string,
  onProgress?: (pct: number) => void
): Promise<File> {
  const errors: string[] = [];

  onProgress?.(2);

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      // Step 1 — get best audio itag from this instance
      onProgress?.(5);
      const { itag, title: apiTitle } = await fetchVideoInfo(instance, videoId);
      const resolvedTitle = title || apiTitle;

      // Step 2 — download via proxy
      onProgress?.(10);
      const blob = await downloadViaProxy(instance, videoId, itag, (pct) => {
        // Map 0-100 download progress into the 10-100 range
        onProgress?.(10 + Math.round(pct * 0.9));
      });

      onProgress?.(100);

      // Build a safe filename
      const safeName = resolvedTitle.replace(/[^\w\s\-]/g, '').trim() || videoId;
      const ext = extForItag(itag);
      const mime = mimeForItag(itag);

      return new File([blob], `${safeName}.${ext}`, { type: mime });
    } catch (e: any) {
      errors.push(`[${instance}] ${e.message}`);
      // Try next instance
    }
  }

  throw new Error(
    `Impossible de télécharger l'audio (tous les serveurs ont échoué).\n${errors.join('\n')}`
  );
}
