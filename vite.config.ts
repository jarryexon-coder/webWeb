import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// Plugin to remove Content-Security-Policy header
const removeCSP: Plugin = {
  name: 'remove-csp',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = function(name: string, value: any) {
        if (name.toLowerCase() === 'content-security-policy') {
          // Ignore CSP headers
          return;
        }
        return originalSetHeader(name, value);
      };
      next();
    });
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const pythonApiTarget = env.VITE_API_BASE_PYTHON || 'https://python-api-fresh-production.up.railway.app';
  const nodeApiTarget = env.VITE_API_BASE_NODE || 'https://prizepicks-production.up.railway.app';
  
  console.log(`🚀 Python API proxy target: ${pythonApiTarget}`);
  console.log(`🚀 Node API proxy target: ${nodeApiTarget}`);

  return {
    plugins: [
      removeCSP,
      react(),
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html',
      }),
    ],
    root: '.',
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': [
              '@mui/material',
              '@mui/icons-material',
              '@emotion/react',
              '@emotion/styled',
            ],
            'charts-vendor': ['recharts', 'victory'],
            'query-vendor': ['@tanstack/react-query'],
            'date-vendor': ['date-fns', 'moment'],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        // IMPORTANT: Auth endpoints go to Python backend (must come BEFORE generic /api)
        '/api/auth': {
          target: pythonApiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => console.log('❌ Auth proxy error:', err));
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('🔄 Auth proxy:', req.method, req.url, '→', pythonApiTarget + req.url);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('✅ Auth proxy response:', proxyRes.statusCode, req.url);
            });
          },
        },
        // Default: proxy all other /api requests to Node backend
        '/api': {
          target: nodeApiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => console.log('❌ Node proxy error:', err));
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('🔄 Node proxy (default):', req.method, req.url, '→', nodeApiTarget + req.url);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('✅ Node proxy response:', proxyRes.statusCode, req.url);
            });
          },
        },
        // Override for Python API with prefix /api/python
        '/api/python': {
          target: pythonApiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/python/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => console.log('❌ Python proxy error:', err));
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('🔄 Python proxy:', req.method, req.url, '→', pythonApiTarget + req.url.replace(/^\/api\/python/, ''));
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('✅ Python proxy response:', proxyRes.statusCode, req.url);
            });
          },
        },
        // Override for Node API with prefix /api/node (if needed)
        '/api/node': {
          target: nodeApiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/node/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => console.log('❌ Node proxy error:', err));
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('🔄 Node proxy (prefix):', req.method, req.url, '→', nodeApiTarget + req.url.replace(/^\/api\/node/, ''));
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('✅ Node proxy response:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    preview: {
      port: parseInt(process.env.PORT) || 8080,
      host: true,
      cors: true,
    },
    define: {
      __DEV__: JSON.stringify(mode === 'development'),
      'import.meta.env.VITE_API_BASE_NBA_BACKEND': JSON.stringify(env.VITE_API_BASE_NBA_BACKEND),
      'import.meta.env.VITE_API_BASE_PYTHON': JSON.stringify(env.VITE_API_BASE_PYTHON),
      'import.meta.env.VITE_API_BASE_NODE': JSON.stringify(env.VITE_API_BASE_NODE),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
    },
  };
});
