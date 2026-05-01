import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'local-cors-proxy',
        configureServer(server) {
          // Proxy standard pour streamer n'importe quelle URL (bypasse CORS)
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
