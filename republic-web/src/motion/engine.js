// Scroll-as-camera engine.
// One rAF loop reads scroll once per frame, works from cached offsets (no
// layout reads per frame) and feeds each scene a damped progress value, so
// motion has weight without ever taking scrolling away from the visitor.
// The loop sleeps when everything has settled.

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const scenes = [];
const ambients = new Set();
let running = false;
let lastT = 0;
let lastY = window.scrollY;
let vel = 0; // smoothed px/frame
const listeners = { frame: new Set(), measure: new Set() };

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const range = (p, a, b) => clamp((p - a) / (b - a));
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Register a scroll scene.
 * mode 'sticky': 0 when the section top reaches the viewport top, 1 when its
 *                bottom reaches the viewport bottom (for position: sticky stages).
 * mode 'span':   0 when the top enters at the bottom, 1 when the bottom leaves at the top.
 * tau: damping time constant in ms (0 = no damping).
 */
export function scene(el, update, { mode = 'span', tau = 110, margin = 0.25 } = {}) {
  const s = { el, update, mode, tau, margin, top: 0, height: 0, p: -1, target: 0, visible: false };
  scenes.push(s);
  measureOne(s);
  wake();
  return s;
}

/** Keep the loop alive while fn returns true (used for ambient motion while a scene is visible). */
export function ambient(fn) { ambients.add(fn); wake(); return () => ambients.delete(fn); }
export const onFrame = (fn) => { listeners.frame.add(fn); wake(); };
export const onMeasure = (fn) => listeners.measure.add(fn);

function measureOne(s) {
  const r = s.el.getBoundingClientRect();
  s.top = r.top + window.scrollY;
  s.height = s.el.offsetHeight;
}

export function measure() {
  for (const s of scenes) measureOne(s);
  for (const fn of listeners.measure) fn();
  wake();
}

export function wake() {
  if (running) return;
  running = true;
  lastT = performance.now();
  requestAnimationFrame(tick);
}

function tick(t) {
  const dt = Math.min(64, t - lastT || 16.7);
  lastT = t;
  const y = window.scrollY;
  const vh = window.innerHeight;
  const rawV = y - lastY;
  lastY = y;
  vel += (rawV - vel) * (1 - Math.exp(-dt / 90));
  if (Math.abs(vel) < 0.01) vel = 0;

  let busy = vel !== 0;
  const reduced = reducedMotion.matches;

  for (const s of scenes) {
    const m = vh * s.margin;
    s.visible = y + vh > s.top - m && y < s.top + s.height + m;
    s.target = s.mode === 'sticky'
      ? clamp((y - s.top) / Math.max(1, s.height - vh))
      : clamp((y + vh - s.top) / (vh + s.height));

    if (s.p < 0 || reduced || !s.tau) {
      if (s.p !== s.target || s.p < 0) { s.p = s.target; if (s.visible) s.update(s.p, ctx(t, dt, y, vh)); }
      continue;
    }
    if (s.p === s.target) continue;
    const k = 1 - Math.exp(-dt / s.tau);
    s.p += (s.target - s.p) * k;
    if (Math.abs(s.target - s.p) < 0.0004) s.p = s.target;
    else busy = true;
    if (s.visible) s.update(s.p, ctx(t, dt, y, vh));
  }

  for (const fn of listeners.frame) fn(ctx(t, dt, y, vh));
  for (const fn of ambients) if (fn(ctx(t, dt, y, vh))) busy = true;

  if (busy) requestAnimationFrame(tick);
  else running = false;
}

const ctx = (t, dt, y, vh) => ({ t, dt, y, vh, v: vel });

export function initEngine() {
  addEventListener('scroll', wake, { passive: true });
  let raf = 0;
  const remeasure = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
  addEventListener('resize', remeasure);
  new ResizeObserver(remeasure).observe(document.body);
  document.fonts?.ready.then(remeasure);
  reducedMotion.addEventListener?.('change', () => location.reload());
}
