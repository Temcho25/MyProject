// 01 — Opening scene: the facade draws itself on the datum line, windows come alive,
// and the drawing tilts back like a camera as the visitor scrolls.
import { svgRoot, elevation, silhouette, drawPath, s } from './svg.js';
import { scene, ticker, motion, clamp, lerp } from './motion.js';
import { t, onLang } from './i18n.js';

export function initHero() {
  const hero = document.querySelector('[data-scene="hero"]');
  const holder = hero.querySelector('[data-hero-drawing]');
  const stage = hero.querySelector('[data-hero-stage]');
  const content = hero.querySelector('.hero__content');
  const datum = hero.querySelector('[data-hero-datum]');

  const svg = svgRoot('-110 -300 490 318', { preserveAspectRatio: 'xMidYMax meet' });
  // Back layers: further blocks as faint outlines (depth: far is blurred).
  const far = s('g', { class: 'back-layer back-layer--far' }, [silhouette({ x: 150, w: 150, h: 190, delay: 200 })]);
  const back = s('g', { class: 'back-layer' }, [silhouette({ x: -90, w: 120, h: 150, delay: 350 })]);
  const { g: front } = elevation({ x: 20, labels: t('labels') });
  const ground = drawPath('M-110 0 H380', 0, 1100, 'gold');
  ground.style.color = 'var(--gold)';
  svg.append(far, back, front, ground);
  holder.appendChild(svg);

  requestAnimationFrame(() => {
    holder.classList.add('is-drawn');
    hero.classList.add('is-ready');
  });

  onLang(() => {
    const L = t('labels');
    svg.querySelectorAll('[data-l]').forEach((n) => { n.textContent = L[n.dataset.l]; });
  });

  // Living windows: a few lights switch on and off slowly while the hero is visible.
  const wins = [...svg.querySelectorAll('[data-win]')];
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  const seed = () => wins.forEach((w) => w.classList.toggle('is-lit', Math.random() < 0.18));
  setTimeout(seed, motion.reduced ? 0 : 2300);
  if (!motion.reduced) {
    setInterval(() => {
      if (!visible || document.hidden) return;
      const w = wins[(Math.random() * wins.length) | 0];
      w.classList.toggle('is-lit');
    }, 1400);
  }

  // Camera: scroll tilt + pointer drift, composed into one transform.
  const cam = { p: 0, px: 0, py: 0, tx: 0, ty: 0 };
  const render = () => {
    const tilt = motion.compact ? 8 : 16;
    stage.style.transform =
      `translate3d(0, ${-cam.p * 6}vh, 0) rotateX(${cam.p * tilt + cam.py * -2.5}deg) rotateY(${cam.px * 3.5}deg) scale(${1 + cam.p * 0.12})`;
    content.style.transform = `translate3d(0, ${-cam.p * 16}vh, 0)`;
    content.style.opacity = String(clamp(1 - cam.p * 1.4));
    hero.style.setProperty('--p', cam.p.toFixed(4));
    datum.style.setProperty('--datum', clamp(cam.p * 1.6).toFixed(4));
    // Depth parallax inside the drawing (SVG units): far moves least.
    far.setAttribute('transform', `translate(${cam.px * -4} ${cam.p * 38})`);
    back.setAttribute('transform', `translate(${cam.px * -7} ${cam.p * 22})`);
  };
  scene(hero, (p) => { cam.p = p; render(); }, { mode: 'exit', damping: 9 });

  if (!motion.reduced && matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      cam.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      cam.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      ticker(step);
    });
    hero.addEventListener('pointerleave', () => { cam.tx = 0; cam.ty = 0; ticker(step); });
  }
  function step(dt) {
    const k = 1 - Math.exp(-5 * dt);
    cam.px = lerp(cam.px, cam.tx, k);
    cam.py = lerp(cam.py, cam.ty, k);
    render();
    return Math.abs(cam.px - cam.tx) + Math.abs(cam.py - cam.ty) > 0.002;
  }
}
