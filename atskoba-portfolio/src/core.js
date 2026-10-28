// Shared by both pages: language, smooth scroll, nav and menu, curtain page transitions,
// line-mask text reveals, the "View" cursor and responsive image markup.
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { T, LANGS, CONTACT } from './data.js';
import { toggleSound, whoosh, tick } from './sound.js';
export { whoosh, tick };

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'expo.out';

// Motion tokens (ECC motion-foundations): every duration/ease comes from here.
export const M = {
  ease: { out: 'expo.out', inOut: 'expo.inOut', soft: 'power2.out', in: 'power2.in', bounce: 'bounce.out' },
  dur: { fast: 0.4, normal: 0.9, slow: 1.3, crawl: 1.7 },
};
// Low-end devices get the lighter path (no floating parts, lower pixel ratio, no tilt).
export const lowEnd = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2
  || (mobile && (navigator.hardwareConcurrency || 8) <= 4);

/* ------------------------------------------------------------------ language */
function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) return q;
  try { const s = localStorage.getItem('atskoba-lang'); if (LANGS.includes(s)) return s; } catch (e) { /* blocked */ }
  const n = (navigator.language || 'en').slice(0, 2);
  return n === 'ka' ? 'ka' : n === 'ru' ? 'ru' : 'en';
}
export let lang = pickLang();
export const t = (k) => T[lang][k] ?? T.en[k] ?? '';
const langHooks = [];
export const onLang = (fn) => langHooks.push(fn);

export function applyLang(next) {
  lang = next;
  try { localStorage.setItem('atskoba-lang', lang); } catch (e) { /* blocked */ }
  document.documentElement.lang = lang;
  const page = document.body.dataset.page;
  document.title = t(page === 'work' ? 'meta.work' : 'meta.home');
  $('meta[name="description"]')?.setAttribute('content', t('meta.desc'));
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('.langs button').forEach((b) => {
    b.classList.toggle('is-on', b.dataset.lang === lang);
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });
  langHooks.forEach((fn) => fn(lang));
  splitAllLines();
  ScrollTrigger.refresh();
  document.fonts?.ready.then(() => { splitAllLines(); ScrollTrigger.refresh(); });
}

/* ------------------------------------------------------------------ line splitting (mask reveals) */
// Wraps each rendered line of `.lines` text in a mask so it can rise into view.
function splitLines(el) {
  const text = el.dataset.text ?? el.textContent.trim();
  el.dataset.text = text;
  el.innerHTML = text.split(' ').map((w) => `<span class="w" style="display:inline-block">${w}</span>`).join(' ');
  const words = $$('.w', el);
  const rows = [];
  let top = null;
  words.forEach((w) => {
    if (w.offsetTop !== top) { rows.push([]); top = w.offsetTop; }
    rows[rows.length - 1].push(w.textContent);
  });
  el.innerHTML = `<span class="sr-only">${text}</span>`
    + rows.map((r) => `<span class="line" aria-hidden="true"><span>${r.join(' ')}</span></span>`).join('');
  if (el.dataset.shown) gsap.set($$('.line > span', el), { yPercent: 0 });
  else gsap.set($$('.line > span', el), { yPercent: 115 });
}
export function splitAllLines() {
  // Always split from the source string, never from the already-split DOM (it has no spaces between lines).
  $$('.lines').forEach((el) => { el.dataset.text = el.dataset.i18n ? t(el.dataset.i18n) : el.dataset.text; splitLines(el); });
}

export function revealLines() {
  $$('.lines').forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => {
        el.dataset.shown = '1';
        if (reduced) gsap.set($$('.line > span', el), { yPercent: 0 });
        else gsap.to($$('.line > span', el), { yPercent: 0, duration: M.dur.slow, stagger: 0.09, ease: M.ease.out });
      },
    });
  });
  $$('.fade-up').forEach((el) => {
    if (el.closest('.hero')) return; // hero items are part of the intro timeline
    gsap.fromTo(el, { y: 36, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.3, ease: EASE, scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });
  $$('.kicker').forEach((k) => {
    if (k.closest('.hero') || k.closest('.wp-hero')) return;
    gsap.fromTo(k, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1, ease: EASE, scrollTrigger: { trigger: k, start: 'top 92%', once: true } });
  });
  // Big contact headline rises line by line.
  const cta = $('.cta-title');
  if (cta) {
    gsap.fromTo($$('.ln > *', cta), { yPercent: 110 }, {
      yPercent: 0, duration: 1.5, stagger: 0.1, ease: EASE, scrollTrigger: { trigger: cta, start: 'top 85%', once: true },
    });
  }
}

/* ------------------------------------------------------------------ images */
export const imgSet = (id, n, sizes, eager = false, alt = '') => `
  <img src="/img/${id}-${n}-1600.webp"
       srcset="/img/${id}-${n}-1600.webp 1600w, /img/${id}-${n}-2880.webp 2880w"
       sizes="${sizes}" width="1600" height="1000" alt="${alt}"
       ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`;

/* ------------------------------------------------------------------ smooth scroll */
export let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.2, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
export function scrollToEl(el) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/* ------------------------------------------------------------------ nav + menu */
const nav = $('#nav');
let navY = 0;
const progressBar = document.getElementById('progress');
const menuEl = document.getElementById('menu');
const contactEl = document.getElementById('contact');
// Layout values are measured on refresh only — the per-frame path just reads numbers.
const navL = { max: 1, contactTop: Infinity };
function measureNav() {
  navL.max = document.documentElement.scrollHeight - window.innerHeight;
  navL.contactTop = contactEl ? contactEl.getBoundingClientRect().top + window.scrollY : Infinity;
}
ScrollTrigger.addEventListener('refresh', measureNav);
measureNav();
export function updateNav(y) {
  if (y === navY) return; // nothing moved this frame
  if (progressBar) progressBar.style.transform = `scaleX(${navL.max > 0 ? Math.min(1, y / navL.max) : 0})`;
  nav.classList.toggle('is-solid', y > 30);
  const menuOpen = menuEl.classList.contains('is-open');
  if (y > navY + 6 && y > 300 && !menuOpen) nav.classList.add('is-hidden');
  else if (y < navY - 6 || y < 300) nav.classList.remove('is-hidden');
  navY = y;
  // Light text when the nav sits over the dark contact section.
  nav.classList.toggle('on-dark', navL.contactTop - y < 40);
}
function openMenu() {
  $('#menu').classList.add('is-open');
  $('#menu').setAttribute('aria-hidden', 'false');
  $('#burger').setAttribute('aria-expanded', 'true');
  $('main').inert = true;
  if ($('#contact')) $('#contact').inert = true;
  document.documentElement.style.overflow = 'hidden';
  lenis?.stop();
  gsap.fromTo('.menu-links a', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.06, ease: EASE, delay: 0.25 });
  $('.menu-links a').focus({ preventScroll: true });
}
export function closeMenu() {
  if (!$('#menu').classList.contains('is-open')) return;
  $('#menu').classList.remove('is-open');
  $('#menu').setAttribute('aria-hidden', 'true');
  $('#burger').setAttribute('aria-expanded', 'false');
  $('main').inert = false;
  if ($('#contact')) $('#contact').inert = false;
  document.documentElement.style.overflow = '';
  lenis?.start();
}
$('#burger').addEventListener('click', () => ($('#menu').classList.contains('is-open') ? closeMenu() : openMenu()));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#menu').classList.contains('is-open')) { closeMenu(); $('#burger').focus(); }
});
$$('.langs button').forEach((b) => b.addEventListener('click', () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));

/* ------------------------------------------------------------------ links + curtain transitions */
const curtain = $('#curtain');
const samePage = (url) => url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  if (url.hash && samePage(url)) {
    e.preventDefault();
    closeMenu();
    scrollToEl(url.hash === '#top' ? document.body : $(url.hash));
    return;
  }
  if (!samePage(url) || !url.hash) {
    e.preventDefault();
    closeMenu();
    leaveTo(url.href);
  }
});

function leaveTo(href) {
  whoosh(0.6);
  try { sessionStorage.setItem('atskoba-nav', '1'); } catch (e) { /* blocked */ }
  $('.curtain-mark').style.opacity = '0';
  gsap.fromTo(curtain, { clipPath: 'inset(100% 0 0 0)' }, {
    clipPath: 'inset(0% 0 0 0)', duration: reduced ? 0.01 : 0.8, ease: 'expo.inOut',
    onComplete: () => { location.href = href; },
  });
}
// Coming back with the browser button from a cached page: make sure the curtain is open.
window.addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(curtain, { clipPath: 'inset(0 0 100% 0)' }); });

/* ------------------------------------------------------------------ intro: loader on first visit, short wipe after */
function openCurtain() {
  gsap.to('.curtain-mark', { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' });
  gsap.to(curtain, { clipPath: 'inset(0 0 100% 0)', duration: reduced ? 0.01 : 1.1, ease: 'expo.inOut', delay: 0.15 });
}
// Never leave the page covered, whatever happens during start-up.
const failsafe = setTimeout(openCurtain, 6000);

export async function intro() {
  try {
    await runIntro();
  } catch (e) {
    console.error(e);
  }
  clearTimeout(failsafe);
  openCurtain();
  await new Promise((r) => setTimeout(r, 150));
}

async function runIntro() {
  let internal = false;
  try { internal = sessionStorage.getItem('atskoba-nav') === '1'; sessionStorage.removeItem('atskoba-nav'); } catch (e) { /* blocked */ }
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const capped = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

  if (internal || reduced) {
    $('.curtain-mark').style.opacity = '0';
    await capped(fonts, 1500);
  } else {
    const ring = $('.cm-ring');
    const len = ring.getTotalLength();
    gsap.set(ring, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set('.cm-stem', { scaleY: 0, transformOrigin: '50% 100%' });
    gsap.set('.cm-dot', { y: -40, opacity: 0 });
    const tl = gsap.timeline();
    tl.to(ring, { strokeDashoffset: 0, duration: 1.1, ease: 'power3.inOut' })
      .to('.cm-stem', { scaleY: 1, duration: 0.7, ease: EASE }, 0.6)
      .to('.cm-dot', { y: 0, opacity: 1, duration: 0.7, ease: 'bounce.out' }, 0.95);
    await Promise.all([tl.then(), capped(fonts, 3000)]);
    await new Promise((r) => setTimeout(r, 150));
  }
  applyLang(lang);
}

/* ------------------------------------------------------------------ cursor */
export function initCursor() {
  if (!finePointer || reduced) return;
  const cur = $('#cursor');
  const qx = gsap.quickTo(cur, 'x', { duration: 0.5, ease: 'power3' });
  const qy = gsap.quickTo(cur, 'y', { duration: 0.5, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const v = e.target.closest('[data-cursor]');
    if (v) $('#cursorLabel').textContent = t('work.view');
    gsap.to(cur, { scale: v ? 1 : 0, opacity: v ? 1 : 0, duration: 0.5, ease: EASE });
  });
}

/* ------------------------------------------------------------------ sound (opt-in) */
const soundBtn = $('#sound');
if (soundBtn) {
  soundBtn.addEventListener('click', () => {
    const on = toggleSound();
    soundBtn.classList.toggle('is-on', on);
    soundBtn.setAttribute('aria-pressed', String(on));
  });
}

/* ------------------------------------------------------------------ 3D tilt with light sheen */
// Real perspective rotation (no skew): the frame turns toward the cursor, a soft light follows it.
export function initTilt(els) {
  if (!finePointer || reduced || lowEnd) return;
  els.forEach((el) => {
    el.classList.add('tilt');
    const sheen = document.createElement('span');
    sheen.className = 'sheen';
    el.appendChild(sheen);
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3' });
    gsap.set(el, { transformPerspective: 1400 });
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      rx((0.5 - y) * 5); ry((x - 0.5) * 7);
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ------------------------------------------------------------------ contact */
export function initContact() {
  const mail = `mailto:${CONTACT.email}`;
  ['#mailBtn', '#ctaMail'].forEach((s) => { if ($(s)) $(s).href = mail; });
  if ($('#ctaMailText')) $('#ctaMailText').textContent = CONTACT.email;
  if (CONTACT.upwork && $('#upworkBtn')) { $('#upworkBtn').href = CONTACT.upwork; $('#upworkBtn').hidden = false; }
}

// Re-measure line breaks when the width changes (not on mobile toolbar height changes).
let lastW = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === lastW) return;
  lastW = window.innerWidth;
  clearTimeout(window.__split);
  window.__split = setTimeout(() => { splitAllLines(); ScrollTrigger.refresh(); }, 200);
});

document.documentElement.lang = lang;
window.history.scrollRestoration = 'manual';
