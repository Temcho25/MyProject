import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [url, w, h] = [process.argv[2] || 'http://127.0.0.1:4173/', Number(process.argv[3] || 1440), Number(process.argv[4] || 900)];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const secs = await page.evaluate(() => [...document.querySelectorAll('main > section:not([hidden]), footer')].map((s) => ({ id: s.id || s.className.split(' ')[0], top: s.offsetTop, h: s.offsetHeight })));
await page.mouse.move(w / 2, h / 2);
for (const s of secs) {
  await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.max(0, s.top - h * 0.5));
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.__f = []; let l = performance.now(); window.__run = true; const f = (t) => { window.__f.push(t - l); l = t; if (window.__run) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const end = s.top + s.h - h * 0.5;
  for (let y = Math.max(0, s.top - h * 0.5); y < end; y += 60) { await page.mouse.wheel(0, 60); await page.waitForTimeout(16); }
  const f = await page.evaluate(() => { window.__run = false; return window.__f.slice(2); });
  f.sort((a, b) => a - b);
  console.log(s.id.padEnd(10), 'median', f[Math.floor(f.length / 2)]?.toFixed(1), 'p90', f[Math.floor(f.length * 0.9)]?.toFixed(1));
}
await browser.close();
