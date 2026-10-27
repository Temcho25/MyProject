import { createScene, COLORWAYS } from './scene.js';
import { createSound } from './sound.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = x => x * x * (3 - 2 * x);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const REVIEW = params.has('review');

// ── режим съёмки карточек: ?shot=0&ry=0.6
if (params.has('shot')) {
  document.documentElement.classList.add('shot');
  document.body.innerHTML = '<canvas id="gl" style="position:fixed;inset:0;width:100%;height:100%;opacity:1"></canvas>';
  document.body.style.background = 'transparent'; document.documentElement.style.background = 'transparent';
  const sc = await createScene($('#gl'), { capture: true });
  sc.snapshot(+params.get('shot'), +(params.get('ry') || 0.5), innerWidth, innerHeight);
  window.__shotReady = true;
  throw new Error('shot mode');   // дальше страница не нужна
}

// ── разбивка текста на буквы
$$('.split').forEach(el => {
  const txt = el.textContent; el.textContent = ''; el.setAttribute('aria-label', txt);
  let i = 0;
  for (const word of txt.split(/(\s+)/)) {
    if (/^\s+$/.test(word)) { el.append(' '); continue; }
    const w = document.createElement('span'); w.style.display = 'inline-block'; w.style.whiteSpace = 'nowrap'; w.setAttribute('aria-hidden', 'true');
    for (const ch of word) { const c = document.createElement('span'); c.className = 'char'; c.textContent = ch; c.style.setProperty('--i', i++); w.append(c); }
    el.append(w);
  }
});

// ── загрузка
const loadNum = $('#loadNum'), loadBar = $('#loadBar');
let shown = 0, real = 0;
const loadTick = setInterval(() => { shown += (Math.max(real, Math.min(0.9, shown + 0.02)) - shown) * 0.25; loadNum.textContent = Math.round(shown * 100); loadBar.style.width = shown * 100 + '%'; }, 40);

const canvas = $('#gl');
let scene;
window.__dbg = () => scene;
try {
  scene = await createScene(canvas, { onProgress: p => { real = p; } });
} catch (e) { console.error(e); }
await document.fonts.ready;
real = 1;
await new Promise(r => setTimeout(r, 450));
clearInterval(loadTick); loadNum.textContent = '100'; loadBar.style.width = '100%';
await new Promise(r => setTimeout(r, 250));
$('#loader').classList.add('is-done');
document.documentElement.classList.add('is-ready');
const introStart = performance.now() + 250;

// ── появление при попадании в кадр
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.2 });
$$('.reveal, .h2 .split, .foot__word .split').forEach(el => io.observe(el));
setTimeout(() => { $$('.hero .split, .hero .reveal').forEach(el => el.classList.add('is-in')); $$('.giant .split').forEach(el => el.classList.add('is-in')); }, 550);

// ── секции и сюжетная ось s
const secs = ['#hero', '#anatomy', '#colors', '#drops', '#visit'].map(s => $(s));
function secProgress(el, i) {
  const r = el.getBoundingClientRect(), vh = innerHeight;
  if (i === 4) return clamp((vh - r.top) / vh);
  return clamp(-r.top / Math.max(1, r.height - vh));
}
function storyS() {
  for (let i = secs.length - 1; i >= 0; i--) {
    const p = secProgress(secs[i], i);
    const r = secs[i].getBoundingClientRect();
    if (i === 4 ? r.top < innerHeight : r.top <= 0) return i + p;
  }
  return 0;
}

// ── часы: модуль Rolex-сцены грузим, когда секция близко
const watchSec = $('#watch'), watchItems = $$('#watchParts li');
let watchLoaded = false;
new IntersectionObserver(es => { if (!watchLoaded && es.some(e => e.isIntersecting)) { watchLoaded = true; import('./watch/watch3d.js'); } }, { rootMargin: '150% 0px' }).observe(watchSec);

// ── мышь
let mx = 0, my = 0, tmx = 0, tmy = 0;
addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { tmx = e.clientX / innerWidth * 2 - 1; tmy = e.clientY / innerHeight * 2 - 1; } }, { passive: true });

// ── звук
const sound = createSound();
const soundBtn = $('#sound');
soundBtn.addEventListener('click', () => { const on = sound.toggle(); soundBtn.setAttribute('aria-pressed', on); });

// ── цвета: управление прокруткой + клик по свотчу
const cwName = $('#cwName'), cwSub = $('#cwSub'), cwNum = $('#cwNum');
const swBtns = $$('#swatches button');
let cwShown = -1;
function showColorway(i) {
  if (i === cwShown) return; cwShown = i;
  const c = COLORWAYS[i];
  document.documentElement.style.setProperty('--accent', c.accent);
  swBtns.forEach((b, j) => b.classList.toggle('is-active', j === i));
  cwNum.textContent = String(i + 1).padStart(2, '0');
  cwSub.textContent = c.sub;
  // буквы названия «прокручиваются» как табло
  cwName.innerHTML = '';
  [...c.name].forEach((ch, j) => {
    const s = document.createElement('span'); s.className = 'char'; s.textContent = ch === ' ' ? ' ' : ch;
    s.animate([{ transform: 'translateY(60%) rotateX(-80deg)', opacity: 0, filter: 'blur(8px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }],
      { duration: 700, delay: j * 35, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    cwName.append(s);
  });
  scene?.setColorway(i);
  sound.blip(i);
}
swBtns.forEach(b => b.addEventListener('click', () => {
  const i = +b.dataset.i, el = secs[2];
  const top = el.offsetTop + (el.offsetHeight - innerHeight) * ((i + 0.5) / COLORWAYS.length);
  scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
}));

// ── подписи анатомии
const shots = $$('.shot__frame');
shots.forEach(f => {
  f.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = f.getBoundingClientRect(); f.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`); f.style.setProperty('--rx', `${(0.5 - (e.clientY - r.top) / r.height) * 6}deg`); });
  f.addEventListener('pointerleave', () => { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
});
const tags = $$('.tag'), explodeNum = $('#explodeNum'), anaHead = $('.anatomy__head'), chapterEl = $('#chapter');

// ── горизонтальная лента карточек
const rail = $('#rail');
const cards = $$('.card');
cards.forEach(card => {
  const inner = $('.card__in', card);
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    inner.style.setProperty('--ry', `${(px - 0.5) * 16}deg`); inner.style.setProperty('--rx', `${(0.5 - py) * 12}deg`);
    inner.style.setProperty('--mx', `${px * 100}%`); inner.style.setProperty('--my', `${py * 100}%`);
  });
  card.addEventListener('pointerleave', () => { inner.style.setProperty('--ry', '0deg'); inner.style.setProperty('--rx', '0deg'); });
});

// ── магнитные кнопки
$$('.magnetic').forEach(el => {
  el.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`; });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

// ── навигация
const nav = $('#nav'), navLinks = $$('.nav__links a');
const chapterNum = $('#chapterNum'), chapterName = $('#chapterName'), progress = $('#progress');
const giant = $('#giant'), giantRows = $$('.giant__row'), ticker = $('#ticker'), footWord = $('#footWord');
const root = document.documentElement;
$('#year').textContent = new Date().getFullYear();

let lastY = scrollY, vel = 0, sSm = storyS(), tickerX = 0, curChapter = '';
let last = performance.now();
function frame(now) {
  const dt = REVIEW ? 0.6 : Math.min(0.05, (now - last) / 1000); last = now;
  const t = now / 1000;
  const y = scrollY, dy = y - lastY; lastY = y;
  vel += (dy / Math.max(dt, 1e-3) - vel) * (1 - Math.exp(-dt * 8));
  const sTarget = storyS();
  sSm += (sTarget - sSm) * (1 - Math.exp(-dt * (reduced ? 30 : 6)));
  if (Math.abs(sTarget - sSm) < 1e-4 || REVIEW) sSm = sTarget;
  mx += (tmx - mx) * (1 - Math.exp(-dt * 3)); my += (tmy - my) * (1 - Math.exp(-dt * 3));

  // глава
  const ci = Math.min(4, Math.floor(sSm + 0.02));
  const wr = watchSec.getBoundingClientRect(), inWatch = wr.top <= innerHeight * 0.3 && wr.bottom > innerHeight * 0.5;
  const chSec = inWatch ? watchSec : secs[ci];
  const [num, name] = chSec.dataset.chapter.split('|');
  if (inWatch) { const wp = window.__watchP || 0; watchItems.forEach(li => li.classList.toggle('is-on', wp >= +li.dataset.at)); }
  if (num !== curChapter) {
    curChapter = num; chapterNum.textContent = num; chapterName.textContent = name;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + chSec.id));
    if (ci > 0) sound.whoosh();
    chapterEl.classList.toggle('is-hidden', ci === 4);
    chSec.querySelectorAll('.split, .reveal').forEach(el => el.classList.add('is-in'));
  }
  progress.style.transform = `scaleY(${y / Math.max(1, document.documentElement.scrollHeight - innerHeight)})`;
  nav.classList.toggle('is-hidden', dy > 2 && y > innerHeight * 0.6 && ci !== 4);
  if (dy < -2) nav.classList.remove('is-hidden');

  // гигантские буквы: параллакс по глубине + смаз по скорости
  const heroP = clamp(sSm);
  const gOut = smooth(clamp((sSm - 0.15) / 0.75));
  giant.style.opacity = String(1 - gOut);
  const blur = Math.min(8, Math.abs(vel) / 600);
  giantRows.forEach((row, i) => {
    const d = +row.dataset.depth;
    const dir = i % 2 ? -1 : 1;
    row.style.transform = `translate3d(${dir * heroP * 30 * d + mx * -12 * d}vw, ${-heroP * 12 * d + my * -10 * d}vh, 0) scale(${1 + heroP * 0.25 * d})`;
    row.style.filter = blur > 0.4 ? `blur(${blur * d}px)` : '';
  });
  root.style.setProperty('--gx', `${62 + mx * 6}%`); root.style.setProperty('--gy', `${48 + my * 6}%`);
  root.style.setProperty('--sy', y);

  // анатомия: подписи на проекциях якорей
  if (scene) {
    const ex = scene.explode;
    explodeNum.textContent = String(Math.round(ex * 4)).padStart(2, '0');
    anaHead.style.opacity = String(1 - ex);
    anaHead.style.transform = `translate3d(0, ${-ex * 30}px, 0)`;
    const narrow = innerWidth < 900;
    // подписи — колонкой слева, линия тянется от точки на слое к плашке
    const colX = narrow ? 16 + 128 : Math.max(240, innerWidth * 0.06 + 250);
    tags.forEach(tag => {
      const i = +tag.dataset.slice, a = scene.anchors[i];
      const vis = smooth(clamp((ex - 0.55 - (3 - i) * 0.06) / 0.25)) * a.v;
      const ty = innerHeight * (narrow ? 0.30 + (3 - i) * 0.13 : 0.30 + (3 - i) * 0.165);
      const dx = colX - a.x, dyy = ty - a.y;
      const len = Math.max(0, Math.hypot(dx, dyy) - 6), ang = Math.atan2(dyy, dx) * 180 / Math.PI;
      tag.style.opacity = vis;
      tag.style.transform = `translate3d(${a.x}px, ${a.y}px, 0)`;
      tag.style.setProperty('--len', len + 'px');
      tag.style.setProperty('--ang', ang + 'deg');
      tag.style.setProperty('--k', vis);
      tag.style.setProperty('--bx', dx + 'px');
      tag.style.setProperty('--by', dyy + 'px');
      tag.style.setProperty('--tx', '-100%');
    });
  }

  // цвета: какая расцветка соответствует прокрутке
  if (sSm >= 1.98 && sSm < 3.05) {
    const p = clamp((sSm - 2) / 0.96);
    showColorway(Math.min(COLORWAYS.length - 1, Math.floor(p * COLORWAYS.length)));
  } else if (sSm < 1.9 && cwShown !== 0 && cwShown !== -1) showColorway(0);
  else if (cwShown === -1) showColorway(0);

  // лента карточек: вертикальный скролл → горизонтальный проезд с инерцией
  {
    const p = secProgress(secs[3], 3);
    const max = rail.scrollWidth - innerWidth;
    const x = -max * smooth(p) ;
    rail.style.transform = `translate3d(${x}px,0,0)`;
    const skew = clamp(vel / 2500, -1, 1) * 6;
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect(); const cx = (r.left + r.width / 2) / innerWidth - 0.5;
      c.style.transform = `perspective(1400px) rotateY(${cx * -18}deg) translateZ(${-Math.abs(cx) * 120}px) skewX(${skew}deg)`;
    });
  }

  // бегущая строка: скорость и направление от прокрутки
  tickerX -= (60 + Math.abs(vel) * 0.25) * dt * (vel < -5 ? -1 : 1);
  const tw = ticker.scrollWidth / 2; if (tickerX < -tw) tickerX += tw; if (tickerX > 0) tickerX -= tw;
  ticker.style.transform = `translate3d(${tickerX}px,0,0) skewX(${clamp(-vel / 3000, -1, 1) * 10}deg)`;

  // финальное слово: буквы собираются по мере подхода
  {
    const r = footWord.getBoundingClientRect(); const p = clamp((innerHeight - r.top) / (innerHeight * 0.7));
    footWord.querySelectorAll('.char').forEach((c, i, all) => {
      const d = (i / all.length - 0.5);
      const k = 1 - smooth(clamp(p * 1.3 - Math.abs(d) * 0.3));
      c.style.transform = `translate3d(${d * 60 * k}vw, ${k * 40}%, 0) rotate(${d * 40 * k}deg)`;
      c.style.opacity = 1 - k * 0.9;
    });
  }

  // фото магазина: раскрытие маской + параллакс внутри рамки
  shots.forEach(f => {
    const r = f.getBoundingClientRect(), vh = innerHeight;
    const enter = clamp((vh - r.top) / (vh * 0.55));
    const mid = (r.top + r.height / 2 - vh / 2) / vh;
    f.style.setProperty('--clip', `${(1 - smooth(enter)) * 100}%`);
    f.style.setProperty('--py', `${mid * -60}px`);
    f.style.setProperty('--sc', String(1.15 - smooth(enter) * 0.08));
  });
  // смаз при «кручёной склейке» Dunk → AJ1
  if (scene) { const b = sSm > 0.55 && sSm < 1.05 ? Math.min(10, scene.spinVel * (reduced ? 0 : 2.2)) : 0; canvas.style.filter = b > 0.3 ? `blur(${b.toFixed(1)}px)` : ''; }
  root.style.setProperty('--tint', sSm < 0.8 || sSm > 3.6 ? '0.25' : '1');

  sound.update(vel, sSm);

  if (scene) {
    const st = scene.state;
    st.s = sSm; st.mouseX = reduced ? 0 : mx; st.mouseY = reduced ? 0 : my;
    st.intro = clamp((now - introStart) / 1600);
    st.intro = st.intro >= 1 || REVIEW ? 1 : 1 - Math.pow(1 - st.intro, 3);
    scene.update(dt, t);
  }
  requestAnimationFrame(frame);
}
addEventListener('resize', () => scene?.resize());
requestAnimationFrame(frame);
