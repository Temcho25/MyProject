import './style.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { PROJECTS, REEL, KIND } from './projects.js';
import { EN } from './i18n.js';
import { createHero } from './hero.js';
import { createReel } from './reel.js';

gsap.registerPlugin(ScrollTrigger);

// Contact — change to the studio's real address.
const CONTACT = { email: 'hello@adscoba.com', subject: 'Проект сайта / Website project' };

const mobile = window.matchMedia('(max-width: 800px)').matches || navigator.maxTouchPoints > 1;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Language ----------
let lang = 'ru';
try { lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('adscoba-lang') || 'ru'; } catch { /* storage blocked */ }
if (lang === 'en') {
  document.documentElement.lang = 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { const v = EN[el.dataset.i18n]; if (v) el.textContent = v; });
}
document.querySelector('.nav__lang').textContent = lang === 'en' ? 'EN / RU' : 'RU / EN';
document.querySelector('.nav__lang').addEventListener('click', () => {
  const next = lang === 'en' ? 'ru' : 'en';
  try { localStorage.setItem('adscoba-lang', next); } catch { /* ignore */ }
  location.search = next === 'en' ? '?lang=en' : '';
});
const T = (ru, key) => (lang === 'en' && EN[key]) || ru;
document.querySelector('.year').textContent = new Date().getFullYear();
document.querySelector('[data-contact]').href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(CONTACT.subject)}`;
document.querySelector('.contact__mail').textContent = CONTACT.email;

// ---------- Text splitting ----------
function splitChars(el) {
  const text = el.textContent; el.textContent = '';
  el.setAttribute('aria-label', text);
  // letters are grouped per word so a word never breaks across lines
  text.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
    const word = document.createElement('span');
    word.style.display = 'inline-block'; word.style.whiteSpace = 'nowrap';
    [...part].forEach((c) => {
      const s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true');
      s.textContent = c; word.appendChild(s);
    });
    el.appendChild(word);
  });
}
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/); el.textContent = '';
  words.forEach((w, i) => {
    const o = document.createElement('span'); o.className = 'w';
    const inn = document.createElement('span'); inn.textContent = w; o.appendChild(inn); el.appendChild(o);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
}
document.querySelectorAll('.split').forEach(splitChars);
document.querySelectorAll('.split-words').forEach(splitWords);
// One continuous gradient across a split word: each letter shows its own slice.
function paintIris() {
  document.querySelectorAll('.iris').forEach((el) => {
    const w = el.getBoundingClientRect().width; const x0 = el.getBoundingClientRect().left;
    el.querySelectorAll('.ch').forEach((ch) => {
      ch.style.backgroundSize = `${w}px 100%`;
      ch.style.backgroundPosition = `${x0 - ch.getBoundingClientRect().left}px 0`;
    });
  });
}
document.fonts.ready.then(paintIris);
window.addEventListener('resize', paintIris);

// ---------- Portfolio grid ----------
const grid = document.querySelector('.grid');
const ARROW = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
PROJECTS.forEach((p) => {
  const a = document.createElement('a');
  a.className = `card ${p.size === 'wide' ? 'is-wide' : p.size === 'third' ? 'is-third' : ''}`;
  a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
  a.dataset.cat = p.cat.join(' ');
  const kinds = p.cat.map((c) => KIND[lang][c]).join(' · ');
  a.innerHTML = `
    <div class="card__media">
      <div class="card__chrome"><i></i><i></i><i></i></div>
      <span class="card__tag ${p.is3d ? 'is-3d' : ''}">${p.is3d ? '3D' : p.live ? 'LIVE' : kinds}</span>
      <img src="${import.meta.env.BASE_URL}work/${p.id}${p.size === 'wide' ? '' : '-sm'}.jpg" alt="${lang === 'en' ? 'Website for' : 'Сайт для'} ${p.name}" loading="lazy" decoding="async" />
    </div>
    <div class="card__info">
      <div>
        <h3 class="card__title">${p.name}</h3>
        <p class="card__desc">${lang === 'en' ? p.en : p.ru}</p>
      </div>
      <span class="card__go">${ARROW}</span>
    </div>`;
  grid.appendChild(a);
});
const more = document.createElement('p'); more.className = 'work__more';
more.innerHTML = lang === 'en'
  ? 'Plus fitness clubs, a fitness academy, cafés and more — <a href="#contact">ask for the full list</a>.'
  : 'А ещё фитнес-клубы, фитнес-академия, кофейни и другие — <a href="#contact">попросите полный список</a>.';
grid.after(more);

// Filters
const filters = document.querySelector('.filters');
const cats = ['all', '3d', 'estate', 'food', 'retail', 'sport'];
cats.forEach((c, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
  const n = c === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.cat.includes(c)).length;
  b.innerHTML = `${c === 'all' ? T('Все', 'work.all') : KIND[lang][c]}<sup>${n}</sup>`;
  if (!i) b.classList.add('is-on');
  b.addEventListener('click', () => {
    filters.querySelectorAll('button').forEach((x) => x.classList.toggle('is-on', x === b));
    const cards = [...grid.children];
    gsap.to(cards, { opacity: 0, y: 30, duration: 0.25, stagger: 0.01, onComplete: () => {
      cards.forEach((el) => {
        const show = c === 'all' || el.dataset.cat.includes(c);
        el.classList.toggle('is-hidden', !show);
        // keep a clean two-column rhythm when filtered
        el.style.gridColumn = c === 'all' ? '' : (window.innerWidth > 900 ? 'span 6' : '');
      });
      const vis = cards.filter((el) => !el.classList.contains('is-hidden'));
      gsap.fromTo(vis, { opacity: 0, y: 60, rotateX: -12 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' });
      ScrollTrigger.refresh();
    } });
  });
  filters.appendChild(b);
});

// ---------- Marquee ----------
const names = PROJECTS.map((p) => p.name);
document.querySelectorAll('.marquee__track').forEach((track, r) => {
  const list = r ? [...names].reverse() : names;
  const html = list.map((n) => `<span>${n}</span>`).join('');
  track.innerHTML = html + html;
});

// ---------- Textures (shared by both 3D scenes) ----------
const loader = new THREE.TextureLoader();
function loadTex(id) {
  return new Promise((res) => loader.load(`${import.meta.env.BASE_URL}work/${id}-sm.jpg`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t); }, undefined, () => res(new THREE.Texture())));
}

const loaderEl = document.querySelector('.loader');
const numEl = document.querySelector('.loader__num');
const lineEl = document.querySelector('.loader__line i');
const prog = { v: 0 };
const progTween = gsap.to(prog, { v: 85, duration: 2.2, ease: 'power2.out', onUpdate: () => { numEl.textContent = Math.round(prog.v); lineEl.style.width = prog.v + '%'; } });

const reelIds = REEL;
const heroIds = ['rolex', 'angels', 'mgrand', 'jordan', 'roof', 'thalassa', 'funicular', 'ishvi', 'orientiri', 'medea', 'townsquare', 'trio', 'tulips'];
const allIds = [...new Set([...reelIds, ...heroIds])];
const texMap = {};
Promise.all(allIds.map((id) => loadTex(id).then((t) => { texMap[id] = t; }))).then(start);

let hero, reel, lenis;

function start() {
  hero = createHero(document.querySelector('.hero-canvas'), { textures: heroIds.map((id) => texMap[id]), mobile });
  const reelProjects = reelIds.map((id) => PROJECTS.find((p) => p.id === id));
  reel = createReel(document.querySelector('.reel__canvas'), {
    textures: reelIds.map((id) => texMap[id]), mobile,
    onActive: (i) => setReelLabel(reelProjects[i], i),
  });

  // Smooth scroll with inertia.
  lenis = new Lenis({ lerp: reduced ? 1 : 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    e.preventDefault(); lenis.scrollTo(id === '#top' ? 0 : id, { duration: 1.6 });
  }));

  progTween.kill();
  gsap.to(prog, { v: 100, duration: 0.6, ease: 'power2.inOut', onUpdate: () => { numEl.textContent = Math.round(prog.v); lineEl.style.width = prog.v + '%'; }, onComplete: intro });
  setupScroll();
  setupInteractions();
}

// ---------- Intro ----------
function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.loader__count, .loader__brand', { y: -40, opacity: 0, duration: 0.6, ease: 'power3.in' })
    .to(loaderEl, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.1')
    .add(() => { document.body.classList.remove('is-loading'); lenis.start(); loaderEl.remove(); }, '-=0.3')
    .to(hero.state, { intro: 1, duration: 2.6, ease: 'expo.out' }, '-=0.9')
    .from('.hero__title .ch', {
      yPercent: 120, rotateX: -80, rotateZ: (i) => (i % 2 ? 8 : -8), opacity: 0, filter: 'blur(10px)',
      transformOrigin: '50% 100% -40px', duration: 1.4, stagger: 0.035,
    }, '-=2.2')
    .from('.hero .reveal-up', { y: 40, opacity: 0, duration: 1.2, stagger: 0.12 }, '-=1.1')
    .from('.hero__meta > div', { y: 30, opacity: 0, duration: 1, stagger: 0.1 }, '-=1')
    .from('.nav', { y: -80, opacity: 0, duration: 1 }, '-=1.2')
    .add(countUp, '-=0.8');
}

function countUp() {
  document.querySelectorAll('.count').forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.to, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } });
  });
}

// ---------- Reel label ----------
const idxEl = document.querySelector('.reel__idx');
const nameEl = document.querySelector('.reel__name');
const kindEl = document.querySelector('.reel__kind');
const openEl = document.querySelector('.reel__open');
function setReelLabel(p, i) {
  if (!p) return;
  gsap.timeline()
    .to([nameEl, kindEl], { yPercent: -60, opacity: 0, duration: 0.18, ease: 'power2.in' })
    .add(() => {
      idxEl.textContent = String(i + 1).padStart(2, '0');
      nameEl.textContent = p.name;
      kindEl.textContent = lang === 'en' ? p.en : p.ru;
      openEl.href = p.url;
    })
    .fromTo([nameEl, kindEl], { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out', stagger: 0.05 });
  gsap.fromTo(idxEl, { scale: 1.25 }, { scale: 1, duration: 0.6, ease: 'expo.out' });
}

// ---------- Scroll scenes ----------
function setupScroll() {
  const heroCanvas = document.querySelector('.hero-canvas');

  // Hero: dolly through the sculpture, type flies apart.
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: (s) => { hero.state.scroll = s.progress; },
  });
  gsap.to('.hero__inner', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__title .line:nth-child(2)', { xPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__title .line:nth-child(3)', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Hero canvas visible only around the hero and the finale.
  const vis = { hero: true, fin: false };
  const applyVis = () => {
    const on = vis.hero || vis.fin;
    hero.state.visible = on;
    heroCanvas.style.visibility = on ? 'visible' : 'hidden';
  };
  ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom+=40% top', onToggle: (s) => { vis.hero = s.isActive; applyVis(); } });
  ScrollTrigger.create({ trigger: '.contact', start: 'top bottom', end: 'bottom top', onToggle: (s) => { vis.fin = s.isActive; applyVis(); } });
  gsap.fromTo(hero.state, { finale: 0 }, { finale: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'center center', scrub: true } });

  // Marquee: base drift + skew from scroll velocity.
  const rows = [...document.querySelectorAll('.marquee__row')];
  const xs = rows.map(() => 0);
  let vel = 0;
  lenis.on('scroll', (e) => { vel = e.velocity; });
  gsap.ticker.add(() => {
    rows.forEach((row, i) => {
      const dir = +row.dataset.dir;
      const track = row.firstElementChild;
      const w = track.scrollWidth / 2;
      xs[i] -= (0.6 + Math.abs(vel) * 0.25) * dir;
      if (xs[i] < -w) xs[i] += w; if (xs[i] > 0) xs[i] -= w;
      gsap.set(track, { x: xs[i], skewX: gsap.utils.clamp(-14, 14, -vel * 0.6 * dir) });
    });
  });

  // Reel: pinned via sticky; scroll drives the camera along the helix.
  const bar = document.querySelector('.reel__bar i');
  ScrollTrigger.create({
    trigger: '.reel', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (s) => { reel.state.progress = s.progress; bar.style.transform = `scaleX(${s.progress})`; },
  });
  ScrollTrigger.create({ trigger: '.reel', start: 'top bottom', end: 'bottom top', onToggle: (s) => { reel.state.visible = s.isActive; } });
  gsap.from('.reel__title .w > span', { yPercent: 110, duration: 1.2, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.reel', start: 'top 60%' } });
  gsap.from('.reel__now', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.reel', start: 'top 40%' } });

  // Section titles: words rise from a mask.
  document.querySelectorAll('.section-title.split-words').forEach((el) => {
    gsap.from(el.querySelectorAll('.w > span'), { yPercent: 115, rotate: 4, duration: 1.3, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  gsap.utils.toArray('.section-lead, .filters, .eyebrow').forEach((el) => {
    if (el.closest('.hero') || el.closest('.reel')) return;
    gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  // Cards: rise in 3D, inner image parallax.
  gsap.utils.toArray('.card').forEach((card) => {
    gsap.from(card, { y: 120, rotateX: -18, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 92%' } });
    const img = card.querySelector('img');
    gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Bento cells
  gsap.utils.toArray('.cell').forEach((c, i) => {
    gsap.from(c, { y: 80, opacity: 0, rotateY: i % 2 ? 10 : -10, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%' } });
  });

  // Process: horizontal track inside a sticky frame.
  const track = document.querySelector('.process__track');
  gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth + 40), ease: 'none',
    scrollTrigger: { trigger: '.process', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
  });
  gsap.utils.toArray('.step').forEach((s) => {
    gsap.fromTo(s.querySelector('.step__n'), { xPercent: 40 }, { xPercent: -20, ease: 'none', scrollTrigger: { trigger: '.process', start: 'top top', end: 'bottom bottom', scrub: true } });
  });

  // Finale title
  gsap.from('.contact__title .ch', {
    yPercent: 110, rotateX: -70, opacity: 0, duration: 1.3, stagger: 0.025, ease: 'expo.out',
    scrollTrigger: { trigger: '.contact', start: 'top 60%' },
  });
  gsap.from('.contact__btn', { scale: 0, rotate: -90, duration: 1.4, ease: 'elastic.out(1, .6)', scrollTrigger: { trigger: '.contact__btn', start: 'top 90%' } });

  // Nav: hide on scroll down, show on up.
  const nav = document.querySelector('.nav');
  let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('is-hidden', scroll > lastY && scroll > 300);
    nav.classList.toggle('is-solid', scroll > 60);
    lastY = scroll;
  });
}

// ---------- Interactions: cursor, magnetic, tilt ----------
function setupInteractions() {
  const cursor = document.querySelector('.cursor');
  const label = cursor.querySelector('.cursor__label');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
  document.querySelectorAll('.card, .reel__canvas').forEach((el) => {
    el.addEventListener('pointerenter', () => { cursor.classList.add('is-big'); label.textContent = el.classList.contains('card') ? T('Открыть', 'cursor.open') : T('Листайте', 'cursor.drag'); });
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-big'));
  });

  if (mobile) return;

  document.querySelectorAll('.magnetic').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, .4)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, .4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.35); my((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { mx(0); my(0); });
  });

  document.querySelectorAll('.card, .tilt').forEach((el) => {
    const target = el.classList.contains('card') ? el.querySelector('.card__media') : el;
    const rx = gsap.quickTo(target, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(target, 'rotationY', { duration: 0.8, ease: 'power3' });
    gsap.set(target, { transformPerspective: 1000 });
    el.addEventListener('pointermove', (e) => {
      const r = target.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      rx((0.5 - py) * 10); ry((px - 0.5) * 12);
      target.style.setProperty('--gx', px * 100 + '%'); target.style.setProperty('--gy', py * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}
