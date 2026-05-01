import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import https from 'https';
import http from 'http';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'local-cors-proxy',
        configureServer(server) {
          server.middlewares.use('/proxy', (req, res) => {
            try {
              const urlStr = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('url');
              if (!urlStr) {
                res.statusCode = 400;
                res.end('Missing url parameter');
                return;
              }
              
              const client = urlStr.startsWith('https') ? https : http;
              client.get(urlStr, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': '*/*'
                }
              }, (proxyRes) => {
                if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                    res.statusCode = proxyRes.statusCode;
                    res.setHeader('Location', proxyRes.headers.location);
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end();
                    return;
                }
                if (proxyRes.headers['content-type']) res.setHeader('Content-Type', proxyRes.headers['content-type']);
                if (proxyRes.headers['content-length']) res.setHeader('Content-Length', proxyRes.headers['content-length']);
                res.setHeader('Access-Control-Allow-Origin', '*');
                proxyRes.pipe(res);
              }).on('error', (err) => {
                res.statusCode = 500;
                res.end(err.message);
              });
            } catch (e) {
              res.statusCode = 500;
              res.end('Proxy Error');
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
