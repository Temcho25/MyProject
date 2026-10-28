import { gsap, ScrollTrigger, $, $$, lenis, onLang, imgSet, revealLines, intro, initCursor, initContact, updateNav } from './core.js';
import { PROJECTS } from './data.js';

/* ------------------------------------------------------------------ build grid */
// Every third card spans the full width for an editorial rhythm.
$('#grid').innerHTML = PROJECTS.map((p, i) => `
  <a class="card ${i % 3 === 0 ? 'is-wide' : ''}" href="${p.url}" target="_blank" rel="noopener" data-cursor data-cats="${p.cats.join(' ')}">
    <div class="card-media">${imgSet(p.id, p.main, i % 3 === 0 ? '(max-width: 760px) 100vw, 92vw' : '(max-width: 760px) 100vw, 46vw', i < 2, p.name)}</div>
    <div class="card-meta"><h2 class="card-name">${p.name}</h2><span class="card-tags" data-tags="${p.id}"></span></div>
    <p class="card-desc" data-desc="${p.id}"></p>
  </a>`).join('');
$('#wpCount').textContent = PROJECTS.length;

onLang((l) => {
  $$('[data-desc]').forEach((el) => { el.textContent = PROJECTS.find((p) => p.id === el.dataset.desc)[l]; });
  $$('[data-tags]').forEach((el) => { el.textContent = PROJECTS.find((p) => p.id === el.dataset.tags).tags[l]; });
});
initContact();
initCursor();

/* ------------------------------------------------------------------ filters */
$$('#filters button').forEach((b) => b.addEventListener('click', () => {
  if (b.classList.contains('is-on')) return;
  $$('#filters button').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', String(x === b)); });
  const f = b.dataset.f;
  const cards = $$('.card');
  gsap.to(cards, {
    opacity: 0, y: 20, duration: 0.35, ease: 'power2.in', stagger: 0.02,
    onComplete: () => {
      let n = 0;
      cards.forEach((c) => {
        const show = f === 'all' || c.dataset.cats.split(' ').includes(f);
        c.classList.toggle('is-out', !show);
        // Keep the wide rhythm inside the filtered set.
        c.classList.toggle('is-wide', show && n % 3 === 0);
        if (show) n += 1;
      });
      ScrollTrigger.refresh();
      gsap.fromTo($$('.card:not(.is-out)'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out' });
    },
  });
}));

/* ------------------------------------------------------------------ motion */
function setupScroll() {
  revealLines();
  $$('.card').forEach((c) => {
    const media = $('.card-media', c);
    gsap.fromTo(media, { clipPath: 'inset(12% 6% 12% 6% round 22px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'power2.out',
      scrollTrigger: { trigger: c, start: 'top 98%', end: 'top 50%', scrub: 0.6 },
    });
    gsap.fromTo($('img', media), { yPercent: -4 }, {
      yPercent: 4, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo([$('.card-meta', c), $('.card-desc', c)], { y: 24, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: media, start: 'bottom 98%', once: true },
    });
  });
}

gsap.ticker.add(() => updateNav(lenis ? lenis.scroll : window.scrollY));

gsap.set('.wp-title .ln > *', { yPercent: 110 });
gsap.set('.wp-hero .fade-up, .wp-hero .kicker', { y: 24, opacity: 0 });
intro().then(() => {
  setupScroll();
  gsap.timeline({ delay: 0.2 })
    .to('.wp-title .ln > *', { yPercent: 0, duration: 1.6, ease: 'expo.out' }, 0)
    .to('.wp-hero .kicker, .wp-hero .fade-up', { y: 0, opacity: 1, duration: 1.3, stagger: 0.08, ease: 'expo.out' }, 0.35);
  ScrollTrigger.refresh();
});
