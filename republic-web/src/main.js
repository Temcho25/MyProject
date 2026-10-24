import '@fontsource-variable/noto-serif-georgian/standard.css';
import '@fontsource-variable/noto-sans-georgian';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import './styles/main.css';
import logoSvg from '../assets-src/brand/logo.svg?raw';
import wordmarkSvg from '../assets-src/brand/wordmark.svg?raw';

import { site } from './content/site.js';
import { initEngine, measure, reducedMotion } from './motion/engine.js';
import { splitAll, observeReveals, relineAll } from './motion/text.js';
import { initScenes } from './motion/scenes.js';
import { applyLang, initialLang, lang, t } from './ui/lang.js';
import { renderSlots } from './ui/slots.js';
import { renderMenu } from './ui/menu.js';
import { initDrawer } from './ui/drawer.js';

const html = document.documentElement;
if (!reducedMotion.matches) html.classList.add('motion');
else {
  // Without the hero's second phase, the intro heading lives in the intro section.
  const hi = document.querySelector('[data-hero-intro]');
  document.querySelector('.intro__grid')?.prepend(hi);
  hi.classList.add('intro__head');
}

/* The official emblem, rebuilt as live SVG so its rings can move. */
const logoPath = logoSvg.match(/ d="([^"]+)"/)[1];
const rings = [299, 269, 239, 209];
const emblem = () => `<svg viewBox="62.5 56 616 616" focusable="false"><g class="emblem__rings">${rings
  .map((r, i) => `<circle class="emblem__ring" style="--i:${i}" cx="370.5" cy="364" r="${r}" pathLength="1"/>`).join('')}</g><path class="emblem__r" d="${logoPath}"/></svg>`;
document.querySelectorAll('[data-emblem]').forEach((el) => (el.innerHTML = emblem()));
document.querySelectorAll('[data-wordmark]').forEach((el) => { el.innerHTML = wordmarkSvg; el.querySelector('svg').setAttribute('aria-hidden', 'true'); });

// Small ring marks on chapter labels — the emblem, quoted. Re-added after each
// language switch, because translation replaces the label's text.
const addKrings = () => document.querySelectorAll('.kicker').forEach((k) => {
  if (k.querySelector('.kring')) return;
  k.insertAdjacentHTML('afterbegin', '<svg class="kring" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" pathLength="1"/><circle cx="10" cy="10" r="5" pathLength="1"/></svg>');
});

function hoursHTML() {
  return `<dl class="hours">${site.hours.rows.map((r) => `<div><dt>${r.days[lang]}</dt><dd><span>${r.open}–${r.close}</span><small>${t('reserve.kitchen').replace('{t}', r.last)}</small></dd></div>`).join('')}</dl>`;
}

function facts() {
  const a = site.address;
  const country = lang === 'ka' ? 'საქართველო' : 'Georgia';
  document.querySelectorAll('[data-address]').forEach((el) => (el.innerHTML = `${a.building[lang]}<br>${a.street[lang]}<br>${a.city[lang]} ${a.postalCode}, ${country}`));
  document.querySelectorAll('[data-phone-link]').forEach((el) => (el.href = `tel:${site.phone.tel}`));
  document.querySelectorAll('[data-phone-display]').forEach((el) => (el.textContent = site.phone.display));
  document.querySelectorAll('[data-instagram-link]').forEach((el) => (el.href = site.social.instagram.url));
  document.querySelectorAll('[data-facebook-link]').forEach((el) => (el.href = site.social.facebook.url));
  document.querySelectorAll('[data-delivery-link]').forEach((el) => (el.href = site.deliveryUrl));
  document.querySelectorAll('[data-menu-link]').forEach((el) => (el.href = site.menuUrl));
  document.querySelector('[data-maps="google"]').href = site.maps.google;
  document.querySelector('[data-maps="apple"]').href = site.maps.apple;
  document.querySelectorAll('[data-year]').forEach((y) => (y.textContent = new Date().getFullYear()));
  document.querySelectorAll('[data-hours]').forEach((el) => (el.innerHTML = hoursHTML()));

  // Every "Book" goes straight to the restaurant's own booking page.
  document.querySelectorAll('[data-book-link], [data-booking-link]').forEach((el) => {
    el.href = site.bookingUrl; el.target = '_blank'; el.rel = 'noopener';
  });

  // Events: never show a date that has passed.
  const todayISO = new Date().toISOString().slice(0, 10);
  const upcoming = site.events.filter((e) => e.date >= todayISO).sort((x, y) => x.date.localeCompare(y.date));
  const box = document.querySelector('[data-events]');
  box.hidden = !upcoming.length;
  if (upcoming.length) {
    const fmt = new Intl.DateTimeFormat(lang === 'ka' ? 'ka-GE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    box.querySelector('[data-events-list]').innerHTML = upcoming.map((e) =>
      `<li><time datetime="${e.date}T${e.time}">${fmt.format(new Date(`${e.date}T12:00`))} · ${e.time}</time><span>${e.title[lang] || e.title.en}</span></li>`).join('');
  }
}

function setLang(next, persist) {
  applyLang(next, { persist });
  addKrings();
  splitAll();
  facts();
  renderSlots(next);
  renderMenu(next);
  if (persist) {
    // Copy already on screen should not replay its entrance after a language switch.
    document.querySelectorAll('[data-split]').forEach((n) => {
      if (n.closest('[data-hero-intro]')) return;
      if (n.getBoundingClientRect().top < innerHeight) n.classList.add('is-in', 'no-anim');
    });
    requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('.no-anim').forEach((n) => n.classList.remove('no-anim'))));
  }
  observeReveals();
  measure();
}

setLang(initialLang(), false);
document.querySelectorAll('[data-lang-toggle]').forEach((b) =>
  b.addEventListener('click', () => setLang(lang === 'ka' ? 'en' : 'ka', true)));

initDrawer();
initEngine();
initScenes();

document.fonts?.ready.then(() => { relineAll(); html.classList.add('fonts-ready'); measure(); });

// QA hook (development builds only).
if (import.meta.env.DEV) window.__qa = { renderMenu: (data) => renderMenu(lang, data) };

requestAnimationFrame(() => html.classList.add('is-ready'));
