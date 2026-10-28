// Frame-exact recorder: node rec.js <lang> <fps> <tStart> <tEnd> <out.mp4|->
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const [,, lang = 'ru', FPS = '60', T0 = '0', T1 = '60', OUT = 'video.mp4'] = process.argv;
const B = 0.75; // beat @80bpm
const KEYS = sec => [ // [beat, y]
  [0, 0], [7, 0], [17, sec.heroEnd], [23, sec.seaEnd], [29, sec.aboutEnd], [31, sec.dayStart], [39, sec.dayEnd], [41, sec.choose],
  [49, sec.choose], [51, sec.ringStart], [59, sec.ringEnd], [60, sec.stripStart], [68, sec.stripEnd], [71, sec.vr], [75, sec.contact], [78, sec.bottom], [81, sec.bottom]
].map(([b, y]) => [b * B, y]);
function hermite(keys) { // monotone cubic (Fritsch–Carlson)
  const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]);
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 3 * (d[i - 1] + d[i]) / ((2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1])) / (xs[i + 1] - xs[i]) * 0 + 3) ;
  for (let i = 1; i < n - 1; i++) if (d[i - 1] * d[i] > 0) { const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]), w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]); m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  return t => {
    if (t <= xs[0]) return ys[0]; if (t >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (t > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], s = (t - xs[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.error('PAGEERROR', e.message));
  await p.goto(`http://localhost:8765/?capture=1&lang=${lang}`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.waitForTimeout(3000);
  const sec = await p.evaluate(() => { scrollTo(0, 0);
    const s = id => document.getElementById(id), vh = innerHeight, top = id => s(id).offsetTop, end = id => s(id).offsetTop + s(id).offsetHeight - vh;
    return { heroEnd: end('hero'), seaEnd: end('sea'), aboutEnd: s('amen').getBoundingClientRect().top + scrollY + s('amen').offsetHeight - vh * 0.85, dayStart: top('day'), dayEnd: end('day'), choose: top('choose') + 40,
      ringStart: top('gallery'), ringEnd: end('gallery'), stripStart: top('progress'), stripEnd: end('progress'), vr: top('vr') + vh * 0.05, contact: top('contact') - vh * 0.05, bottom: document.documentElement.scrollHeight - vh };
  });
  console.log(JSON.stringify(sec));
  const Y = hermite(KEYS(sec));
  const fps = +FPS, dtMs = 1000 / fps;
  const f0 = Math.round(+T0 * fps), f1 = Math.round(+T1 * fps);
  // events on beats
  const hov = [[42, '6'], [43, '5'], [44, '4'], [45, '3'], [46, '2'], [46.75, null]].map(([bb, id]) => [bb * B, id]);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  // warm the page state up to f0 without capturing (cheap: big steps)
  await p.evaluate(([y]) => window.__step(y, 0), [Y(+T0)]);
  let hi = 0, wentGo = false, selected = false;
  const tStart = Date.now();
  for (let f = 0; f <= f1; f++) {
    const t = f / fps;
    if (!wentGo && t >= 0.3) { await p.evaluate(() => window.__go()); wentGo = true; }
    while (hi < hov.length && t >= hov[hi][0]) { await p.evaluate(id => window.__hover(id), hov[hi][1]); hi++; }
    if (!selected && t >= 47.5 * B) { await p.evaluate(() => window.__select('5')); selected = true; }
    await p.evaluate(([y, dt, px, py]) => { window.__pointer(px, py); window.__step(y, dt); }, [Y(t), f === 0 ? 0 : dtMs, Math.sin(t * 0.35) * 0.35, Math.cos(t * 0.27) * 0.25]);
    if (f < f0) continue;
    const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${f1}  t=${t.toFixed(2)}s  elapsed ${((Date.now() - tStart) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await b.close();
})();
