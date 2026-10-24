// Visual review helper: viewport screenshots at scroll stops, plus console errors.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const url = process.argv[2] || 'http://127.0.0.1:5173/';
const w = Number(process.argv[3] || 1440), h = Number(process.argv[4] || 900);
const lang = process.argv[5] || 'en';
const stops = (process.argv[6] || '0,0.5,1,1.5,2,3,4,5,6,7,8,9,10,11,12,13,14').split(',').map(Number);
const tag = process.argv[7] || `${w}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 600, hasTouch: w < 600 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto(url + '?lang=' + lang, { waitUntil: 'networkidle' });
await page.waitForTimeout(1600);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('scrollHeight', total, 'vh', h);
for (const s of stops) {
  const y = Math.round(s * h);
  if (y > total) break;
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `tests/out/${tag}-${lang}-${String(s).replace('.', '_')}.png` });
}
console.log(errs.length ? errs.join('\n') : 'no console errors');
await browser.close();
