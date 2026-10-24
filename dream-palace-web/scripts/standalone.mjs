// Builds dist/dream-palace.html: one self-contained file (CSS, fonts, JS, favicon inlined)
// that opens from disk or a messenger attachment, with no server needed.
// Run: npm run standalone   (uses esbuild via npx to bundle the ES modules)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');

const js = execFileSync('npx', ['-y', 'esbuild@0.24.0', 'js/main.js', '--bundle', '--format=iife', '--minify', '--target=es2020'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });

const fonts = read('css/fonts.css').replace(/url\(\.\.\/(assets\/fonts\/[^)]+)\)/g, (_, p) =>
  `url(data:font/woff2;base64,${readFileSync(join(root, p)).toString('base64')})`);
const css = `${fonts}\n${read('css/tokens.css')}\n${read('css/main.css')}`;
const favicon = `data:image/svg+xml;base64,${readFileSync(join(root, 'assets/brand/favicon.svg')).toString('base64')}`;

let html = read('index.html');
const swap = (from, to) => { if (!html.includes(from)) throw new Error(`Pattern not found: ${from}`); html = html.replace(from, () => to); };
html = html.replace(/\s*<link rel="preload"[^>]+>/g, '');
swap('<link rel="stylesheet" href="css/fonts.css">\n  <link rel="stylesheet" href="css/tokens.css">\n  <link rel="stylesheet" href="css/main.css">', `<style>${css}</style>`);
swap('href="assets/brand/favicon.svg"', `href="${favicon}"`);
swap('<script src="js/config.js"></script>\n  <script type="module" src="js/main.js"></script>',
  `<script>${read('js/config.js')}</script>\n  <script>${js.replace(/<\/script/gi, '<\\/script')}</script>`);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'dream-palace.html'), html);
console.log(`dist/dream-palace.html — ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
