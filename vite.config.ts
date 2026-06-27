import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The largest chunk is Firebase/Firestore, which is lazy-loaded only when
    // cloud sync is configured — so it never affects the core app's load.
    chunkSizeWarningLimit: 700,
  },
})
