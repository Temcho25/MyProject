import '@fontsource-variable/noto-serif-georgian/standard.css';
import '@fontsource-variable/noto-sans-georgian';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import './styles/main.css';

import { site } from './content/site.js';
import { initEngine, measure, reducedMotion } from './motion/engine.js';
import { splitAll, observeReveals, relineAll } from './motion/text.js';
import { initScenes } from './motion/scenes.js';
import { applyLang, initialLang, lang } from './ui/lang.js';
import { renderSlots, officialLogo } from './ui/slots.js';
import { renderMenu } from './ui/menu.js';
import { initReserve } from './ui/reserve.js';
import { initDrawer } from './ui/drawer.js';

const html = document.documentElement;
if (!reducedMotion.matches) html.classList.add('motion');
else {
  // Without the hero's second phase, the intro heading lives in the intro section.
  const hi = document.querySelector('[data-hero-intro]');
  document.querySelector('.intro__grid')?.prepend(hi);
  hi.classList.add('intro__head');
}

function facts() {
  const street = site.address.street[lang], city = site.address.city[lang];
  const country = lang === 'ka' ? 'საქართველო' : 'Georgia';
  document.querySelectorAll('[data-address]').forEach((a) => (a.innerHTML = `${street}<br>${city} ${site.address.postalCode}, ${country}`));
  document.querySelectorAll('[data-phone-link]').forEach((a) => (a.href = `tel:${site.phone.tel}`));
  document.querySelectorAll('[data-phone-display]').forEach((a) => (a.textContent = site.phone.display));
  document.querySelectorAll('[data-email-link]').forEach((a) => { a.href = `mailto:${site.email.value}`; a.textContent = site.email.value; });
  document.querySelectorAll('[data-instagram-link]').forEach((a) => (a.href = site.social.instagram.url));
  document.querySelectorAll('[data-facebook-link]').forEach((a) => (a.href = site.social.facebook.url));
  document.querySelector('[data-maps="google"]').href = site.maps.google;
  document.querySelector('[data-maps="apple"]').href = site.maps.apple;
  document.querySelectorAll('[data-year]').forEach((y) => (y.textContent = new Date().getFullYear()));

  // Hours: published only once confirmed.
  const hours = document.querySelector('[data-hours]');
  if (site.hours.confirmed && site.hours.rows.length) {
    hours.innerHTML = `<dl class="hours">${site.hours.rows.map((r) => `<div><dt>${r.days[lang]}</dt><dd>${r.open}–${r.close}</dd></div>`).join('')}</dl>`;
  }

  // Events: never show a date that has passed.
  const todayISO = new Date().toISOString().slice(0, 10);
  const upcoming = site.events.filter((e) => e.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date));
  const box = document.querySelector('[data-events]');
  box.hidden = !upcoming.length;
  if (upcoming.length) {
    const fmt = new Intl.DateTimeFormat(lang === 'ka' ? 'ka-GE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    box.querySelector('[data-events-list]').innerHTML = upcoming.map((e) =>
      `<li><time datetime="${e.date}T${e.time}">${fmt.format(new Date(`${e.date}T12:00`))} · ${e.time}</time><span>${e.title[lang] || e.title.en}</span></li>`).join('');
  }

  // Official logo replaces the typographic wordmark when supplied.
  const logo = officialLogo();
  if (logo) document.querySelectorAll('[data-wordmark]').forEach((w) => (w.innerHTML = `<img src="${logo}" alt="Republic" height="40">`));
}

function setLang(next, persist) {
  applyLang(next, { persist });
  splitAll();
  facts();
  renderSlots(next);
  renderMenu(next);
  if (persist) {
    // Already-visible copy should not replay its entrance after a language switch.
    document.querySelectorAll('[data-split]').forEach((n) => {
      if (n.closest('[data-hero-intro]')) return;
      const r = n.getBoundingClientRect();
      if (r.top < innerHeight) n.classList.add('is-in', 'no-anim');
    });
    requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('.no-anim').forEach((n) => n.classList.remove('no-anim'))));
  }
  observeReveals();
  measure();
}

setLang(initialLang(), false);
document.querySelectorAll('[data-lang-toggle]').forEach((b) =>
  b.addEventListener('click', () => setLang(lang === 'ka' ? 'en' : 'ka', true)));

initReserve();
initDrawer();
initEngine();
initScenes();

// Fonts change line breaks: regroup split lines once they arrive.
document.fonts?.ready.then(() => {
  relineAll();
  html.classList.add('fonts-ready');
  measure();
});
// QA hook (development builds only): render the menu from a test fixture.
if (import.meta.env.DEV) window.__qa = { renderMenu: (data) => renderMenu(lang, data) };

// Hero entrance starts at once; it never waits for more than a moment.
requestAnimationFrame(() => html.classList.add('is-ready'));
