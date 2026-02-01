import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'charts-vendor': ['@mui/x-charts', 'recharts'],
          'date-vendor': ['@mui/x-date-pickers', 'date-fns'],
          'firebase-vendor': ['firebase'],
          'state-vendor': ['@reduxjs/toolkit', 'react-redux', 'axios']
        }
      },
      chunkSizeWarningLimit: 1000,
    },
  },
})
