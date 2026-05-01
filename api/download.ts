import type { VercelRequest, VercelResponse } from '@vercel/node';
import ytdl from '@distube/ytdl-core';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    
    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`);
    res.setHeader('X-Video-Title', encodeURIComponent(title));
    res.setHeader('X-Video-Author', encodeURIComponent(info.videoDetails.author.name));

    // Get the audio stream
    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    // Pipe the stream to the response
    stream.pipe(res);
  } catch (error: any) {
    console.error('Error downloading YouTube audio:', error);
    res.status(500).json({ error: 'Failed to download audio', details: error.message });
  }
}
