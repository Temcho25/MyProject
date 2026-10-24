// Renders image slots: a responsive <picture> when the official photograph
// has been processed, otherwise an abstract light study (never a fake photo).
import { slots } from '../content/assets.js';
import generated from '../content/images.generated.json';
import { site } from '../content/site.js';

const studies = {
  // [background gradient stops], bokeh hue range, bokeh band (y from–to %)
  dusk:   { bg: ['#1a1c26', '#2a2430', '#4a3029', '#93603b'], hue: [28, 42], band: [55, 95], n: 26 },
  lamp:   { bg: ['#120f0d', '#1e1813', '#2c2117', '#3b2a1b'], hue: [32, 40], band: [20, 70], n: 9, pool: '62% 38%' },
  ember:  { bg: ['#0f0c0b', '#1d1210', '#3a1a12', '#7a3420'], hue: [14, 26], band: [50, 100], n: 18 },
  candle: { bg: ['#0c0a09', '#15110e', '#1d1611', '#271c13'], hue: [34, 44], band: [30, 60], n: 6, pool: '50% 46%' },
  city:   { bg: ['#0d1018', '#141a26', '#1f2433', '#3d3326'], hue: [30, 48], band: [48, 74], n: 40 },
  night:  { bg: ['#0e1016', '#151823', '#1c1c24', '#2a2219'], hue: [36, 44], band: [8, 40], n: 7, pool: '40% 22%' },
};

// Small deterministic PRNG so each slot keeps its own composition.
function rng(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}

function study(id, kind) {
  const s = studies[kind] || studies.lamp;
  const r = rng(id);
  const dots = [];
  for (let i = 0; i < s.n; i++) {
    const x = (r() * 100).toFixed(1);
    const y = (s.band[0] + r() * (s.band[1] - s.band[0])).toFixed(1);
    const size = (kind === 'city' || kind === 'dusk' ? 0.6 + r() * 2.4 : 4 + r() * 12).toFixed(2);
    const hue = s.hue[0] + r() * (s.hue[1] - s.hue[0]);
    const a = (0.25 + r() * 0.55).toFixed(2);
    dots.push(`radial-gradient(circle at ${x}% ${y}%, hsla(${hue.toFixed(0)},70%,68%,${a}) 0, hsla(${hue.toFixed(0)},70%,60%,0) ${size}%)`);
  }
  if (s.pool) dots.push(`radial-gradient(ellipse 46% 40% at ${s.pool}, rgba(232,184,122,.42), rgba(232,184,122,0) 70%)`);
  const el = document.createElement('div');
  el.className = `study study--${kind}`;
  el.style.setProperty('--bokeh', dots.join(','));
  el.style.setProperty('--bg', `linear-gradient(180deg, ${s.bg.join(',')})`);
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="study__light"></span><span class="study__grain"></span>';
  return el;
}

function picture(slot, g, el, lang) {
  const sizes = el.dataset.sizes || '100vw';
  const set = (ext) => g.widths.map((w) => `/img/${slot.file}-${w}.${ext} ${w}w`).join(', ');
  const pic = document.createElement('picture');
  pic.innerHTML = `<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">`;
  const img = document.createElement('img');
  img.srcset = set('jpg');
  img.sizes = sizes;
  img.src = `/img/${slot.file}-${g.widths[Math.min(1, g.widths.length - 1)]}.jpg`;
  img.width = g.w; img.height = g.h;
  img.alt = slot.alt[lang] || slot.alt.en;
  img.decoding = 'async';
  if (el.hasAttribute('data-priority')) img.fetchPriority = 'high';
  else img.loading = 'lazy';
  if (slot.focal) img.style.objectPosition = slot.focal;
  el.style.backgroundColor = g.color;
  pic.appendChild(img);
  return pic;
}

export function renderSlots(lang) {
  document.querySelectorAll('[data-slot]').forEach((el) => {
    const slot = slots[el.dataset.slot];
    if (!slot) return;
    const g = generated[slot.file];
    if (el.dataset.rendered) {
      // Language switch: only alt text and labels change.
      const img = el.querySelector('img');
      if (img) img.alt = slot.alt[lang] || slot.alt.en;
      const lab = el.querySelector('.slot__label');
      if (lab) lab.textContent = labelText(slot, lang);
      return;
    }
    el.dataset.rendered = '1';
    el.classList.add('slot');
    el.style.setProperty('--ratio', slot.ratio);
    if (slot.mobileRatio) el.style.setProperty('--ratio-m', slot.mobileRatio);
    const inner = document.createElement('div');
    inner.className = 'slot__media';
    if (g) {
      inner.appendChild(picture(slot, g, el, lang));
      el.classList.add('slot--photo');
    } else {
      inner.appendChild(study(el.dataset.slot, slot.study));
      el.classList.add('slot--study');
      el.setAttribute('aria-hidden', 'true'); // abstract placeholder, not content
      if (site.showAssetLabels) {
        const lab = document.createElement('figcaption');
        lab.className = 'slot__label';
        lab.textContent = labelText(slot, lang);
        el.appendChild(lab);
      }
    }
    el.prepend(inner);
  });
}

const pending = { en: 'Official photograph pending', ka: 'ოფიციალური ფოტო მზადდება' };
const cats = { Hero: 'მთავარი', Interiors: 'ინტერიერი', Kitchen: 'სამზარეულო', Food: 'კერძები', 'Live events': 'ღონისძიებები', 'Terrace & location': 'ტერასა' };
const labelText = (slot, lang) => `${lang === 'ka' ? cats[slot.category] || slot.category : slot.category} · ${pending[lang] || pending.en}`;

export const officialLogo = () => generated.__logo?.svg || null;
