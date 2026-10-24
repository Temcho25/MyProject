// Records a real-time scroll-through (wheel input) for motion review.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [w, h, lang, out] = [Number(process.argv[2] || 1440), Number(process.argv[3] || 900), process.argv[4] || 'en', process.argv[5] || 'tests/out/vid'];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w, height: h } }, isMobile: w < 600, hasTouch: w < 600 });
const page = await ctx.newPage();
await page.goto((process.argv[6] || 'http://127.0.0.1:5173/') + '?lang=' + lang, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.mouse.move(w * 0.6, h * 0.5);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
let y = 0;
const t0 = Date.now();
while (y < total) {
  await page.mouse.wheel(0, 60);
  await page.waitForTimeout(16);
  y = await page.evaluate(() => scrollY);
  if (Date.now() - t0 > 90000) break;
}
// linger in the closing scene with pointer movement
for (let i = 0; i < 60; i++) { await page.mouse.move(w * (0.2 + i / 100), h * 0.4); await page.waitForTimeout(30); }
await page.waitForTimeout(800);
await ctx.close();
await browser.close();
console.log('done', (Date.now() - t0) / 1000, 's');
