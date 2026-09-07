import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// GitHub Pages serves the site from /<repo>/ ; CI sets VITE_BASE, local dev stays at /.
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/](three|three-stdlib|@react-three)[\\/]/.test(id)) return 'three'
            return 'vendor'
          }
        },
      },
    },
  },
})
