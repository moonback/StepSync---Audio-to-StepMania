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

async function getAudioUrl(videoId: string) {
  const fetchInstance = async (instance: string, isPiped: boolean) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout max
    try {
      const endpoint = isPiped ? `${instance}/streams/${videoId}` : `${instance}/api/v1/videos/${videoId}`;
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(id);
      
      if (!res.ok) throw new Error('Not OK');
      const data = await res.json();
      
      if (isPiped) {
        if (data?.audioStreams?.length > 0) {
          const best = data.audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
          if (best?.url) return best.url;
        }
      } else {
        if (data?.adaptiveFormats?.length > 0) {
          const best = data.adaptiveFormats
              .filter((f: any) => f.type?.includes('audio/mp4'))
              .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
          if (best?.url) return best.url;
        }
      }
      throw new Error('No stream');
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  const promises = [
    ...INVIDIOUS_INSTANCES.map(inst => fetchInstance(inst, false)),
    ...PIPED_INSTANCES.map(inst => fetchInstance(inst, true))
  ];

  try {
    return await Promise.any(promises);
  } catch (e) {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const videoId = req.query.v;
  if (!videoId) return res.status(400).json({ error: 'Missing videoId (v)' });

  try {
    const streamUrl = await getAudioUrl(videoId);
    if (!streamUrl) return res.status(503).json({ error: 'No audio stream found. All instances blocked or offline.' });

    const audioRes = await fetch(streamUrl);
    if (!audioRes.ok) return res.status(502).json({ error: 'Failed to fetch audio stream from instance.' });

    res.setHeader('Content-Type', audioRes.headers.get('content-type') || 'audio/mp4');
    res.setHeader('Content-Length', audioRes.headers.get('content-length') || '');
    res.setHeader('Content-Disposition', `attachment; filename="${videoId}.m4a"`);

    if (audioRes.body) {
      const { Readable } = await import('stream');
      // @ts-ignore
      Readable.fromWeb(audioRes.body).pipe(res);
    } else {
      res.status(500).json({ error: 'Empty stream body' });
    }
  } catch (error: any) {
    console.error('Download API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
