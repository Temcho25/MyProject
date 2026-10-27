import { defineConfig } from 'vite';
import { resolve } from 'node:path';
// Relative base so the build works on any host or sub-folder; two pages: home and portfolio.
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), portfolio: resolve(__dirname, 'portfolio/index.html') } },
  },
});
