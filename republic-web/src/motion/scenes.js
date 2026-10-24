// The choreography. Each function wires one storyboard scene (docs/DIRECTION.md).
import { scene, ambient, onFrame, onMeasure, range, clamp, easeInOut, easeOut, reducedMotion } from './engine.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const desktop = matchMedia('(min-width: 900px)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const motionOn = () => !reducedMotion.matches;

export const state = { heroTone: 'dark' };

/* 01 Hero — the full-bleed plate contracts into a window; the table is set. */
function hero() {
  const el = $('[data-scene="hero"]');
  const intro = $('[data-hero-intro]');
  if (!el || !motionOn()) return;
  scene(el, (p) => {
    const e = easeInOut(range(p, 0.04, 0.8));
    el.style.setProperty('--e', e.toFixed(4));
    el.style.setProperty('--e2', range(e, 0.5, 1).toFixed(4));
    // Re-playable: the heading reveals as the window settles, resets if you scroll back.
    if (e > 0.62) intro.querySelectorAll('[data-split]').forEach((n) => n.classList.add('is-in'));
    else if (e < 0.35) intro.querySelectorAll('[data-split]').forEach((n) => n.classList.remove('is-in'));
    state.heroTone = e > 0.42 ? 'light' : 'dark';
  }, { mode: 'sticky', tau: 120 });
}

/* 02 Intro — a hairline drawn by scrolling, the cloth being laid. */
function rule() {
  const el = $('[data-scene="rule"]');
  if (!el || !motionOn()) return;
  scene(el, (p) => el.style.setProperty('--p', easeOut(range(p, 0.1, 0.6)).toFixed(4)), { tau: 140 });
}

/* 03 Kitchen — frames rise like a lit curtain; the previous one recedes. */
function kitchen() {
  const el = $('[data-scene="kitchen"]');
  if (!el) return;
  const frames = $$('[data-frame]', el);
  if (!motionOn()) { el.dataset.active = '0'; return; }
  const windows = [[0.18, 0.42], [0.55, 0.79]];
  scene(el, (p) => {
    const r = [1, ...windows.map(([a, b]) => easeInOut(range(p, a, b)))];
    frames.forEach((f, i) => {
      f.style.setProperty('--r', r[i].toFixed(4));
      f.style.setProperty('--n', (r[i + 1] ?? 0).toFixed(4));
    });
    const active = r[2] > 0.5 ? 2 : r[1] > 0.5 ? 1 : 0;
    if (el.dataset.active !== String(active)) el.dataset.active = String(active);
    el.style.setProperty('--progress', p.toFixed(4));
  }, { mode: 'sticky', tau: 100 });
}

/* 05 The room — vertical scroll drives a horizontal track; cards sit at three depths. */
function room() {
  const el = $('[data-scene="room"]');
  if (!el) return;
  const track = $('[data-track]', el);
  const cards = $$('.card', track);
  const ghost = $('.room__ghost', el);
  const trail = $('.room__trail', el);
  const idx = $('[data-room-index]', el);
  let dist = 0, pinned = false, sc = null;

  const setIndex = (i) => { idx.textContent = String(i + 1).padStart(2, '0'); };

  const layout = () => {
    pinned = motionOn() && desktop.matches;
    el.classList.toggle('is-pinned', pinned);
    if (pinned) {
      dist = Math.max(0, track.scrollWidth - window.innerWidth);
      el.style.height = `${dist + window.innerHeight}px`;
    } else {
      el.style.height = '';
      track.style.transform = '';
      cards.forEach((c) => (c.style.transform = ''));
    }
  };
  onMeasure(layout);
  layout();
  desktop.addEventListener('change', () => { layout(); dispatchEvent(new Event('resize')); });

  if (motionOn()) {
    sc = scene(el, (p, { v }) => {
      if (!pinned) return;
      const x = -p * dist;
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      cards.forEach((c) => {
        const d = Number(c.dataset.depth || 1);
        c.style.transform = `translate3d(${(-(p - 0.5) * (d - 1) * 380).toFixed(1)}px,0,0)`;
      });
      ghost.style.transform = `translate3d(${(-p * dist * 0.32).toFixed(1)}px,0,0)`;
      // Motion trail on the ghost type only — photographs are never blurred.
      const s = clamp(Math.abs(v) / 30);
      trail.style.opacity = (s * 0.5).toFixed(3);
      trail.style.transform = `translate3d(${(v * 1.4).toFixed(1)}px,0,0)`;
      // Current card: the one nearest the viewport centre.
      const cx = window.innerWidth / 2;
      let best = 0, bd = Infinity;
      cards.forEach((c, i) => { const b = c.getBoundingClientRect(); const dd = Math.abs(b.left + b.width / 2 - cx); if (dd < bd) { bd = dd; best = i; } });
      setIndex(best);
    }, { mode: 'sticky', tau: 120 });
  }

  // Native swipe track (mobile / reduced motion).
  track.addEventListener('scroll', () => {
    if (pinned) return;
    const cx = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bd = Infinity;
    cards.forEach((c, i) => { const dd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - cx); if (dd < bd) { bd = dd; best = i; } });
    setIndex(best);
  }, { passive: true });

  const go = (dir) => {
    const cur = Number(idx.textContent) - 1;
    const i = clamp(cur + dir, 0, cards.length - 1);
    const c = cards[i];
    if (pinned && sc) {
      const x = clamp(c.offsetLeft - (window.innerWidth - c.offsetWidth) / 2, 0, dist);
      window.scrollTo({ top: sc.top + x, behavior: 'smooth' });
    } else {
      track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: motionOn() ? 'smooth' : 'auto' });
    }
    setIndex(i);
  };
  $('[data-room-prev]', el).addEventListener('click', () => go(-1));
  $('[data-room-next]', el).addEventListener('click', () => go(1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
}

/* 06 Evenings — five staff lines that answer the visitor's scrolling speed. */
function evenings() {
  const el = $('[data-scene="evenings"]');
  const svg = $('[data-staff]');
  if (!el || !svg) return;
  const paths = $$('path', svg);
  const draw = (t, amp) => {
    paths.forEach((path, i) => {
      const y0 = 40 + i * 40;
      let d = '';
      for (let x = 0; x <= 1200; x += 30) {
        const env = Math.sin((x / 1200) * Math.PI); // calm at the edges
        const y = y0 + Math.sin(x * 0.0075 + t * 0.0011 + i * 0.75) * amp * env;
        d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(2);
      }
      path.setAttribute('d', d);
    });
  };
  draw(0, 0);
  if (!motionOn()) return;
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-drawn'); io.disconnect(); } }, { threshold: 0.2 });
  io.observe(el);
  const sc = scene(el, () => {}, { tau: 0 });
  let amp = 0;
  ambient(({ t, dt, v }) => {
    if (!sc.visible) return false;
    const target = 2.2 + Math.min(18, Math.abs(v) * 1.1);
    amp += (target - amp) * (1 - Math.exp(-dt / 260));
    draw(t, amp);
    return true;
  });
  // Visibility is recomputed by the loop; nudge it awake when the section nears.
  new IntersectionObserver(([e]) => e.isIntersecting && dispatchEvent(new Event('scroll')), { rootMargin: '20%' }).observe(el);
}

/* 07 Terrace — the plate drifts behind; the title opens its width as you arrive. */
function terrace() {
  const el = $('[data-scene="terrace"]');
  if (!el || !motionOn()) return;
  scene(el, (p) => {
    el.style.setProperty('--p', p.toFixed(4));
    el.style.setProperty('--open', easeOut(range(p, 0.12, 0.5)).toFixed(4));
  }, { tau: 130 });
}

/* 09 Closing — candle glow that follows the pointer with inertia; breathes on touch. */
function closing() {
  const el = $('[data-scene="closing"]');
  const glow = $('.closing__glow', el);
  if (!el || !motionOn()) return;
  const sc = scene(el, () => {}, { tau: 0 });
  let tx = 0.5, ty = 0.4, gx = 0.5, gy = 0.4, hasPointer = false;
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; hasPointer = true;
    dispatchEvent(new Event('scroll'));
  });
  ambient(({ t, dt }) => {
    if (!sc.visible) return false;
    if (!hasPointer) { tx = 0.5 + Math.sin(t * 0.00035) * 0.18; ty = 0.38 + Math.cos(t * 0.00027) * 0.08; }
    const k = 1 - Math.exp(-dt / 380);
    gx += (tx - gx) * k; gy += (ty - gy) * k;
    glow.style.setProperty('--gx', (gx * 100).toFixed(2) + '%');
    glow.style.setProperty('--gy', (gy * 100).toFixed(2) + '%');
    return true;
  });
}

/* Navigation tone, hide-on-scroll and mobile action bar. */
function chrome() {
  const nav = $('[data-nav]');
  const bar = $('[data-actionbar]');
  const sections = $$('[data-tone]').filter((s) => s !== nav);
  const reserve = $('#reserve');
  let marks = [];
  const measure = () => {
    marks = sections.map((s) => { const r = s.getBoundingClientRect(); return { s, top: r.top + scrollY, bottom: r.bottom + scrollY, tone: s.dataset.tone }; });
  };
  onMeasure(measure);
  measure();
  let lastY = scrollY, hidden = false, lastTone = '';
  const at = (y) => marks.find((m) => y >= m.top && y < m.bottom);
  onFrame(({ y, vh }) => {
    const dy = y - lastY;
    if (Math.abs(dy) > 2) {
      const h = y > vh * 0.5 && dy > 0 && !document.body.classList.contains('drawer-open');
      if (h !== hidden) { hidden = h; nav.classList.toggle('is-hidden', h); }
      lastY = y;
    }
    nav.classList.toggle('is-scrolled', y > 40);
    const under = at(y + 36);
    let tone = under ? under.tone : 'dusk';
    if (under && under.s.dataset.scene === 'hero') tone = state.heroTone === 'light' ? 'ivory' : 'dusk';
    const light = tone === 'ivory';
    if (tone !== lastTone) { nav.dataset.on = light ? 'light' : 'dark'; lastTone = tone; }
    const r = marks.find((m) => m.s === reserve);
    const inReserve = r && y + vh > r.top + vh * 0.25 && y < r.bottom;
    const footer = marks[marks.length - 1];
    const show = y > vh * 0.85 && !inReserve && !(footer && y + vh > footer.top + 120);
    if (bar.classList.contains('is-on') !== show) {
      bar.classList.toggle('is-on', show);
      bar.setAttribute('aria-hidden', String(!show));
      bar.querySelectorAll('a').forEach((a) => (a.tabIndex = show ? 0 : -1));
    }
  });
}

/* Primary CTAs lean toward the pointer a few pixels — tactile, never evasive. */
function magnets() {
  if (!finePointer.matches || !motionOn()) return;
  $$('.btn--magnet').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const x = clamp((e.clientX - r.left - r.width / 2) * 0.16, -6, 6);
      const y = clamp((e.clientY - r.top - r.height / 2) * 0.22, -4, 4);
      b.style.setProperty('--mx', x.toFixed(1) + 'px');
      b.style.setProperty('--my', y.toFixed(1) + 'px');
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });
}

export function initScenes() {
  hero(); rule(); kitchen(); room(); evenings(); terrace(); closing(); chrome(); magnets();
}
