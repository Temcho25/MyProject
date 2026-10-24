// Menu page (/menu/).
import { initShell } from './shell.js';
import { renderMenuPage } from './ui/menu.js';
import { initEngine } from './motion/engine.js';

initShell({ render: (l) => renderMenuPage(l), metaTitle: 'menu.page.meta', metaDesc: 'menu.page.desc' });
initEngine();

// Nav hides on scroll down, returns on scroll up (same feel as the home page).
const nav = document.querySelector('[data-nav]');
let lastY = scrollY;
addEventListener('scroll', () => {
  const y = scrollY;
  if (Math.abs(y - lastY) < 4) return;
  nav.classList.toggle('is-hidden', y > 200 && y > lastY && !document.body.classList.contains('drawer-open'));
  nav.classList.toggle('is-scrolled', y > 20);
  document.body.classList.toggle('nav-hidden', nav.classList.contains('is-hidden'));
  lastY = y;
}, { passive: true });
