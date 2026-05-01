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
        name: 'vercel-api-mock',
        configureServer(server) {
          // Mock pour /api/search
          server.middlewares.use('/api/search', async (req, res) => {
            try {
              const query = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('q');
              if (!query) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing q parameter' }));
                return;
              }
              const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
              const response = await fetch(searchUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept-Language': 'en-US,en;q=0.9'
                }
              });
              const html = await response.text();
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.statusCode = 200;
              res.end(html);
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });

          // Mock pour /api/download (qui charge le fichier et l'exécute)
          server.middlewares.use('/api/download', async (req, res) => {
            try {
              const videoId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('v');
              if (!videoId) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing v parameter' }));
                return;
              }
              
              // On importe dynamiquement notre fonction serverless !
              const downloadHandler = await import('./api/download.ts');
              
              // On adapte le req/res de Vite pour ressembler à Vercel
              const vercelReq = {
                method: req.method,
                query: { v: videoId }
              };
              
              const vercelRes = {
                setHeader: (k: string, v: string) => res.setHeader(k, v),
                status: (code: number) => {
                  res.statusCode = code;
                  return {
                    json: (data: any) => res.end(JSON.stringify(data)),
                    end: () => res.end()
                  };
                }
              };
              
              await downloadHandler.default(vercelReq, vercelRes);
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
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
