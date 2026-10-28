import {
  gsap, ScrollTrigger, $, $$, mobile, reduced, lenis, t, onLang, lang, imgSet,
  revealLines, intro, initCursor, initContact, updateNav, scrollToEl,
} from './core.js';
import { PROJECTS } from './data.js';
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
$('#allCount').textContent = PROJECTS.length;

const names = PROJECTS.map((p) => `<span>${p.name}</span>`).join('');
$('#ticker').innerHTML = names + names;

onLang((l) => {
  $$('[data-desc]').forEach((el) => { el.textContent = PROJECTS.find((p) => p.id === el.dataset.desc)[l]; });
  $$('[data-tags]').forEach((el) => { el.textContent = PROJECTS.find((p) => p.id === el.dataset.tags).tags[l]; });
});
initContact();
initCursor();

/* ------------------------------------------------------------------ 3D mark */
let mark = null;
try { mark = createMark($('#gl'), { mobile, reduced }); } catch (e) { $('#gl').remove(); }

/* ------------------------------------------------------------------ scroll choreography */
function setupScroll() {
  revealLines();

  // Hero: the headline drifts up a little slower than the page (translation only).
  gsap.to('.hero-title', {
    yPercent: -18, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // Case studies: clip-path wipe in, then image parallax inside its frame.
  $$('.case').forEach((c) => {
    const main = $('.case-main', c);
    gsap.fromTo(main, { clipPath: 'inset(16% 8% 16% 8% round 22px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'power2.out',
      scrollTrigger: { trigger: main, start: 'top 95%', end: 'top 35%', scrub: 0.6 },
    });
    gsap.fromTo($('img', main), { yPercent: -5 }, {
      yPercent: 5, ease: 'none', scrollTrigger: { trigger: main, start: 'top bottom', end: 'bottom top', scrub: true },
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

  gsap.fromTo('.svc', { y: 40, opacity: 0 }, {
    y: 0, opacity: 1, duration: 1.2, stagger: 0.08, ease: 'expo.out',
    scrollTrigger: { trigger: '.svc-list', start: 'top 85%', once: true },
  });
  $$('.step').forEach((s) => gsap.fromTo(s, { y: 50, opacity: 0 }, {
    y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 90%', once: true },
  }));
  gsap.fromTo('.all-wrap .pill', { y: 30, opacity: 0 }, {
    y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.all-wrap', start: 'top 92%', once: true },
  });
}

/* ------------------------------------------------------------------ per frame */
const ticker = $('#ticker');
let tx = 0, tw = 0;
const measureTicker = () => { tw = ticker.scrollWidth / 2; };
measureTicker();
ScrollTrigger.addEventListener('refresh', measureTicker);
document.fonts?.ready.then(measureTicker);
const contact = $('#contact');
let contactTop = 0;
const measure = () => { contactTop = contact.getBoundingClientRect().top + window.scrollY; };
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
    mark.state.out = Math.min(1, Math.max(0, y / (vh * 0.9)));
    const p = (y + vh - contactTop) / (vh * 0.8);
    mark.state.fin = Math.min(1, Math.max(0, p));
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
