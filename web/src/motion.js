// Minimal scroll-motion engine.
// One requestAnimationFrame loop runs only while the page scrolls or resizes, and only
// updates scenes that are near the viewport. Scenes read native scroll; nothing hijacks it.

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (v, a, b) => clamp((v - a) / (b - a));
export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

const scenes = [];
const always = [];
let vh = window.innerHeight;
let vw = window.innerWidth;
let ticking = false;

/**
 * Register a scroll scene.
 * @param {Element} el
 * @param {(p:number, ctx:{rect:DOMRect, vh:number, vw:number}) => void} update
 * @param {{ start?: (rect:DOMRect, vh:number) => number, end?: (rect:DOMRect, vh:number) => number }} opts
 *   start/end return the scroll distance (in px, relative to the element's top) where p = 0 and p = 1.
 */
export function scene(el, update, opts = {}) {
  if (!el) return;
  const s = { el, update, opts, visible: false, last: -1 };
  const io = new IntersectionObserver(
    ([e]) => {
      s.visible = e.isIntersecting;
      if (s.visible) request();
    },
    { rootMargin: '25% 0px 25% 0px' },
  );
  io.observe(el);
  scenes.push(s);
}

/** Run on every frame of scrolling (cheap global work: nav, progress). */
export function onScroll(fn) {
  always.push(fn);
}

function frame() {
  ticking = false;
  const y = window.scrollY;
  for (const fn of always) fn(y, vh, vw);
  for (const s of scenes) {
    if (!s.visible) continue;
    const rect = s.el.getBoundingClientRect();
    const start = s.opts.start ? s.opts.start(rect, vh) : 0;
    const end = s.opts.end ? s.opts.end(rect, vh) : rect.height - vh;
    const travelled = -rect.top;
    const p = clamp((travelled - start) / Math.max(1, end - start));
    if (Math.abs(p - s.last) < 0.0005 && !s.force) continue;
    s.last = p;
    s.force = false;
    s.update(p, { rect, vh, vw });
  }
}

export function request() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(frame);
}

export function refresh() {
  vh = window.innerHeight;
  vw = window.innerWidth;
  scenes.forEach((s) => (s.force = true));
  request();
}

window.addEventListener('scroll', request, { passive: true });
window.addEventListener('resize', refresh);
new ResizeObserver(refresh).observe(document.documentElement);

/** Adds .is-in once an element enters the viewport. */
export function reveal(selector, root = document) {
  const els = root.querySelectorAll(selector);
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
  );
  els.forEach((el) => io.observe(el));
}
