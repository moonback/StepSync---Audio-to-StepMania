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
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        }
      }
    });
    
    const title = info.videoDetails.title;
    const author = info.videoDetails.author.name;
    
    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    // Sanitize filename
    const safeTitle = title.replace(/[^\x00-\x7F]/g, "").replace(/[\\/:*?"<>|]/g, "_");
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`);
    res.setHeader('X-Video-Title', encodeURIComponent(title));
    res.setHeader('X-Video-Author', encodeURIComponent(author));
    res.setHeader('Access-Control-Expose-Headers', 'X-Video-Title, X-Video-Author');

    // Get the audio stream
    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        }
      }
    });

    // Pipe the stream to the response
    stream.pipe(res);

    // Handle stream errors
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.writableEnded) {
        res.status(500).end();
      }
    });

  } catch (error: any) {
    console.error('Error downloading YouTube audio:', error);
    // Return a more descriptive error if possible
    const errorMessage = error.message || 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to download audio', 
      details: errorMessage,
      isIPBanned: errorMessage.includes('403') || errorMessage.includes('429'),
      suggestion: 'YouTube might be blocking the server IP. Try again in a few minutes or use a different URL.'
    });
  }
}
