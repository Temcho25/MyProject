// Renders the site into a promo video, frame by frame (deterministic, no dropped frames).
// Usage: node tools/capture.js <siteUrl> <outDir> [fps=60] [w=540] [h=960] [scale=2] [lang=ka] [maxSeconds]
// Needs: playwright (pre-installed), ffmpeg. The site must be served over http.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [url, outDir, FPS = '60', W = '540', H = '960', SCALE = '2', LANG = 'ka', MAX] = process.argv.slice(2);
const fps = +FPS;
fs.mkdirSync(path.join(outDir, 'frames'), { recursive: true });

// Monotone cubic interpolation (Fritsch–Carlson): smooth velocity through keys, no overshoot.
function monotone(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

function wav(left, right, rate) {
  const n = left.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(left[i] * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(right[i] * 32767))), 46 + i * 4);
  }
  return buf;
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const mobile = +W < +H;
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: +SCALE, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto(`${url}?capture&lang=${LANG}`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForFunction(() => window.__capture && !document.querySelector('#loader'), { timeout: 120000 });
  await page.evaluate(() => window.__capture.ready());
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
    await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })));
    await document.fonts.ready;
    window.ScrollTrigger.refresh();
  });
  await page.waitForTimeout(1500);

  // Anchors from the live layout (pin spacers included).
  const A = await page.evaluate(() => {
    const top = (s) => { const e = document.querySelector(s); return e.getBoundingClientRect().top + scrollY; };
    const st = window.ScrollTrigger.getAll();
    const pin = st.find((s) => s.pin);
    const wine = st.find((s) => s.trigger && s.trigger.classList && s.trigger.classList.contains('wine__grid'));
    const vh = innerHeight;
    return {
      vh, max: document.documentElement.scrollHeight - vh,
      story: top('#story'), storyEnd: top('#specials') - vh * 0.75,
      spStart: pin.start, spEnd: pin.end,
      qr: top('#qrmenu'), bar: top('#bar'), deck: top('#deck'), art: top('#art'),
      wineStart: wine.start, wineEnd: wine.end, wine: top('#wine'),
      spaces: top('#spaces'), route: top('#route'), map: top('#map'), reserve: top('#reserve'), footer: top('.footer'),
    };
  });
  console.log('anchors', JSON.stringify(A));

  // Camera path: [seconds, scrollY]. Holds where the guest should read; continuous motion elsewhere.
  const K = [
    [0, 0], [3.6, 0],
    [5.2, A.story + A.vh * 0.5], [7.8, A.story + A.vh * 1.7], [10.2, A.storyEnd],
    [10.9, A.spStart], [15.6, A.spEnd],
    [17.0, A.qr + A.vh * 0.1], [18.9, A.qr + A.vh * 0.75],
    [20.6, A.bar + A.vh * 0.05], [22.6, A.deck - A.vh * 0.25], [24.2, A.art - A.vh * 0.2],
    [25.6, A.wineStart + A.vh * 0.1], [30.6, A.wineEnd - A.vh * 0.05],
    [32.4, A.spaces + A.vh * 0.05], [34.6, A.spaces + A.vh * 0.6],
    [36.2, A.map - A.vh * 0.45], [38.2, A.map - A.vh * 0.02],
    [39.6, A.reserve], [41.0, A.reserve + A.vh * 0.25],
    [42.6, A.footer], [43.6, Math.min(A.max, A.footer + A.vh * 0.2)],
  ];
  const Y = monotone(K.map((k) => k[0]), K.map((k) => Math.max(0, Math.min(A.max, k[1]))));
  const MENU_AT = 44.2;            // the QR menu opens over the footer
  const LANGS = [[47.4, 'en'], [49.2, 'ru'], [51.0, 'ka']];
  const menuY = monotone([45.0, 46.6, 47.6, 50.6, 51.4], [0, 0, 650, 1700, 1750]);
  const DURATION = MAX ? +MAX : 53.5;
  const N = Math.round(DURATION * fps);

  await page.evaluate(() => window.__capture.begin());
  const accents = [{ t: 0.55, idx: 0, vel: 0.5 }];
  let seenPlucks = 0, menuOpen = false, langI = 0;
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const t = i / fps;
    if (!menuOpen && t >= MENU_AT) { menuOpen = true; await page.evaluate(() => window.__capture.openMenu()); accents.push({ t, idx: 3, vel: 0.55 }); }
    if (langI < LANGS.length && t >= LANGS[langI][0]) {
      const l = LANGS[langI][1]; langI++;
      await page.evaluate((l) => document.querySelector(`.menu-app__top [data-lang="${l}"]`).click(), l);
      accents.push({ t, idx: 4 + (langI % 2), vel: 0.4 });
    }
    await page.evaluate(([t, y, m]) => { window.__capture.frame(t, y); if (m != null) window.__capture.menuScroll(m); }, [t, Y(t), menuOpen ? menuY(t) : null]);
    const pl = await page.evaluate(() => window.__capture.plucks.length);
    if (pl > seenPlucks) {
      const news = await page.evaluate((s) => window.__capture.plucks.slice(s), seenPlucks);
      news.forEach((p) => accents.push({ t, idx: p.i, vel: 0.55 }));
      seenPlucks = pl;
    }
    await page.screenshot({ path: path.join(outDir, 'frames', String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    if (i % 120 === 0) console.log(`frame ${i}/${N}  ${((Date.now() - t0) / 1000 / (i + 1)).toFixed(2)} s/frame`);
  }

  // Sound: same synth as the site, rendered offline with accents at the frames where scenes fired them.
  const clean = accents.filter((a, k) => k === 0 || a.t - accents[k - 1].t > 0.3);
  fs.writeFileSync(path.join(outDir, 'accents.json'), JSON.stringify(clean, null, 1));
  const audio = await page.evaluate(async ([dur, ev]) => {
    const buf = await window.SasperiaAudio.renderOffline(dur, ev.map((e) => ({ t: e.t, idx: e.idx, vel: e.vel })), 48000);
    const enc = (a) => { const u = new Uint8Array(a.buffer); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
    return { l: enc(buf.getChannelData(0)), r: enc(buf.getChannelData(1)), rate: buf.sampleRate };
  }, [DURATION, clean]);
  const f32 = (b64) => { const b = Buffer.from(b64, 'base64'); return new Float32Array(b.buffer, b.byteOffset, b.length / 4); };
  fs.writeFileSync(path.join(outDir, 'audio.wav'), wav(f32(audio.l), f32(audio.r), audio.rate));
  await browser.close();

  const out = path.join(outDir, `sasperia-${W * SCALE}x${H * SCALE}-${fps}fps.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(outDir, 'frames', '%05d.jpg'),
    '-i', path.join(outDir, 'audio.wav'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', out]);
  console.log('done', out, ((Date.now() - t0) / 60000).toFixed(1), 'min');
})();
