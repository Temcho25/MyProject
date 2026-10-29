import {
  gsap, ScrollTrigger, $, $$, mobile, reduced, lowEnd, lenis, onLang, imgSet, M,
  revealLines, intro, initContact, updateNav, scrollToEl,
} from './core.js';
import { PROJECTS, T } from './data.js';
import { createMark } from './mark3d.js';

// Showcase: six projects that change on their own every few seconds.
const SHOW = ['legal', 'rolex', 'coordinate', 'trio', 'orientiri', 'champions'].map((id) => PROJECTS.find((p) => p.id === id));
const SLIDE_TIME = 4.5;

$('#featured').innerHTML = `
  <div class="sc">
    <a class="sc-frame" id="scFrame" href="${SHOW[0].url}" target="_blank" rel="noopener" aria-label="${SHOW[0].name}">
      ${SHOW.map((p, i) => `<div class="sc-slide${i ? '' : ' is-on'}">${imgSet(p.id, p.main, '(max-width: 760px) 100vw, 92vw', i === 0, p.name)}</div>`).join('')}
      <span class="sc-badge" id="scBadge"></span>
    </a>
    <div class="sc-bar">
      <ol class="sc-names" role="tablist">
        ${SHOW.map((p, i) => `<li><button role="tab" aria-selected="${i === 0}" data-i="${i}" class="${i ? '' : 'is-on'}"><span>${p.name}</span><i class="sc-prog"></i></button></li>`).join('')}
      </ol>
      <a class="pill" id="scVisit" href="${SHOW[0].url}" target="_blank" rel="noopener"><span data-i18n="work.visit"></span><i class="arrow">↗</i></a>
    </div>
  </div>`;

let scCur = 0, scTimer = null, scPaused = false, scInView = false;
const slides = $$('.sc-slide'), scBtns = $$('.sc-names button');
const badgeText = () => T[document.documentElement.lang || 'en'][SHOW[scCur].live ? 'work.live' : 'work.concept'];
function scProgress() {
  scTimer?.kill();
  gsap.set('.sc-prog', { scaleX: 0 });
  if (reduced) return;
  scTimer = gsap.fromTo($('.sc-prog', scBtns[scCur]), { scaleX: 0 }, {
    scaleX: 1, duration: SLIDE_TIME, ease: 'none', paused: scPaused || !scInView,
    onComplete: () => scGo((scCur + 1) % SHOW.length),
  });
}
function scGo(next, dir = 1) {
  if (next === scCur) return;
  const prev = slides[scCur], nxt = slides[next];
  scCur = next;
  const p = SHOW[next];
  $('#scFrame').href = $('#scVisit').href = p.url;
  $('#scFrame').setAttribute('aria-label', p.name);
  $('#scBadge').textContent = badgeText();
  scBtns.forEach((b, i) => { b.classList.toggle('is-on', i === next); b.setAttribute('aria-selected', String(i === next)); });
  slides.forEach((sl) => sl.classList.remove('is-top'));
  nxt.classList.add('is-on', 'is-top');
  gsap.killTweensOf([nxt, $('img', nxt), $('img', prev)]);
  const from = dir > 0 ? 'inset(0 0 0 100% round 22px)' : 'inset(0 100% 0 0 round 22px)';
  gsap.fromTo(nxt, { clipPath: from }, { clipPath: 'inset(0 0% 0 0% round 22px)', duration: 1.15, ease: M.ease.inOut,
    onComplete: () => { prev.classList.remove('is-on'); gsap.set($('img', prev), { xPercent: 0 }); } });
  gsap.fromTo($('img', nxt), { xPercent: 7 * dir }, { xPercent: 0, duration: 1.5, ease: M.ease.out });
  gsap.to($('img', prev), { xPercent: -5 * dir, duration: 1.15, ease: M.ease.inOut });
  scProgress();
}
scBtns.forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.i; scGo(i, i > scCur ? 1 : -1); }));
// Pause while the visitor looks at a slide (desktop hover); swipe to change on touch.
$('#scFrame').addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { scPaused = true; scTimer?.pause(); } });
$('#scFrame').addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { scPaused = false; if (scInView) scTimer?.resume(); } });
let sx = null, swiped = false;
$('#scFrame').addEventListener('pointerdown', (e) => { sx = e.clientX; swiped = false; });
$('#scFrame').addEventListener('pointerup', (e) => {
  if (sx === null) return;
  const dx = e.clientX - sx; sx = null;
  if (Math.abs(dx) > 45) { swiped = true; scGo((scCur + (dx < 0 ? 1 : SHOW.length - 1)) % SHOW.length, dx < 0 ? 1 : -1); }
});
$('#scFrame').addEventListener('click', (e) => { if (swiped) { e.preventDefault(); swiped = false; } });

// Ticker: what we do (not client names — only real clients are listed, in the clients row).
const fillTicker = (l) => {
  const words = T[l].ticker.map((w) => `<span>${w}</span>`).join('');
  $('#ticker').innerHTML = words + words + words;
};

onLang((l) => {
  // Honest badge on the slide: launched client work is "live", the rest are concepts.
  $('#scBadge').textContent = T[l][SHOW[scCur].live ? 'work.live' : 'work.concept'];
  fillTicker(l);
});
initContact();

/* ------------------------------------------------------------------ 3D mark */
let mark = null;
try { mark = createMark($('#gl'), { mobile, reduced, lowEnd }); } catch (e) { console.error('3D scene failed:', e); $('#gl').remove(); }

/* ------------------------------------------------------------------ hero: play with the 3D mark */
// Drag sideways to spin it (touch and mouse), tap to make the dot hop. Vertical scroll stays native.
if (mark && !reduced) {
  const hero = $('#hero');
  let lastX = null, moved = 0;
  hero.addEventListener('pointerdown', (e) => { lastX = e.clientX; moved = 0; });
  window.addEventListener('pointermove', (e) => {
    if (lastX === null) return;
    const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    mark.state.spinV += dx * 0.012;
  });
  window.addEventListener('pointerup', () => {
    if (lastX !== null && moved < 6) gsap.fromTo(mark.state, { hop: 0 }, { hop: 1, duration: 0.28, ease: 'power2.out', yoyo: true, repeat: 1 });
    lastX = null;
  });
}

/* ------------------------------------------------------------------ scroll choreography */
function setupScroll() {
  revealLines();

  // Hero: the headline drifts up a little slower than the page (translation only).
  gsap.to('.hero-title', {
    yPercent: -18, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // Showcase: the frame tilts back in perspective and settles as it arrives; it only plays in view.
  if (!reduced) {
    gsap.fromTo('.sc-frame', { rotationX: 14, y: 70, transformPerspective: 1800, transformOrigin: '50% 100%' }, {
      rotationX: 0, y: 0, ease: M.ease.soft, scrollTrigger: { trigger: '.sc', start: 'top 100%', end: 'top 35%', scrub: 0.8 },
    });
  }
  ScrollTrigger.create({
    trigger: '.sc', start: 'top 80%', end: 'bottom 20%',
    onToggle: (st) => { scInView = st.isActive; if (scInView && !scPaused) scTimer?.resume(); else scTimer?.pause(); },
  });
  scProgress();

  setupChapters();
  setupMirror();
  setupStack();
}

/* ------------------------------------------------------------------ pinned chapter scene (services) */
// One controller per pinned section: chapter titles swap through masks, bars show progress,
// and onK(k) drives the 3D scene with a continuous chapter position (0..n).
function chapterScene(section, root, bars, onK) {
  const chaps = $$('.chap', root);
  const n = chaps.length;
  let cur = 0;
  chaps.forEach((c, i) => {
    gsap.set($('.ln > span', c), { yPercent: i === 0 ? 0 : 110 });
    gsap.set($('.chap-d', c), { opacity: i === 0 ? 1 : 0 });
  });
  const show = (next) => {
    if (next === cur) return;
    const prev = chaps[cur], nxt = chaps[next];
    const dir = next > cur ? 1 : -1;
    cur = next;
    prev.classList.remove('is-on'); nxt.classList.add('is-on');
    gsap.killTweensOf([$('.ln > span', prev), $('.ln > span', nxt), $('.chap-d', prev), $('.chap-d', nxt)]);
    gsap.to($('.ln > span', prev), { yPercent: -110 * dir, duration: M.dur.normal, ease: M.ease.out });
    gsap.to($('.chap-d', prev), { y: -20 * dir, opacity: 0, duration: M.dur.fast, ease: M.ease.in });
    gsap.fromTo($('.ln > span', nxt), { yPercent: 110 * dir }, { yPercent: 0, duration: M.dur.slow, ease: M.ease.out, delay: 0.08 });
    gsap.fromTo($('.chap-d', nxt), { y: 24 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: M.dur.slow, ease: M.ease.out, delay: 0.18 });
  };
  ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom',
    onUpdate: (st) => {
      const k = st.progress * n;
      onK(k);
      bars.forEach((b, i) => b.style.setProperty('--p', Math.min(1, Math.max(0, k - i)).toFixed(3)));
      show(Math.min(n - 1, Math.floor(k)));
    },
  });
}
function setupChapters() {
  chapterScene('.svc3d', $('#chapters'), $$('.svc3d .chap-bars i'), (k) => { if (mark) mark.state.svc = k; });
}

/* ------------------------------------------------------------------ mirror word */
function setupMirror() {
  const letters = $$('.mw-top .ml'), refl = $$('.mw-bot .ml');
  const mid = (letters.length - 1) / 2;
  const order = (i) => Math.abs(i - mid); // rise from the centre outward
  gsap.set([letters, refl], { yPercent: 105 });
  gsap.set('.mw-line', { scaleX: 0 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.mirror', start: 'top 85%', end: 'top -25%', scrub: 0.5 } });
  tl.to('.mw-line', { scaleX: 1, duration: 0.3, ease: 'power2.inOut' }, 0);
  letters.forEach((el, i) => {
    // Same tween on the letter and its reflection: the flipped container mirrors the motion.
    tl.to([el, refl[i]], { yPercent: 0, duration: 0.35, ease: 'power3.out' }, 0.08 + order(i) * 0.05);
  });
  tl.fromTo('.mword', { '--sheen': '120%' }, { '--sheen': '-20%', duration: 0.4, ease: 'none' }, 0.5);
}

/* ------------------------------------------------------------------ approach: stacked cards */
function setupStack() {
  const steps = $$('.step');
  steps.forEach((s, i) => s.style.setProperty('--i', i));
  steps.forEach((s, i) => {
    gsap.fromTo(s, { opacity: 0 }, { opacity: 1, duration: M.dur.slow, ease: M.ease.out, scrollTrigger: { trigger: s, start: 'top 95%', once: true } });
    const next = steps[i + 1];
    if (!next || reduced) return;
    // As the next card slides over, this one steps back in depth.
    gsap.to(s, {
      scale: 0.93, ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: () => `top ${parseFloat(getComputedStyle(next).top)}px`, scrub: true },
    });
  });
}

/* ------------------------------------------------------------------ per frame */
const ticker = $('#ticker');
let tx = 0, tw = 0;
const measureTicker = () => { tw = ticker.scrollWidth / 3; }; // content is repeated three times
measureTicker();
ScrollTrigger.addEventListener('refresh', measureTicker);
document.fonts?.ready.then(measureTicker);
const contact = $('#contact');
const svcEl = $('.svc3d');
let contactTop = 0, svcTop = 0, svcH = 0;
const measure = () => {
  contactTop = contact.getBoundingClientRect().top + window.scrollY;
  const r = svcEl.getBoundingClientRect();
  svcTop = r.top + window.scrollY; svcH = r.height;

};
ScrollTrigger.addEventListener('refresh', measure);

gsap.ticker.add(() => {
  const y = lenis ? lenis.scroll : window.scrollY;
  const vh = window.innerHeight;
  updateNav(y);
  if (!reduced) {
    tx -= 0.6 * gsap.ticker.deltaRatio(60); // same speed at 60 and 120 Hz
    if (tx <= -tw) tx += tw;
    ticker.style.transform = `translate3d(${tx}px,0,0)`;
  }
  if (mark) {
    mark.state.scrollY = y;
    mark.state.out = Math.min(1, Math.max(0, y / (vh * 0.9)));
    const p = (y + vh - contactTop) / (vh * 0.8);
    mark.state.fin = Math.min(1, Math.max(0, p));
    // Services scene: fade the mark in as the pinned section arrives, out as it leaves.
    const top = svcTop - y, bottom = svcTop + svcH - y;
    // Start only once the section is well on screen, so the mark never slides over the showcase.
    const inn = Math.min(1, Math.max(0, (vh * 0.45 - top) / (vh * 0.45)));
    const outn = Math.min(1, Math.max(0, bottom / (vh * 0.7)));
    mark.state.svcOn = Math.min(inn, outn);

  }
});

/* ------------------------------------------------------------------ boot */
gsap.set('.hero-title .ln > *', { yPercent: 110 });
gsap.set('.hero .fade-up', { y: 24, opacity: 0 });
gsap.set('.nav', { opacity: 0 });

intro().then(() => {
  setupScroll();
  measure();
  const tl = gsap.timeline({ delay: 0.25 });
  tl.to('.hero-title .ln > *', { yPercent: 0, duration: 1.6, stagger: 0.1, ease: 'expo.out' }, 0)
    .to('.nav', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.3)
    .to('.hero .fade-up', { y: 0, opacity: 1, duration: 1.3, stagger: 0.08, ease: 'expo.out' }, 0.6);
  if (mark) {
    const s = mark.state;
    tl.to(s, { ring: 1, duration: 1.8, ease: 'expo.out' }, 0.1)
      .to(s, { stem: 1, duration: 1.2, ease: 'expo.out' }, 0.55)
      .to(s, { dot: 1, duration: 1.1, ease: 'bounce.out' }, 0.95);
  }
  ScrollTrigger.refresh();
  if (location.hash) setTimeout(() => scrollToEl($(location.hash)), 600);
});
