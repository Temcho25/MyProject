// Header: solid after the hero, hides on scroll down, active-section datum indicator.
// Mobile drawer: focus trap, Escape, scroll lock.
export function initNav() {
  const header = document.querySelector('[data-header]');
  const links = [...document.querySelectorAll('[data-nav] a')];
  const indicator = document.querySelector('[data-nav-datum]');
  const burger = document.querySelector('[data-burger]');
  const drawer = document.querySelector('[data-drawer]');
  let lastY = scrollY;

  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-solid', y > 40);
    const drawerOpen = burger.getAttribute('aria-expanded') === 'true';
    header.classList.toggle('is-hidden', !drawerOpen && y > innerHeight * 0.9 && y > lastY + 4);
    if (y < lastY - 4 || y < innerHeight * 0.9) header.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  // Active section → move the gold datum under the matching link.
  const moveTo = (a) => {
    if (!a) { indicator.style.opacity = 0; return; }
    const nr = indicator.parentElement.getBoundingClientRect();
    const r = a.getBoundingClientRect();
    indicator.style.opacity = 1;
    indicator.style.transform = `translateX(${r.left - nr.left}px) scaleX(${r.width})`;
  };
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const visible = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => visible.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
    let best = null; let ratio = 0;
    visible.forEach((r, el) => { if (r > ratio) { ratio = r; best = el; } });
    links.forEach((a) => a.setAttribute('aria-current', String(best && a.getAttribute('href') === `#${best.id}`)));
    moveTo(links.find((a) => a.getAttribute('aria-current') === 'true'));
  }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01, 0.5, 1] });
  sections.forEach((s) => io.observe(s));
  addEventListener('resize', () => moveTo(links.find((a) => a.getAttribute('aria-current') === 'true')));

  // Drawer.
  const items = [...drawer.querySelectorAll('.drawer__list a')];
  items.forEach((a, i) => a.style.setProperty('--i', i));
  const focusables = () => [burger, ...drawer.querySelectorAll('a')];
  function setOpen(open) {
    burger.setAttribute('aria-expanded', String(open));
    if (open) {
      drawer.hidden = false;
      requestAnimationFrame(() => drawer.classList.add('is-open'));
      document.documentElement.style.overflow = 'hidden';
      header.classList.add('is-solid');
      setTimeout(() => items[0]?.focus(), 80);
    } else {
      drawer.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      const done = () => { if (burger.getAttribute('aria-expanded') === 'false') drawer.hidden = true; };
      matchMedia('(prefers-reduced-motion: reduce)').matches ? done() : setTimeout(done, 700);
    }
  }
  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  addEventListener('keydown', (e) => {
    if (burger.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { setOpen(false); burger.focus(); }
    if (e.key === 'Tab') {
      const f = focusables();
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  matchMedia('(min-width: 1081px)').addEventListener('change', (m) => { if (m.matches) setOpen(false); });
}
