import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 100,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    },
    hmr: {
      overlay: true,
    },
    fs: {
      // Limit to project root, avoid invalid paths, but allow cwd
      strict: false,
      allow: [process.cwd()],
    },
  },
})
