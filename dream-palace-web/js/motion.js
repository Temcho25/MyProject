// Motion engine: one rAF loop, damped scroll progress per scene, reveal observer.
// Scroll is never hijacked; scenes only read the native scroll position.

const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
const mqCompact = matchMedia('(max-width: 759px), (pointer: coarse)');

export const motion = {
  get reduced() { return mqReduced.matches; },
  get compact() { return mqCompact.matches; },
};

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (p, a, b) => clamp((p - a) / (b - a)); // local 0..1 of p within [a,b]
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// Damped spring-like settle with a small overshoot (weight of a slab landing).
export const settle = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

const scenes = [];
let raf = 0;
let last = 0;
let vh = innerHeight;

/**
 * Register a scroll scene.
 * mode 'pin': 0 when the section top reaches the viewport top, 1 when its bottom reaches the viewport bottom.
 * mode 'exit': 0 at the top, 1 when the section has fully scrolled out.
 * mode 'through': 0 when entering from below, 1 when leaving at the top.
 */
export function scene(el, update, { mode = 'pin', damping = 7 } = {}) {
  const s = { el, update, mode, damping, top: 0, height: 0, value: -1, target: 0, active: true };
  measure(s);
  s.target = raw(s);
  s.value = motion.reduced ? 1 : s.target;
  update(motion.reduced ? finalFor(s) : s.value, 0);
  scenes.push(s);
  new IntersectionObserver(([e]) => { s.active = e.isIntersecting; if (s.active) kick(); }, { rootMargin: '20% 0px' }).observe(el);
  return s;
}
const finalFor = (s) => (s.mode === 'exit' ? 0 : 1); // reduced motion: hero stays composed; scenes show finished state

function measure(s) {
  const r = s.el.getBoundingClientRect();
  s.top = r.top + scrollY;
  s.height = r.height;
}
function raw(s) {
  const y = scrollY;
  if (s.mode === 'pin') return clamp((y - s.top) / Math.max(1, s.height - vh));
  if (s.mode === 'exit') return clamp((y - s.top) / Math.max(1, s.height));
  return clamp((y + vh - s.top) / Math.max(1, s.height + vh));
}

function tick(now) {
  raf = 0;
  const dt = Math.min(0.064, (now - (last || now)) / 1000) || 1 / 60;
  last = now;
  let moving = false;
  for (const s of scenes) {
    if (!s.active) continue;
    if (motion.reduced) { if (s.value !== finalFor(s)) { s.value = finalFor(s); s.update(s.value, 0); } continue; }
    s.target = raw(s);
    const prev = s.value;
    // Frame-rate independent exponential damping: camera-like inertia without scroll-jacking.
    const k = 1 - Math.exp(-s.damping * dt);
    s.value = Math.abs(s.target - s.value) < 0.0004 ? s.target : lerp(s.value, s.target, k);
    if (s.value !== prev) s.update(s.value, (s.value - prev) / dt);
    if (s.value !== s.target) moving = true;
  }
  for (const fn of tickers) if (fn(dt, now)) moving = true;
  if (moving) kick(); else last = 0;
}
export function kick() { if (!raf) raf = requestAnimationFrame(tick); }

// Extra per-frame callbacks (e.g. pointer parallax). Return true while still animating.
const tickers = new Set();
export function ticker(fn) { tickers.add(fn); kick(); return () => tickers.delete(fn); }

function remeasure() { vh = innerHeight; scenes.forEach(measure); kick(); }
addEventListener('scroll', kick, { passive: true });
addEventListener('resize', remeasure);
new ResizeObserver(remeasure).observe(document.body);
mqReduced.addEventListener?.('change', () => { document.documentElement.classList.toggle('reduced-motion', mqReduced.matches); remeasure(); });

// One-shot reveals. Elements get .is-in once and stay revealed.
let revealIO;
export function reveals(root = document) {
  revealIO ??= new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.dispatchEvent(new CustomEvent('reveal'));
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  root.querySelectorAll('[data-reveal-stagger]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
  root.querySelectorAll('[data-reveal], [data-reveal-stagger], [data-draw-on-view]').forEach((el) => {
    if (motion.reduced) { el.classList.add('is-in', 'is-drawn'); return; }
    revealIO.observe(el);
  });
}

/** Count numbers up inside el when it is revealed. */
export function countUp(el) {
  el.querySelectorAll('[data-count]').forEach((n) => {
    const to = parseFloat(n.dataset.count);
    const dec = parseInt(n.dataset.decimals || '0', 10);
    const loc = document.documentElement.lang === 'en' ? 'en-GB' : 'ru-RU'; // ka uses decimal comma too
    const f = new Intl.NumberFormat(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (motion.reduced) { n.textContent = f.format(to); return; }
    const start = performance.now();
    const dur = 1400;
    const step = (now) => {
      const t = clamp((now - start) / dur);
      n.textContent = f.format(to * easeOut(t));
      if (t < 1) requestAnimationFrame(step);
    };
    n.textContent = f.format(0);
    requestAnimationFrame(step);
  });
}

/** Simple tween helper for discrete UI state changes (plan morphs etc.). */
export function tween(dur, onFrame, ease = easeInOut) {
  if (motion.reduced) { onFrame(1); return { stop() {} }; }
  let stopped = false;
  const t0 = performance.now();
  const step = (now) => {
    if (stopped) return;
    const t = clamp((now - t0) / dur);
    onFrame(ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return { stop() { stopped = true; } };
}

document.documentElement.classList.toggle('reduced-motion', mqReduced.matches);
