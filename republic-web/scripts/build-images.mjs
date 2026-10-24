// Builds responsive derivatives from untouched originals.
// Originals in assets-src/originals/ are never modified or overwritten.
// Never upscales: widths above the original's width are skipped.
import sharp from 'sharp';
import { readdir, mkdir, writeFile, copyFile, access } from 'node:fs/promises';
import { join, parse } from 'node:path';

const SRC = 'assets-src/originals';
const OUT = 'public/img';
const WIDTHS = [480, 800, 1200, 1600, 2000, 2560];
const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif', '.heic']);

await mkdir(OUT, { recursive: true });
const manifest = {};
const files = (await readdir(SRC)).filter((f) => exts.has(parse(f).ext.toLowerCase()));

for (const f of files) {
  const { name } = parse(f);
  const input = join(SRC, f);
  const img = sharp(input, { failOn: 'none' }).rotate(); // respect EXIF orientation
  const meta = await img.metadata();
  const ow = meta.autoOrient?.width ?? meta.width;
  const oh = meta.autoOrient?.height ?? meta.height;
  const widths = WIDTHS.filter((w) => w <= ow);
  if (!widths.length || widths[widths.length - 1] < ow) widths.push(Math.min(ow, 2560));
  const uniq = [...new Set(widths)].sort((a, b) => a - b);

  for (const w of uniq) {
    const base = sharp(input, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true });
    // Gentle quality settings: food photography shows artefacts first.
    await base.clone().avif({ quality: 62, effort: 5 }).toFile(join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 82 }).toFile(join(OUT, `${name}-${w}.webp`));
    await base.clone().jpeg({ quality: 84, mozjpeg: true, progressive: true }).toFile(join(OUT, `${name}-${w}.jpg`));
  }
  const { dominant } = await sharp(input).stats();
  manifest[name] = { w: ow, h: oh, widths: uniq, color: `rgb(${dominant.r},${dominant.g},${dominant.b})` };
  if (ow < 1600) console.warn(`! ${f}: only ${ow}px wide — do not use it full-bleed.`);
  console.log(`✓ ${f} ${ow}×${oh} → ${uniq.join(', ')}`);
}

// Official logo, if supplied.
try {
  await access('assets-src/brand/logo.svg');
  await copyFile('assets-src/brand/logo.svg', 'public/brand/logo.svg');
  manifest.__logo = { svg: '/brand/logo.svg' };
  console.log('✓ logo.svg');
} catch { /* no official logo yet: typographic wordmark is used */ }

await writeFile('src/content/images.generated.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`${files.length} image(s) processed.`);
