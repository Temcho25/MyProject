// Downloads the official photographs used on the site into assets-src/originals/.
// Sources are Republic's own pages on silkhospitality.com (operator of the venue).
// Originals are kept out of git; derivatives in public/img/ are committed.
import { mkdir, writeFile, access } from 'node:fs/promises';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';

const M = 'https://silkhospitality.com/media/';
export const sources = {
  hero: M + 'zdrcuzp0/republic-terrace-3.jpg',          // rooftop terrace, Radisson Blu Iveria behind
  intro: M + 'szyhepfs/republic-restaurant.jpg',         // dining room, Republic emblem on the glass
  'seq-1': M + 'imuluzce/republic-restaurant-4.jpg',     // glazed terrace room, afternoon
  'seq-2': M + 'xmsfvhgi/republic-restaurant-3.jpg',     // evening service, candle
  'seq-3': M + 'zjdpkd4d/republic-gallery-7.jpg',        // plate being served (Republic gallery)
  terrace: M + 't3mdcgmr/resp-rest-new-4.jpg',           // terrace with planters and city view
  'room-1': M + 'atmbdc2t/republic.jpg',                 // the building on the square, TV tower above
  'room-2': M + 'dsilkshi/republic-gallery-1.jpg',       // facade
  'room-3': M + 'lyzblr04/republic-history-3.jpg',       // "Restaurant & Terrace" sign at night
  'square-1': M + 'aeppqoz4/republic-history-2.jpg',     // the concrete arches, colour
  'square-2': M + '2vnke5fl/republic-history-1.jpg',     // parade on the square, b/w
  'square-3': M + 'ixneq1q2/republic-history.jpg',       // aerial, b/w
  evenings: M + 'gvnnx5xz/respu-coming-soon.jpeg',       // night interior; cropped above its "coming soon" text
};
// Crops applied before deriving (only to remove overlaid text, never to alter content).
const crops = { evenings: { left: 0, top: 0, width: 1600, height: 520 } };

await mkdir('assets-src/originals', { recursive: true });
for (const [name, url] of Object.entries(sources)) {
  const ext = url.split('.').pop();
  const dest = `assets-src/originals/${name}.${ext}`;
  try { await access(dest); continue; } catch {}
  // curl honours HTTPS_PROXY / system CA settings in sandboxed and CI environments.
  let buf;
  try { buf = execFileSync('curl', ['-sSfL', '-A', 'Mozilla/5.0', '-m', '120', url], { maxBuffer: 1 << 28 }); }
  catch (e) { console.error('✗', name, e.message.split('\n')[0]); continue; }
  if (crops[name]) buf = await sharp(buf).extract(crops[name]).jpeg({ quality: 95 }).toBuffer();
  await writeFile(dest, buf);
  console.log('✓', name, (buf.length / 1024 | 0) + 'KB');
}
