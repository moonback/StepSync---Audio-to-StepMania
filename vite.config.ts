import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import youtubedl from 'youtube-dl-exec';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'local-cors-proxy',
        configureServer(server) {
          // Endpoint yt-dlp local (Le boss final du téléchargement YouTube)
          server.middlewares.use('/proxy/ytdl', async (req, res) => {
            try {
              const videoId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('v');
              if (!videoId) {
                res.statusCode = 400;
                res.end('Missing v parameter');
                return;
              }
              
              const output = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
                dumpJson: true,
                format: 'bestaudio/best',
                noWarnings: true
              }) as any;
              
              const streamUrl = output.url || (output.formats && output.formats.find((f: any) => f.url)?.url);
              
              if (!streamUrl) throw new Error("Aucun flux audio trouvé via yt-dlp");

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ url: streamUrl }));
            } catch (e: any) {
              console.error('YTDLP Proxy error:', e);
              res.statusCode = 500;
              res.end(e.message || 'YTDLP Proxy Error');
            }
          });

          // Proxy standard pour streamer n'importe quelle URL
          server.middlewares.use('/proxy', async (req, res) => {
            try {
              const urlStr = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('url');
              if (!urlStr) {
                res.statusCode = 400;
                res.end('Missing url parameter');
                return;
              }
              
              const fetchRes = await fetch(urlStr, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': '*/*'
                },
                redirect: 'follow'
              });

              res.statusCode = fetchRes.status;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
              
              const contentType = fetchRes.headers.get('content-type');
              if (contentType) res.setHeader('Content-Type', contentType);
              
              const contentLength = fetchRes.headers.get('content-length');
              if (contentLength) res.setHeader('Content-Length', contentLength);

              if (fetchRes.body) {
                const { Readable } = await import('stream');
                Readable.fromWeb(fetchRes.body as any).pipe(res);
              } else {
                res.end();
              }
              
            } catch (e: any) {
              console.error('Proxy error:', e);
              res.statusCode = 500;
              res.end(e.message || 'Proxy Error');
            }
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
