import { defineConfig } from 'vite';
// Relative base so the build works on Vercel and in any sub-folder preview.
export default defineConfig({ base: './', build: { chunkSizeWarningLimit: 900 } });
