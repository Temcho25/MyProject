import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DICT, LANGS } from './i18n.js';
import { quality } from './quality.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const q = quality();

/* ---------------- i18n ---------------- */
function detectLang() {
  const url = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(url)) return url;
  try { const s = localStorage.getItem('mg-lang'); if (LANGS.includes(s)) return s; } catch (e) { /* storage off */ }
  const nav = (navigator.language || 'ru').slice(0, 2);
  return nav === 'ka' ? 'ka' : nav === 'en' ? 'en' : 'ru';
}

function splitWords(el) {
  const text = el.textContent.trim();
  el.innerHTML = text.split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
}
function maskText(el) {
  el.innerHTML = `<span class="line-mask"><span>${el.textContent.trim()}</span></span>`;
}

let currentLang = 'ru';
function applyLang(lang, animate = false) {
  currentLang = lang;
  const d = DICT[lang];
  document.documentElement.lang = lang;
  const swap = () => {
    $$('[data-i18n]').forEach(el => { const k = el.dataset.i18n; if (d[k] != null) el.textContent = d[k]; });
    $$('[data-i18n-attr]').forEach(el => { const [attr, k] = el.dataset.i18nAttr.split(':'); el.setAttribute(attr, d[k]); });
    $$('[data-words]').forEach(splitWords);
    $$('[data-reveal-text]').forEach(maskText);
    $$('.stat [data-count]').forEach(el => { if (el.dataset.count === '8300') el.textContent = d['stat.ig.v']; });
    $$('.lang button').forEach(b => b.classList.toggle('is-active', b.dataset.lang === lang));
    movePill();
    ScrollTrigger.refresh();
    // re-mark revealed headings that are already on screen
    $$('[data-reveal-text]').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); });
    updateStatement();
  };
  try { localStorage.setItem('mg-lang', lang); } catch (e) { /* ignore */ }
  const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
  if (!animate) return swap();
  const targets = $$('main, .header nav, .footer');
  gsap.to(targets, { opacity: 0, filter: 'blur(8px)', duration: 0.35, ease: 'power2.in', onComplete: () => {
    swap();
    gsap.to(targets, { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out', clearProps: 'filter' });
  } });
}

function movePill() {
  const active = $('.lang button.is-active');
  const pill = $('.lang__pill');
  if (!active || !pill) return;
  pill.style.width = active.offsetWidth + 'px';
  pill.style.transform = `translateX(${active.offsetLeft - 3}px)`;
}

/* ---------------- chars helper ---------------- */
function splitChars(el) {
  const t = el.textContent;
  el.innerHTML = [...t].map((c, i) => `<span class="ch" style="transition-delay:${i * 0.045}s;animation-delay:${i * 0.06}s">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
}

/* ---------------- Smooth scroll ---------------- */
let lenis = null;
if (!q.reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.4, easing: t => 1 - Math.pow(1 - t, 4) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
function scrollTo(target) {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------------- Boot ---------------- */
const loaderPct = $('#loaderPct');
const loaderBar = $('.loader__bar');
let pct = 0, loaded = false;
function tickLoader() {
  const goal = loaded ? 100 : Math.min(pct + 1.2, 88);
  pct += (goal - pct) * (loaded ? 0.18 : 0.06);
  loaderPct.textContent = Math.round(pct);
  loaderBar.style.setProperty('--p', pct / 100);
  if (loaded && pct > 99.4) return finishLoader();
  requestAnimationFrame(tickLoader);
}

function finishLoader() {
  loaderPct.textContent = '100';
  const L = $('#loader');
  setTimeout(() => {
    L.classList.add('is-done');
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
    setTimeout(() => L.remove(), 1400);
  }, 250);
}

splitChars($('.loader__word'));
$$('[data-chars]').forEach(splitChars);
$$('[data-footer-chars]').forEach(splitChars);
applyLang(detectLang());
requestAnimationFrame(tickLoader);
$('#year').textContent = new Date().getFullYear();

/* ---------------- 3D scenes (lazy) ---------------- */
let hero = null;
const heroReady = import('./hero3d.js').then(m => {
  hero = m.initHero($('#heroCanvas'));
  return hero.compileAsync();
}).catch(err => { console.warn('3D disabled', err); document.body.classList.add('no-webgl'); });

const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
Promise.race([Promise.all([heroReady, fontsReady]), new Promise(r => setTimeout(r, 6000))]).then(() => { loaded = true; });

function lazyScene(selector, loader) {
  const el = $(selector);
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); loader(); } }, { rootMargin: '600px' });
  io.observe(el);
}

let craft = null, globe = null;
let craftP = 0, globeR = 0;
lazyScene('#craftCanvas', () => import('./craft3d.js').then(m => { craft = m.initCraft($('#craftCanvas')); craft.setProgress(craftP); }));
lazyScene('#geoCanvas', () => import('./globe3d.js').then(async m => { globe = await m.initGlobe($('#geoCanvas'), $('#geoLabels')); globe.setReveal(globeR); }));

/* ---------------- Hero scroll choreography ---------------- */
const stA = $('[data-stage="a"]'), stB = $('[data-stage="b"]'), stC = $('[data-stage="c"]');
const bar = $('#heroProgress');
const heroDim = $('#heroDim');
const win = (p, a, b, c, d) => {
  // 0 before a, ramps to 1 by b, holds until c, ramps out by d
  if (p <= a || p >= d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p <= c) return 1;
  return 1 - (p - c) / (d - c);
};
ScrollTrigger.create({
  trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate(self) {
    const p = self.progress;
    hero?.setProgress(p);
    bar.style.transform = `scaleY(${p})`;
    // stage A: title recedes into the hall
    const a = 1 - Math.min(1, p / 0.2);
    stA.style.opacity = a;
    stA.style.transform = `translate3d(0, ${-p * 160}px, 0) scale(${1 - p * 0.7})`;
    stA.style.filter = `blur(${(1 - a) * 10}px)`;
    // stage B: "14 years"
    const b = win(p, 0.24, 0.34, 0.5, 0.6);
    stB.style.opacity = b;
    stB.style.transform = `translate3d(0, ${(1 - b) * (p < 0.42 ? 60 : -60)}px, 0) scale(${0.9 + b * 0.1})`;
    stB.style.filter = `blur(${(1 - b) * 12}px)`;
    // stage C: "Interiors of any complexity"
    const c = win(p, 0.66, 0.76, 0.92, 1.01);
    stC.style.opacity = c;
    stC.style.transform = `translate3d(0, ${(1 - c) * 50}px, 0)`;
    stC.style.filter = `blur(${(1 - c) * 12}px)`;
    heroDim.style.opacity = Math.max(b * 0.7, c);
    $('.hero__scroll').style.opacity = 1 - Math.min(1, p * 8);
  }
});

/* ---------------- Studio statement (word light-up) ---------------- */
let statementProgress = 0;
function updateStatement() {
  const words = $$('.statement .w');
  const n = Math.round(statementProgress * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < n));
}
ScrollTrigger.create({
  trigger: '.statement', start: 'top 85%', end: 'bottom 45%', scrub: true,
  onUpdate(self) { statementProgress = self.progress; updateStatement(); }
});

/* ---------------- Reveals ---------------- */
const rio = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
}), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
$$('.reveal, [data-reveal-text], [data-svc], .footer__big').forEach(el => rio.observe(el));
// headings get re-created on language switch; observe container mutations
new MutationObserver(() => $$('[data-reveal-text]:not(.in)').forEach(el => rio.observe(el))).observe($('main'), { subtree: true, childList: true });

/* ---------------- Counters ---------------- */
$$('[data-count]').forEach(el => {
  const to = +el.dataset.count;
  const fmt = v => {
    if (to < 1000) return String(Math.round(v));
    const s = Math.round(v).toLocaleString(currentLang === 'en' ? 'en-US' : 'ru-RU').replace(/ /g, ' ');
    return s + (el.dataset.suffix || '');
  };
  el.textContent = fmt(0);
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v); } }); }
  });
});

/* ---------------- Services: 3D tilt on scroll + hover ---------------- */
$$('.svc__item').forEach((item, i) => {
  gsap.fromTo(item, { rotateX: -24, y: 60, opacity: 0, transformOrigin: '50% 0%' }, {
    rotateX: 0, y: 0, opacity: 1, ease: 'power3.out', duration: 1.2,
    scrollTrigger: { trigger: item, start: 'top 92%' }
  });
  if (matchMedia('(hover:hover)').matches) {
    item.addEventListener('pointermove', e => {
      const r = item.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(item, { rotateY: dx * 4, rotateX: -dy * 6, duration: 0.6, ease: 'power3.out' });
    });
    item.addEventListener('pointerleave', () => gsap.to(item, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'elastic.out(1,0.5)' }));
  }
});

/* ---------------- Craft progress ---------------- */
ScrollTrigger.create({
  trigger: '#craft', start: 'top bottom', end: 'bottom top', scrub: true,
  onUpdate(self) { craftP = self.progress; craft?.setProgress(craftP); }
});

/* ---------------- Globe reveal ---------------- */
ScrollTrigger.create({
  trigger: '.geo__stage', start: 'top 85%', end: 'center 50%', scrub: true,
  onUpdate(self) { globeR = self.progress; globe?.setReveal(globeR); },
  onLeave() { globeR = 1; globe?.setReveal(1); }
});

/* ---------------- Marquee with scroll velocity ---------------- */
const rows = $$('[data-marquee]').map(el => ({ el, dir: +el.dataset.marquee, x: 0 }));
let vel = 0;
ScrollTrigger.create({ onUpdate: self => { vel = gsap.utils.clamp(-30, 30, self.getVelocity() / 120); } });
gsap.ticker.add((_, dt) => {
  vel *= 0.92;
  rows.forEach(r => {
    const w = r.el.scrollWidth / 2;
    r.x -= (0.045 * dt + Math.abs(vel) * 0.6) * r.dir;
    if (r.x < -w) r.x += w; if (r.x > 0) r.x -= w;
    r.el.style.transform = `translate3d(${r.x}px,0,0) skewX(${-vel * 0.6 * r.dir}deg)`;
  });
});

/* ---------------- Header behaviour ---------------- */
const header = $('#header');
const fab = $('.fab');
let lastY = 0;
ScrollTrigger.create({
  onUpdate(self) {
    const y = self.scroll();
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > lastY && y > innerHeight * 0.6 && !menuOpen);
    fab.classList.toggle('is-on', y > innerHeight * 0.8);
    lastY = y;
  }
});
['studio', 'services', 'craft', 'geo', 'contact'].forEach(id => {
  ScrollTrigger.create({
    trigger: '#' + id, start: 'top 50%', end: 'bottom 50%',
    onToggle: s => $$(`.nav a[href="#${id}"]`).forEach(a => a.classList.toggle('is-active', s.isActive))
  });
});

/* ---------------- Menu ---------------- */
const menu = $('#menu'), burger = $('#burger');
let menuOpen = false;
function setMenu(open) {
  menuOpen = open;
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', !open);
  burger.setAttribute('aria-expanded', open);
  if (lenis) open ? lenis.stop() : lenis.start();
}
burger.addEventListener('click', () => setMenu(!menuOpen));

/* ---------------- Anchor links ---------------- */
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const href = a.getAttribute('href');
  if (href.length < 2) return;
  e.preventDefault();
  if (menuOpen) setMenu(false);
  scrollTo(href === '#top' ? 0 : href);
}));

/* ---------------- Lang buttons ---------------- */
$$('.lang button').forEach(b => b.addEventListener('click', () => { if (b.dataset.lang !== currentLang) applyLang(b.dataset.lang, true); }));
addEventListener('resize', movePill);
fontsReady.then(movePill);

/* ---------------- Cursor + magnetic ---------------- */
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
  gsap.ticker.add(() => {
    rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
    dot.style.transform = `translate(${x}px,${y}px)`;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
  });
  document.addEventListener('pointerover', e => cur.classList.toggle('is-hover', !!e.target.closest('a,button,[data-svc]')));
  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,0.4)' }));
  });
}

addEventListener('load', () => ScrollTrigger.refresh());
