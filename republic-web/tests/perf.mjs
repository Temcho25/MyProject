// Frame-time sampling while wheel-scrolling the whole page. Headless Chromium
// renders without a GPU, so absolute numbers are pessimistic; use for relative checks.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [url, w, h, throttle] = [process.argv[2] || 'http://127.0.0.1:4173/', Number(process.argv[3] || 390), Number(process.argv[4] || 844), Number(process.argv[5] || 4)];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h } });
const cdp = await page.context().newCDPSession(page);
await page.goto(url, { waitUntil: 'networkidle' });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
await page.evaluate(() => { window.__f = []; let l = performance.now(); const f = (t) => { window.__f.push(t - l); l = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await page.mouse.move(w / 2, h / 2);
for (let y = 0; y < total; y += 80) { await page.mouse.wheel(0, 80); await page.waitForTimeout(16); }
const f = await page.evaluate(() => window.__f.slice(5));
const cls = await page.evaluate(() => new Promise((r) => { let v = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value; }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => r(v), 300); }));
f.sort((a, b) => a - b);
const pct = (p) => f[Math.floor(f.length * p)].toFixed(1);
console.log(`${w}x${h} cpu×${throttle}: frames ${f.length}, median ${pct(0.5)}ms, p90 ${pct(0.9)}ms, p99 ${pct(0.99)}ms, >50ms ${(100 * f.filter((x) => x > 50).length / f.length).toFixed(1)}%  CLS ${cls.toFixed(3)}`);
await browser.close();
