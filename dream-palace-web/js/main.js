// Dream Palace — entry point.
import { initI18n, onLang, pick, t } from './i18n.js';
import { reveals, countUp, scene, motion } from './motion.js';
import { svgRoot, elevation, silhouette, drawPath } from './svg.js';
import { initNav } from './nav.js';
import { initHero } from './hero.js';
import { initBuild } from './build.js';
import { initApartments } from './apartments.js';
import { initBlocks } from './blocks.js';
import { initFeatures } from './features.js';
import { initLocation } from './location.js';
import { initGallery } from './gallery.js';
import { initCalculator, initFaq } from './purchase.js';
import { initForm } from './form.js';

function safe(name, fn) {
  // One failing scene must never take the rest of the page down.
  try { return fn(); } catch (err) { console.error(`[dream-palace] ${name} failed`, err); return null; }
}

function initLogo() {
  const src = window.DP_CONFIG?.logo;
  if (!src) return;
  const mark = document.querySelector('[data-logo]');
  const img = new Image();
  img.onload = () => { mark.innerHTML = ''; mark.appendChild(img); };
  img.alt = '';
  img.src = src;
}

// 11 — Final scene: the elevation returns as a gold line drawing on the horizon.
function initFinal() {
  const root = document.querySelector('[data-scene="final"]');
  const holder = root.querySelector('[data-final-drawing]');
  const svg = svgRoot('-400 -300 1400 320', { preserveAspectRatio: 'xMidYMax slice' });
  const { g } = elevation({ x: 190, windows: false, t0: 200 });
  svg.append(
    silhouette({ x: -40, w: 180, h: 240, delay: 400 }),
    g,
    silhouette({ x: 460, w: 180, h: 240, dashed: true, delay: 700 }),
    drawPath('M-400 0 H1000', 0, 1600),
  );
  holder.appendChild(svg);
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { holder.classList.add('is-drawn'); io.disconnect(); } }, { threshold: 0.15 });
  if (motion.reduced) holder.classList.add('is-drawn'); else io.observe(root);
  scene(root, (p) => { holder.style.transform = `translate3d(0, ${(1 - p) * 40}px, 0)`; }, { mode: 'through', damping: 6 });
}

function boot() {
  safe('i18n', initI18n);
  safe('logo', initLogo);
  safe('nav', initNav);
  safe('hero', initHero);
  safe('build', initBuild);
  const form = safe('form', initForm);
  safe('apartments', () => initApartments({
    onAsk: (apt) => form?.prefill(`${pick(apt.name)} — ${t('range')(apt.min, apt.max)}`, 0),
  }));
  safe('blocks', initBlocks);
  safe('features', initFeatures);
  safe('location', initLocation);
  safe('gallery', initGallery);
  safe('calculator', initCalculator);
  safe('faq', initFaq);
  safe('final', initFinal);
  safe('reveals', () => reveals());

  const statement = document.querySelector('.project__statement');
  statement?.addEventListener('reveal', () => countUp(statement));
  onLang(() => { if (statement?.classList.contains('is-in')) countUp(statement); });
}

boot();
