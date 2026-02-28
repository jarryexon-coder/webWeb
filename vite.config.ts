import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
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
        '/api': {
          target: 'https://python-api-fresh-production.up.railway.app',
          changeOrigin: true,
          secure: false,
          // Do NOT rewrite the path – send /api/... as is
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              console.log('❌ Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('🔄 Proxying:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
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
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
    },
  };
});
