// Mobile navigation drawer with focus trap, Escape to close and link stagger.
import { t } from './lang.js';

export function initDrawer() {
  const btn = document.querySelector('[data-burger]');
  const drawer = document.querySelector('[data-drawer]');
  let lastFocus = null;

  const focusables = () => [btn, ...drawer.querySelectorAll('a, button')];
  const open = () => {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    document.body.classList.add('drawer-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', t('nav.close'));
    drawer.querySelector('a')?.focus({ preventScroll: true });
  };
  const close = (restore = true) => {
    drawer.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', t('nav.open'));
    setTimeout(() => { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 420);
    if (restore) (lastFocus || btn).focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => (btn.getAttribute('aria-expanded') === 'true' ? close() : open()));
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) close(false); });
  document.addEventListener('keydown', (e) => {
    if (btn.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const f = focusables();
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  matchMedia('(min-width: 900px)').addEventListener('change', (m) => m.matches && btn.getAttribute('aria-expanded') === 'true' && close(false));
}
