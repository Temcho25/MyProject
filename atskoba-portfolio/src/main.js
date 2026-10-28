import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { FEATURED, RAIL, INDEX, T, LANGS, CONTACT } from './data.js';
import { createScene } from './scene.js';
import { toggleSound, tick, whoosh } from './sound.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.body.classList.add('is-loading');
window.history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ------------------------------------------------------------------ language */
function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) return q;
  try { const s = localStorage.getItem('atskoba-lang'); if (LANGS.includes(s)) return s; } catch (e) { /* storage blocked */ }
  const n = (navigator.language || 'en').slice(0, 2);
  return n === 'ka' ? 'ka' : n === 'ru' ? 'ru' : 'en';
}
let lang = pickLang();
let introDone = false;
let scatter = null;
const t = (k) => T[lang][k] ?? T.en[k] ?? '';

/* ------------------------------------------------------------------ text splitting */
function splitChars(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(' ').map((w) =>
    `<span class="w" aria-hidden="true">${[...w].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`,
  ).join(' ');
  return $$('.ch', el);
}
function splitWords(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(' ').map((w) => `<span class="wm" aria-hidden="true"><span class="wi">${w}</span></span>`).join(' ');
  return $$('.wi', el);
}

/* ------------------------------------------------------------------ build DOM */
const media = (id, cls = '') =>
  `<video class="${cls}" muted loop playsinline preload="none" poster="/media/${id}.jpg" data-src="/media/${id}.mp4"></video>`;

function buildScenes() {
  $('#scenes').innerHTML = FEATURED.map((p, i) => `
    <article class="scene ${i % 2 ? 'is-right' : ''}" data-id="${p.id}">
      <div class="scene-sticky">
        <a class="scene-frame" href="${p.url}" target="_blank" rel="noopener" data-cursor="view" aria-label="${p.name}">
          <div class="scene-bar"><b></b><b></b><b></b><span>${p.url.replace('https://', '')}</span></div>
          ${media(p.id)}
        </a>
        <div class="scene-info">
          <h3 class="scene-name">${p.name}</h3>
          <div class="scene-meta">
            <p class="scene-desc" data-desc="${p.id}"></p>
            <div class="tags">${p.tags.map((x) => `<span class="tag">${x}</span>`).join('')}</div>
            <a class="btn btn-sm magnetic" href="${p.url}" target="_blank" rel="noopener"><span data-i18n="work.open"></span><i class="arr">↗</i></a>
          </div>
        </div>
      </div>
    </article>`).join('');

  $('#railTrack').innerHTML = RAIL.map((p) => `
    <a class="card" href="${p.url}" target="_blank" rel="noopener" data-cursor="view">
      <div class="card-media">${media(p.id)}</div>
      <div class="card-body"><h3 class="card-name">${p.name}</h3><i class="arr">↗</i></div>
      <p class="card-desc" data-desc="${p.id}"></p>
    </a>`).join('');

  $('#idxList').innerHTML = INDEX.map((p) => `
    <li class="idx-row"><a href="${p.url}" target="_blank" rel="noopener" data-preview="/work/${p.id}.jpg">
      <span class="idx-name">${p.name}</span><span class="idx-cat" data-i18n="cat.${p.cat}"></span><i class="arr">↗</i>
    </a></li>`).join('');

  $('#mailBtn').href = $('#ctaEmail').href = `mailto:${CONTACT.email}`;
  $('#ctaEmail').textContent = CONTACT.email;
  if (CONTACT.upwork) { $('#upworkBtn').href = CONTACT.upwork; $('#upworkBtn').hidden = false; }
}
buildScenes();
$$('.scene-name').forEach((el) => splitChars(el));

const ALL = [...FEATURED, ...RAIL];
let manifestoTween = null;

function applyLang(next, animate = false) {
  lang = next;
  try { localStorage.setItem('atskoba-lang', lang); } catch (e) { /* storage blocked */ }
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  $('meta[name="description"]').setAttribute('content', t('meta.desc'));
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-desc]').forEach((el) => { el.textContent = ALL.find((p) => p.id === el.dataset.desc)[lang]; });
  $$('.langs button').forEach((b) => b.classList.toggle('is-on', b.dataset.lang === lang));
  $('#sound .sound-txt').textContent = t(soundOn ? 'sound.on' : 'sound.off');

  $$('.hero-title .split').forEach(splitChars);
  $$('.split-words').forEach((el) => {
    const words = splitWords(el);
    if (el.dataset.revealed) gsap.set(words, { yPercent: 0 });
    else gsap.set(words, { yPercent: 110 });
  });
  buildManifesto();
  if (introDone) buildScatter();
  if (animate) {
    gsap.from('.hero-title .ch', { yPercent: 100, opacity: 0, duration: 0.8, stagger: 0.012, ease: 'expo.out' });
  }
  ScrollTrigger.refresh();
  // Georgian glyphs download lazily; re-measure once they arrive.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

function buildManifesto() {
  const el = $('#manifestoText');
  // *word* marks an accent word.
  el.innerHTML = t('manifesto').split(' ').map((w) => {
    const hl = /^\*.*\*/.test(w);
    return `<span class="mw${hl ? ' hl' : ''}">${w.replace(/\*/g, '')}</span>`;
  }).join(' ');
  manifestoTween?.scrollTrigger?.kill();
  manifestoTween?.kill();
  manifestoTween = gsap.to($$('.mw', el), {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true },
  });
}

let soundOn = false;
applyLang(lang);

/* ------------------------------------------------------------------ smooth scroll */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const scrollToTarget = (target) => {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
  else el.scrollIntoView({ behavior: 'smooth' });
};
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  e.preventDefault();
  closeMenu();
  scrollToTarget(id === '#top' ? document.body : id);
}));

/* ------------------------------------------------------------------ 3D scene */
let gl = null;
try { gl = createScene($('#gl'), { mobile, reduced }); } catch (e) {
  $('#gl').style.display = 'none';
  document.body.style.background = 'radial-gradient(80% 60% at 70% 30%, #2a1a14, #0a0a0d 70%)';
}

/* ------------------------------------------------------------------ nav, menu, language, sound */
const nav = $('#nav');
let navY = 0;
function navOnScroll(y) {
  nav.classList.toggle('is-solid', y > 40);
  nav.classList.toggle('is-hidden', y > navY + 4 && y > 400 && !$('#menu').classList.contains('is-open'));
  if (y < navY - 4) nav.classList.remove('is-hidden');
  navY = y;
}
function closeMenu() {
  if (!$('#menu').classList.contains('is-open')) return;
  $('#menu').classList.remove('is-open');
  $('#menu').setAttribute('aria-hidden', 'true');
  $('#burger').setAttribute('aria-expanded', 'false');
  $('main').inert = false;
  document.documentElement.style.overflow = '';
  lenis?.start();
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#menu').classList.contains('is-open')) { closeMenu(); $('#burger').focus(); }
});
$('#burger').addEventListener('click', () => {
  const open = !$('#menu').classList.contains('is-open');
  if (!open) return closeMenu();
  $('#menu').classList.add('is-open');
  $('#menu').setAttribute('aria-hidden', 'false');
  $('#burger').setAttribute('aria-expanded', 'true');
  $('main').inert = true;
  document.documentElement.style.overflow = 'hidden'; // also stops native touch scroll behind the menu
  lenis?.stop();
  $('#menu a').focus({ preventScroll: true });
  gsap.from('#menu a', { yPercent: 80, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'expo.out', delay: 0.15 });
  whoosh(0.5);
});
$$('.langs button').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.lang === lang) return;
  tick(1.2);
  applyLang(b.dataset.lang, true);
}));
$('#sound').addEventListener('click', () => {
  soundOn = toggleSound();
  $('#sound').classList.toggle('is-on', soundOn);
  $('#sound').setAttribute('aria-pressed', String(soundOn));
  $('#sound .sound-txt').textContent = t(soundOn ? 'sound.on' : 'sound.off');
});

/* ------------------------------------------------------------------ cursor, magnetic buttons, preview */
if (finePointer && !reduced) {
  const cur = $('#cursor');
  const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
  const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
  const pv = $('#preview');
  const px = gsap.quickTo(pv, 'x', { duration: 0.7, ease: 'power3' });
  const py = gsap.quickTo(pv, 'y', { duration: 0.7, ease: 'power3' });
  let lastX = 0;
  window.addEventListener('pointermove', (e) => {
    cx(e.clientX); cy(e.clientY); px(e.clientX); py(e.clientY);
    gsap.to(pv, { rotation: clamp((e.clientX - lastX) * 0.6, -12, 12), duration: 0.6, ease: 'power3' });
    lastX = e.clientX;
  });
  document.addEventListener('pointerover', (e) => {
    const v = e.target.closest('[data-cursor="view"]');
    const l = e.target.closest('a, button');
    cur.classList.toggle('is-view', !!v);
    cur.classList.toggle('is-link', !v && !!l);
    $('#cursorLabel').textContent = v ? t('work.view') : '';
    if (l && !l.contains(e.relatedTarget)) tick(v ? 0.8 : 1);
  });
  $$('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.5, ease: 'power3' });
    });
    b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' }));
  });
  $$('[data-preview]').forEach((a) => {
    a.addEventListener('pointerenter', () => {
      $('img', pv).src = a.dataset.preview;
      gsap.to(pv, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' });
    });
    a.addEventListener('pointerleave', () => gsap.to(pv, { opacity: 0, scale: 0.6, duration: 0.4, ease: 'power3.in' }));
  });
}

/* ------------------------------------------------------------------ videos: load and play only in view */
const vio = new IntersectionObserver((entries) => {
  entries.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) {
      if (!v.src) { v.src = v.dataset.src; }
      v.play().catch(() => {});
    } else v.pause();
  });
}, { rootMargin: '200px 0px' });
$$('video[data-src]').forEach((v) => vio.observe(v));

/* ------------------------------------------------------------------ scroll choreography */

// Hero: headline letters scatter into depth with blur as you leave.
function buildScatter() {
  if (reduced) return;
  if (scatter) { scatter.scrollTrigger?.kill(); scatter.progress(0).kill(); }
  const heroChars = $$('.hero-title .ch');
  scatter = gsap.timeline({
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  scatter.fromTo(heroChars, { yPercent: 0, xPercent: 0, rotation: 0, z: 0, opacity: 1, filter: 'blur(0px)' }, {
    yPercent: () => -60 - Math.random() * 160,
    xPercent: () => (Math.random() - 0.5) * 120,
    rotation: () => (Math.random() - 0.5) * 60,
    z: () => 100 + Math.random() * 500,
    opacity: 0, filter: 'blur(10px)', ease: 'power2.in', stagger: { each: 0.008, from: 'random' },
  }, 0);
  scatter.fromTo('.hero-foot, .hero-kicker', { y: 0, opacity: 1, filter: 'blur(0px)' },
    { y: -80, opacity: 0, filter: 'blur(8px)', ease: 'power2.in' }, 0);
}
const intro = { a: 0 };

function setupScroll() {
  // Section titles: words rise out of a mask once.
  $$('.split-words').forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => {
        el.dataset.revealed = '1';
        gsap.to($$('.wi', el), { yPercent: 0, duration: 1.2, stagger: 0.06, ease: 'expo.out' });
      },
    });
  });
  $$('.kicker').forEach((k) => gsap.from(k, {
    opacity: 0, x: -30, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: k, start: 'top 90%' },
  }));

  // Featured scenes: tilted frame straightens and grows, title rises, then recedes.
  $$('.scene').forEach((sc, i) => {
    const frame = $('.scene-frame', sc);
    const right = sc.classList.contains('is-right');
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sc, start: 'top bottom', end: 'bottom top', scrub: 0.8,
        onEnter: () => whoosh(0.7), onEnterBack: () => whoosh(0.4),
      },
      defaults: { ease: 'none' },
    });
    // Phones skip the filter (blur on 3D-tilted video stutters on iOS); opacity does the fade instead.
    const fx = (b, l) => (mobile ? { opacity: l } : { filter: `blur(${b}px) brightness(${l})` });
    tl.fromTo(frame,
      { rotateX: 34, rotateY: right ? -16 : 16, rotateZ: right ? 3 : -3, scale: 0.6, yPercent: 22, ...fx(6, 0.45) },
      { rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, yPercent: 0, ...fx(0, 1), duration: 0.42, ease: 'power2.out' }, 0)
      .to(frame, { scale: 0.84, rotateX: -16, yPercent: -12, ...fx(5, 0.35), duration: 0.34, ease: 'power2.in' }, 0.66)
      .fromTo($$('.scene-name .ch', sc), { yPercent: 120, rotate: 8, opacity: 0 },
        { yPercent: 0, rotate: 0, opacity: 1, stagger: 0.008, duration: 0.14, ease: 'power3.out' }, 0.26)
      .fromTo($('.scene-meta', sc), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.12, ease: 'power3.out' }, 0.36)
      .to($$('.scene-name .ch', sc), { yPercent: -120, opacity: 0, stagger: 0.006, duration: 0.12, ease: 'power3.in' }, 0.78)
      .to($('.scene-meta', sc), { y: -40, opacity: 0, duration: 0.1 }, 0.8);
  });

  // Rail: horizontal track, cards rotate in depth by distance from the centre.
  const rail = $('#rail');
  const track = $('#railTrack');
  const sizeRail = () => {
    const dist = Math.max(0, track.scrollWidth - window.innerWidth);
    rail.style.height = `calc(100svh + ${dist}px)`;
    return dist;
  };
  let railDist = sizeRail();
  ScrollTrigger.addEventListener('refreshInit', () => { railDist = sizeRail(); });
  ScrollTrigger.create({
    trigger: rail, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (s) => {
      L.railX = -s.progress * railDist;
      gsap.set(track, { x: L.railX });
      gsap.set('#railProgress', { scaleX: s.progress });
    },
    onEnter: () => whoosh(0.6),
  });

  // Process: line draws itself, steps light up.
  const path = $('#procPath');
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  gsap.to(path, {
    strokeDashoffset: 0, ease: 'none',
    scrollTrigger: { trigger: '.proc-wrap', start: 'top 70%', end: 'bottom 60%', scrub: true },
  });
  $$('.step').forEach((s) => ScrollTrigger.create({
    trigger: s, start: 'top 65%', end: 'bottom top',
    onToggle: (st) => { s.classList.toggle('is-on', st.isActive || st.progress === 1); if (st.isActive) tick(0.7); },
  }));
  $$('.step p').forEach((p) => gsap.from(p, {
    y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 85%' },
  }));

  // Capabilities and index rows wipe in.
  gsap.from('.cap', {
    clipPath: 'inset(100% 0 0 0)', y: 40, duration: 1.1, stagger: 0.08, ease: 'expo.out',
    scrollTrigger: { trigger: '.caps-list', start: 'top 80%' },
  });
  gsap.from('.idx-row', {
    x: -60, opacity: 0, duration: 1, stagger: 0.05, ease: 'expo.out',
    scrollTrigger: { trigger: '#idxList', start: 'top 85%' },
  });

  // Contact: the sentence assembles out of depth, like the logo.
  gsap.fromTo('.cta-w',
    { yPercent: 70, rotateX: -70, z: -300, opacity: 0, filter: 'blur(14px)' },
    {
      yPercent: 0, rotateX: 0, z: 0, opacity: 1, filter: 'blur(0px)', stagger: 0.18, ease: 'power3.out',
      scrollTrigger: { trigger: '#contact', start: 'top 75%', end: 'top 15%', scrub: 1, onEnter: () => whoosh(1) },
    });
  gsap.from('.cta-sub, .cta-actions, .cta-email', {
    y: 40, opacity: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out',
    scrollTrigger: { trigger: '.cta-sub', start: 'top 90%' },
  });
}

/* ------------------------------------------------------------------ per-frame: 3D state, velocity effects */
const marquees = $$('.marquee').map((m) => ({ el: $('.marquee-in', m), dir: +m.dataset.dir, x: 0, w: 0 }));
marquees.forEach((m) => { m.el.innerHTML += m.el.innerHTML; });
const measure = () => marquees.forEach((m) => { m.w = m.el.scrollWidth / 2; });
measure();
window.addEventListener('resize', measure);

let vel = 0;
const cards = $$('.card');
const sceneMedia = $$('.scene-frame video');
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// Layout cache: measured on refresh, so the per-frame loop only reads numbers (no layout thrash).
const L = { contactTop: 0, railTop: 0, railH: 0, railX: 0, centres: [], vh: window.innerHeight, vw: window.innerWidth };
function measureLayout() {
  const y = window.scrollY;
  L.vh = window.innerHeight; L.vw = window.innerWidth;
  L.contactTop = $('#contact').getBoundingClientRect().top + y;
  const r = $('#rail').getBoundingClientRect();
  L.railTop = r.top + y; L.railH = r.height;
  L.centres = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
}
ScrollTrigger.addEventListener('refresh', measureLayout);
measureLayout();

let lastY = -1, lastVel = 0;
gsap.ticker.add(() => {
  const y = lenis ? lenis.scroll : window.scrollY;
  const rawVel = lenis ? lenis.velocity : 0;
  vel += (rawVel - vel) * 0.15;
  if (Math.abs(vel) < 0.01) vel = 0;
  const moved = y !== lastY || vel !== lastVel;
  lastVel = vel;
  if (moved) navOnScroll(y);
  lastY = y;

  // 3D state from scroll position.
  if (gl) {
    const heroP = clamp(y / L.vh);
    const contactP = smooth(0, 1, (L.vh - (L.contactTop - y)) / (L.vh * 0.9));
    gl.state.assemble = (introDone ? 1 : intro.a) * (1 - smooth(0, 0.9, heroP)) + contactP;
    gl.state.flight = heroP * 0.9 * (1 - contactP);
    gl.state.focus = Math.max(1 - smooth(0.55, 1, heroP), contactP * 0.9);
    gl.state.side = mobile ? 0 : 1 - contactP;
    gl.state.speed = vel;
    gl.state.finale = contactP;
  }

  // Marquees run constantly and speed up / skew with scroll velocity (motion blur).
  if (!reduced) {
    const skew = clamp(vel * 0.35, -14, 14);
    marquees.forEach((m) => {
      m.x -= (1.1 + Math.abs(vel) * 0.25) * m.dir;
      if (m.x <= -m.w) m.x += m.w;
      if (m.x > 0) m.x -= m.w;
      m.el.style.transform = `translate3d(${m.x}px,0,0) skewX(${-skew * m.dir}deg)`;
      if (!mobile) m.el.style.filter = Math.abs(vel) > 6 ? `blur(${Math.min(Math.abs(vel) * 0.06, 3)}px)` : '';
    });
  }
  if (!moved) return;

  // Inner media gets a velocity skew (+ blur on desktop): reads as motion blur during fast scroll.
  const mb = mobile ? 0 : Math.min(Math.abs(vel) * 0.05, 4);
  const sk = clamp(vel * 0.08, -4, 4).toFixed(2);
  sceneMedia.forEach((v) => {
    v.style.transform = `scale(1.06) skewY(${sk}deg)`;
    v.style.filter = mb > 0.4 ? `blur(${mb}px)` : '';
  });

  // Rail cards: rotateY / depth (/ blur on desktop) by distance from the centre.
  if (y + L.vh > L.railTop && y < L.railTop + L.railH) {
    const cxView = L.vw / 2;
    const skx = clamp(-vel * 0.12, -6, 6);
    cards.forEach((card, i) => {
      const d = clamp((L.centres[i] + L.railX - cxView) / L.vw, -1.2, 1.2);
      card.style.transform = `perspective(1200px) rotateY(${-d * 28}deg) translateZ(${-Math.abs(d) * 180}px) skewX(${skx}deg)`;
      card.style.filter = mobile
        ? `brightness(${1 - Math.abs(d) * 0.35})`
        : `blur(${Math.max(0, Math.abs(d) - 0.35) * 5}px) brightness(${1 - Math.abs(d) * 0.35})`;
    });
  }
});

/* ------------------------------------------------------------------ loader → intro */
async function boot() {
  const bar = $('#loaderBar');
  const lp = { l: $('.lp-l'), r: $('.lp-r'), x: $('.lp-x') };
  gsap.set(lp.l, { x: -70, y: 40, rotation: -30, opacity: 0, transformOrigin: '50% 50%' });
  gsap.set(lp.r, { x: 70, y: -40, rotation: 30, opacity: 0, transformOrigin: '50% 50%' });
  gsap.set(lp.x, { y: 80, opacity: 0, transformOrigin: '50% 50%' });
  gsap.set('.hero-title .ch', { yPercent: 110, rotateX: -80, opacity: 0, filter: 'blur(8px)' });
  gsap.set('.hero-kicker, .hero-foot, .scroll-cue, .nav', { opacity: 0, y: 30 });

  const tl = gsap.timeline();
  tl.to(lp.l, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.9, ease: 'expo.out' }, 0.1)
    .to(lp.r, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.9, ease: 'expo.out' }, 0.25)
    .to(lp.x, { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(2.2)' }, 0.55);

  const fontReady = document.fonts?.ready ?? Promise.resolve();
  const firstPoster = new Promise((res) => { const i = new Image(); i.onload = i.onerror = res; i.src = `/media/${FEATURED[0].id}.jpg`; });
  const minTime = new Promise((res) => setTimeout(res, reduced ? 200 : 1300));
  const progress = { p: 0 };
  gsap.to(progress, { p: 0.85, duration: 1.2, ease: 'power2.out', onUpdate: () => gsap.set(bar, { scaleX: progress.p }) });
  await Promise.race([Promise.all([fontReady, firstPoster, minTime]), new Promise((r) => setTimeout(r, 4500))]);
  await new Promise((r) => gsap.to(progress, { p: 1, duration: 0.3, onUpdate: () => gsap.set(bar, { scaleX: progress.p }), onComplete: r }));

  // Fonts may have changed metrics: re-split with final fonts.
  applyLang(lang);
  gsap.set('.hero-title .ch', { yPercent: 110, rotateX: -80, opacity: 0, filter: 'blur(8px)' });
  setupScroll();

  const out = gsap.timeline({
    onComplete: () => {
      $('#loader').remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
      introDone = true;
      buildScatter();
      ScrollTrigger.refresh();
    },
  });
  out.to('.loader-mark', { scale: 1.6, opacity: 0, filter: 'blur(10px)', duration: 0.7, ease: 'power3.in' }, 0)
    .to('.loader-label, .loader-bar', { opacity: 0, duration: 0.3 }, 0)
    .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, 0.35)
    .to(intro, { a: 1, duration: 2.2, ease: 'elastic.out(1, 0.55)' }, 0.6)
    .to('.hero-title .ch', {
      yPercent: 0, rotateX: 0, opacity: 1, filter: 'blur(0px)', duration: 1.3, stagger: 0.025, ease: 'expo.out',
    }, 0.75)
    .to('.nav', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', clearProps: 'transform' }, 1.0)
    .to('.hero-kicker, .hero-foot, .scroll-cue', { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, 1.15);
}
boot();
