import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Renders the page template into each language entry (index.html = ka, en/index.html = en).
function pages() {
  let server;
  const load = async () => {
    const url = pathToFileURL(resolve(__dirname, 'src/template.js')).href;
    if (server) return server.ssrLoadModule('/src/template.js');
    return import(`${url}?t=${Date.now()}`);
  };
  return {
    name: 'orientiri-pages',
    configureServer(s) {
      server = s;
      // Reload the page when content or drawings change.
      s.watcher.on('change', (f) => {
        if (/src[\\/](content|lib|template)/.test(f)) s.ws.send({ type: 'full-reload' });
      });
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        const lang = /[\\/]en[\\/]index\.html$/.test(ctx.filename) || ctx.path?.startsWith('/en') ? 'en' : 'ka';
        const { renderHead, renderBody } = await load();
        return html.replace('<!--page-head-->', renderHead(lang)).replace('<!--page-body-->', renderBody(lang));
      },
    },
  };
}

export default defineConfig({
  plugins: [pages()],
  build: {
    rollupOptions: {
      input: {
        ka: resolve(__dirname, 'index.html'),
        en: resolve(__dirname, 'en/index.html'),
      },
    },
    assetsInlineLimit: 0,
  },
});
