import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Tizen 6.5 (2022 TVs) ships Chromium 85; the app loads from file:// inside the .wgt,
// so every asset path must be relative.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'chrome85',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: { port: 5173 },
})
