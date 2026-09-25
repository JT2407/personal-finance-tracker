import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The backend runs on 127.0.0.1:3000 (Express + JSON persistence).
// The Vite dev server proxies API calls there so the UI only ever calls
// relative /api paths and there is no CORS setup to maintain.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
