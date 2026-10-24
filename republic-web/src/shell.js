// Shared page shell: fonts, styles, emblem, language, contact facts, drawer.
// Used by the home page (main.js) and the menu page (menu-page.js).
import '@fontsource-variable/noto-serif-georgian/standard.css';
import '@fontsource-variable/noto-sans-georgian';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import './styles/main.css';
import logoSvg from '../assets-src/brand/logo.svg?raw';
import wordmarkSvg from '../assets-src/brand/wordmark.svg?raw';

import { site } from './content/site.js';
import { reducedMotion, measure } from './motion/engine.js';
import { splitAll, observeReveals, relineAll } from './motion/text.js';
import { applyLang, initialLang, lang, t } from './ui/lang.js';
import { initDrawer } from './ui/drawer.js';

const html = document.documentElement;
const $$ = (s) => document.querySelectorAll(s);

/* The official emblem, rebuilt as live SVG so its rings can move. */
const logoPath = logoSvg.match(/ d="([^"]+)"/)[1];
const emblem = () => `<svg viewBox="62.5 56 616 616" focusable="false"><g class="emblem__rings">${[299, 269, 239, 209]
  .map((r, i) => `<circle class="emblem__ring" style="--i:${i}" cx="370.5" cy="364" r="${r}" pathLength="1"/>`).join('')}</g><path class="emblem__r" d="${logoPath}"/></svg>`;

// Two-ring marks on chapter labels — the emblem, quoted. Re-added after each
// language switch, because translation replaces the label's text.
const addKrings = () => $$('.kicker').forEach((k) => {
  if (k.querySelector('.kring')) return;
  k.insertAdjacentHTML('afterbegin', '<svg class="kring" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" pathLength="1"/><circle cx="10" cy="10" r="5" pathLength="1"/></svg>');
});

export function hoursHTML() {
  return `<dl class="hours">${site.hours.rows.map((r) => `<div><dt>${r.days[lang]}</dt><dd><span>${r.open}–${r.close}</span><small>${t('reserve.kitchen').replace('{t}', r.last)}</small></dd></div>`).join('')}</dl>`;
}

function facts() {
  const a = site.address;
  const country = lang === 'ka' ? 'საქართველო' : 'Georgia';
  $$('[data-address]').forEach((el) => (el.innerHTML = `${a.building[lang]}<br>${a.street[lang]}<br>${a.city[lang]} ${a.postalCode}, ${country}`));
  $$('[data-phone-link]').forEach((el) => (el.href = `tel:${site.phone.tel}`));
  $$('[data-phone-display]').forEach((el) => (el.textContent = site.phone.display));
  $$('[data-instagram-link]').forEach((el) => (el.href = site.social.instagram.url));
  $$('[data-facebook-link]').forEach((el) => (el.href = site.social.facebook.url));
  $$('[data-delivery-link]').forEach((el) => (el.href = site.deliveryUrl));
  $$('[data-maps="google"]').forEach((el) => (el.href = site.maps.google));
  $$('[data-maps="apple"]').forEach((el) => (el.href = site.maps.apple));
  $$('[data-year]').forEach((y) => (y.textContent = new Date().getFullYear()));
  $$('[data-hours]').forEach((el) => (el.innerHTML = hoursHTML()));
  // Every "Book" goes straight to the restaurant's own booking page.
  $$('[data-book-link], [data-booking-link]').forEach((el) => { el.href = site.bookingUrl; el.target = '_blank'; el.rel = 'noopener'; });
}

/**
 * Boot the shared shell. `render(lang)` draws the page-specific parts and runs
 * before reveals are observed, on first load and on every language switch.
 */
export function initShell({ render = () => {}, metaTitle = 'meta.title', metaDesc = 'meta.description' } = {}) {
  if (!reducedMotion.matches) html.classList.add('motion');
  $$('[data-emblem]').forEach((el) => (el.innerHTML = emblem()));
  $$('[data-wordmark]').forEach((el) => { el.innerHTML = wordmarkSvg; el.querySelector('svg').setAttribute('aria-hidden', 'true'); });

  const setLang = (next, persist) => {
    applyLang(next, { persist, metaTitle, metaDesc });
    addKrings();
    splitAll();
    facts();
    render(next);
    if (persist) {
      // Copy already on screen should not replay its entrance after a switch.
      $$('[data-split]').forEach((n) => {
        if (n.closest('[data-hero-intro]')) return;
        if (n.getBoundingClientRect().top < innerHeight) n.classList.add('is-in', 'no-anim');
      });
      requestAnimationFrame(() => requestAnimationFrame(() => $$('.no-anim').forEach((n) => n.classList.remove('no-anim'))));
    }
    observeReveals();
    measure();
  };

  setLang(initialLang(), false);
  $$('[data-lang-toggle]').forEach((b) => b.addEventListener('click', () => setLang(lang === 'ka' ? 'en' : 'ka', true)));
  initDrawer();
  document.fonts?.ready.then(() => { relineAll(); html.classList.add('fonts-ready'); measure(); });
  requestAnimationFrame(() => html.classList.add('is-ready'));
}
