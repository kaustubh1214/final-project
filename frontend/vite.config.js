import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Base public path. Defaults to '/' (root origin, e.g. local Docker).
  // Set VITE_BASE_PATH=/nyayavaad/ to host the app under a sub-path.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
