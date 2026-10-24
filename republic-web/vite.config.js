import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Two pages: the restaurant home and the menu.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        menu: resolve(import.meta.dirname, 'menu/index.html'),
      },
    },
  },
});
