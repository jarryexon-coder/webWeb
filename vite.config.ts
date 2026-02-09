import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    host: true
  },
  define: {
    // Unified API environment variables
    'import.meta.env.VITE_API_BASE_NBA_BACKEND': JSON.stringify(process.env.VITE_API_BASE_NBA_BACKEND),
    'import.meta.env.VITE_API_BASE_PYTHON': JSON.stringify(process.env.VITE_API_BASE_PYTHON),
    'import.meta.env.VITE_USE_BACKEND': JSON.stringify(process.env.VITE_USE_BACKEND),
    'import.meta.env.VITE_API_TIMEOUT': JSON.stringify(process.env.VITE_API_TIMEOUT || '10000'),
    'import.meta.env.VITE_ENABLE_CACHE': JSON.stringify(process.env.VITE_ENABLE_CACHE || 'true'),
    
    // Legacy environment variables (for backward compatibility)
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL),
    'import.meta.env.VITE_API_BASE_PYTHON_API': JSON.stringify(process.env.VITE_API_BASE_PYTHON_API),
    'import.meta.env.VITE_USE_SINGLE_BACKEND': JSON.stringify(process.env.VITE_USE_SINGLE_BACKEND),
    'import.meta.env.REACT_APP_USE_SINGLE_BACKEND': JSON.stringify(process.env.REACT_APP_USE_SINGLE_BACKEND),
    'import.meta.env.REACT_APP_NBA_BACKEND_URL': JSON.stringify(process.env.REACT_APP_NBA_BACKEND_URL),
    'import.meta.env.REACT_APP_PYTHON_BACKEND_URL': JSON.stringify(process.env.REACT_APP_PYTHON_BACKEND_URL)
  }
})
