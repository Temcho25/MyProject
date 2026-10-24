// Home page.
import { initShell } from './shell.js';
import { site } from './content/site.js';
import { initEngine, reducedMotion } from './motion/engine.js';
import { initScenes } from './motion/scenes.js';
import { renderSlots } from './ui/slots.js';
import { renderMenuTeaser } from './ui/menu.js';
import { lang } from './ui/lang.js';

if (reducedMotion.matches) {
  // Without the hero's second phase, the intro heading lives in the intro section.
  const hi = document.querySelector('[data-hero-intro]');
  document.querySelector('.intro__grid')?.prepend(hi);
  hi.classList.add('intro__head');
}

function events(l) {
  // Never show a date that has passed.
  const todayISO = new Date().toISOString().slice(0, 10);
  const upcoming = site.events.filter((e) => e.date >= todayISO).sort((x, y) => x.date.localeCompare(y.date));
  const box = document.querySelector('[data-events]');
  box.hidden = !upcoming.length;
  if (!upcoming.length) return;
  const fmt = new Intl.DateTimeFormat(l === 'ka' ? 'ka-GE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  box.querySelector('[data-events-list]').innerHTML = upcoming.map((e) =>
    `<li><time datetime="${e.date}T${e.time}">${fmt.format(new Date(`${e.date}T12:00`))} · ${e.time}</time><span>${e.title[l] || e.title.en}</span></li>`).join('');
}

initShell({
  render: (l) => { renderSlots(l); renderMenuTeaser(l); events(l); },
});
initEngine();
initScenes();

// QA hook (development builds only).
if (import.meta.env.DEV) window.__qa = { lang: () => lang };
