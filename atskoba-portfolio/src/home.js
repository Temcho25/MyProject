import {
  gsap, ScrollTrigger, $, $$, mobile, reduced, lowEnd, lenis, onLang, imgSet, M,
  revealLines, intro, initCursor, initContact, initTilt, updateNav, scrollToEl,
} from './core.js';
import { PROJECTS, T } from './data.js';
import { createMark } from './mark3d.js';

const featured = PROJECTS.filter((p) => p.featured);

/* ------------------------------------------------------------------ build */
$('#featured').innerHTML = featured.map((p) => `
  <article class="case">
    <div class="case-media">
      <a class="case-main" href="${p.url}" target="_blank" rel="noopener" data-cursor aria-label="${p.name}">
        ${imgSet(p.id, p.main, '(max-width: 760px) 100vw, 92vw', false, p.name)}
      </a>
      <div class="case-detail" aria-hidden="true">${imgSet(p.id, p.detail, '(max-width: 760px) 46vw, 34vw')}</div>
    </div>
    <div class="case-meta">
      <div><h3 class="case-name">${p.name}</h3><p class="case-tags" data-tags="${p.id}"></p></div>
      <p class="case-desc" data-desc="${p.id}"></p>
      <a class="pill" href="${p.url}" target="_blank" rel="noopener"><span data-i18n="work.visit"></span><i class="arrow">↗</i></a>
    </div>
  </article>`).join('');


// Ticker: what we do (not client names — only real clients are listed, in the clients row).
const fillTicker = (l) => {
  const words = T[l].ticker.map((w) => `<span>${w}</span>`).join('');
  $('#ticker').innerHTML = words + words + words;
};

onLang((l) => {
  $$('[data-desc]').forEach((el) => { el.textContent = PROJECTS.find((p) => p.id === el.dataset.desc)[l]; });
  // Honest label: these are concept sites, not launched client work.
  $$('[data-tags]').forEach((el) => { el.textContent = `${T[l]['work.concept']} · ${PROJECTS.find((p) => p.id === el.dataset.tags).tags[l]}`; });
  fillTicker(l);
});
initContact();
initCursor();
initTilt($$('.case-main'));

/* ------------------------------------------------------------------ 3D mark */
let mark = null;
try { mark = createMark($('#gl'), { mobile, reduced, lowEnd }); } catch (e) { console.error('3D scene failed:', e); $('#gl').remove(); }

/* ------------------------------------------------------------------ scroll choreography */
function setupScroll() {
  revealLines();

  // Hero: the headline drifts up a little slower than the page (translation only).
  gsap.to('.hero-title', {
    yPercent: -18, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // Case studies: clip-path wipe in, then image parallax inside its frame.
  $$('.case').forEach((c, i) => {
    const main = $('.case-main', c);
    // The frame tilts back in real perspective and settles flat as it arrives.
    if (!reduced) {
      gsap.fromTo($('.case-media', c), { rotationX: 16, rotationY: i % 2 ? -6 : 6, y: 80, transformPerspective: 1800, transformOrigin: '50% 100%' }, {
        rotationX: 0, rotationY: 0, y: 0, ease: M.ease.soft,
        scrollTrigger: { trigger: c, start: 'top 100%', end: 'top 30%', scrub: 0.8 },
      });
    }
    gsap.fromTo(main, { clipPath: 'inset(16% 8% 16% 8% round 22px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'power2.out',
      scrollTrigger: { trigger: main, start: 'top 95%', end: 'top 35%', scrub: 0.6 },
    });
    const det = $('.case-detail', c);
    gsap.fromTo(det, { yPercent: 35 }, {
      yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: main, start: 'top 75%', end: 'bottom 30%', scrub: 0.6 },
    });
    gsap.fromTo($('.case-meta', c).children, { y: 30, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.2, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: $('.case-meta', c), start: 'top 90%', once: true },
    });
  });

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
  gsap.set('.mirror-cap', { opacity: 0, y: 20 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.mirror', start: 'top 85%', end: 'top -25%', scrub: 0.5 } });
  tl.to('.mw-line', { scaleX: 1, duration: 0.3, ease: 'power2.inOut' }, 0);
  letters.forEach((el, i) => {
    // Same tween on the letter and its reflection: the flipped container mirrors the motion.
    tl.to([el, refl[i]], { yPercent: 0, duration: 0.35, ease: 'power3.out' }, 0.08 + order(i) * 0.05);
  });
  tl.fromTo('.mword', { '--sheen': '120%' }, { '--sheen': '-20%', duration: 0.4, ease: 'none' }, 0.5);
  tl.to('.mirror-cap', { opacity: 1, y: 0, duration: 0.2 }, 0.62);
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
    const inn = Math.min(1, Math.max(0, (vh - top) / (vh * 0.7)));
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
