// Menu rendering from the official data (content/menu.js).
// - renderMenuTeaser: the home page's short invitation with chapter links.
// - renderMenuPage: the dedicated /menu/ page — every chapter in order, a
//   sticky chapter bar with scroll-spy, allergen marks and an allergen filter.
import { menu, allergens } from '../content/menu.js';
import { t } from './lang.js';

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const other = (lang) => (lang === 'ka' ? 'en' : 'ka');
const MENU_URL = '/menu/';
const avoid = new Set();

/* ───────── Home page teaser ───────── */
export function renderMenuTeaser(lang) {
  const box = document.querySelector('[data-menu-chapters]');
  if (!box) return;
  box.innerHTML = menu.categories.map((c, i) =>
    `<li style="--i:${i}"><a href="${MENU_URL}#${c.id}"><span class="chap__name">${esc(c.name[lang])}</span><span class="chap__alt" lang="${other(lang)}">${esc(c.name[other(lang)])}</span></a></li>`).join('');
  document.querySelectorAll('[data-pdf]').forEach((a) => (a.href = menu.pdfs[a.dataset.pdf]));
}

/* ───────── Menu page ───────── */
function marks(a, lang) {
  if (!a?.length) return '';
  const names = a.map((n) => allergens[n]?.[lang]).filter(Boolean).join(', ');
  return `<span class="dish__allergens" title="${esc(names)}"><span class="sr-only">${esc(t('menu.contains'))}: ${esc(names)}</span><span aria-hidden="true">${a.join(' · ')}</span></span>`;
}

function dish(it, lang) {
  const note = it.note ? `<span class="dish__note">${esc(it.note[lang])}</span>` : '';
  const price = typeof it.price === 'number' ? `<span class="dish__price">${it.price}<small> ₾</small></span>` : '';
  return `<li class="dish" data-a="${(it.a || []).join(',')}">
    <div class="dish__row"><span class="dish__name">${esc(it.name[lang])}${marks(it.a, lang)}</span><span class="dish__leader" aria-hidden="true"></span>${price}</div>
    <span class="dish__alt" lang="${other(lang)}">${esc(it.name[other(lang)])}</span>${note}
  </li>`;
}

function applyAvoid() {
  document.querySelectorAll('.dish').forEach((d) => {
    const a = (d.dataset.a || '').split(',').filter(Boolean).map(Number);
    d.classList.toggle('is-avoided', a.some((n) => avoid.has(n)));
  });
  const st = document.querySelector('[data-filter-state]');
  if (st) st.textContent = avoid.size ? t('menu.filter.on').replace('{n}', document.querySelectorAll('.dish.is-avoided').length) : '';
}

export function renderMenuPage(lang) {
  const chapters = document.querySelector('[data-chapters]');
  const body = document.querySelector('[data-menu-page]');
  const legend = document.querySelector('[data-legend]');
  if (!body) return;

  chapters.innerHTML = menu.categories.map((c) =>
    `<a href="#${c.id}" data-chap="${c.id}">${esc(c.name[lang])}</a>`).join('') + '<span class="chapters__ink" aria-hidden="true"></span>';

  body.innerHTML = menu.categories.map((c) => `
    <section class="course" id="${c.id}" aria-labelledby="h-${c.id}">
      <header class="course__head">
        <h2 class="course__title" id="h-${c.id}">${esc(c.name[lang])}</h2>
        <p class="course__alt" lang="${other(lang)}">${esc(c.name[other(lang)])}</p>
      </header>
      <ul class="dishes">${c.items.map((it) => dish(it, lang)).join('')}</ul>
    </section>`).join('');

  legend.innerHTML = `
    <p class="legend__title">${esc(t('menu.allergens'))}</p>
    <div class="legend__chips" role="group" aria-label="${esc(t('menu.allergens'))}">
      ${Object.entries(allergens).map(([n, a]) => `<button type="button" class="chip-a" aria-pressed="${avoid.has(+n)}" data-n="${n}"><b>${n}</b>${esc(a[lang])}</button>`).join('')}
    </div>
    <p class="legend__hint">${esc(t('menu.filter'))} <span class="legend__state" data-filter-state aria-live="polite"></span></p>`;
  legend.querySelectorAll('.chip-a').forEach((b) => b.addEventListener('click', () => {
    const n = Number(b.dataset.n);
    avoid.has(n) ? avoid.delete(n) : avoid.add(n);
    b.setAttribute('aria-pressed', String(avoid.has(n)));
    applyAvoid();
  }));
  applyAvoid();
  document.querySelectorAll('[data-pdf]').forEach((a) => (a.href = menu.pdfs[a.dataset.pdf]));
  spy();
}

/* Chapter bar: highlights the chapter in view and slides an ink line under it. */
let spyOn = false;
let refresh = () => {};
function spy() {
  const bar = document.querySelector('[data-chapters]');
  const links = [...bar.querySelectorAll('a')];
  const ink = bar.querySelector('.chapters__ink');
  let active = '';
  const set = (id) => {
    if (id === active) return;
    active = id;
    links.forEach((a) => (a.dataset.chap === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    const a = links.find((l) => l.dataset.chap === id);
    if (!a) return;
    ink.style.transform = `translateX(${a.offsetLeft}px)`;
    ink.style.width = `${a.offsetWidth}px`;
    bar.scrollTo({ left: a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
  };
  refresh = () => {
    const y = innerHeight * 0.3;
    let id = menu.categories[0].id;
    for (const c of menu.categories) {
      const el = document.getElementById(c.id);
      if (el && el.getBoundingClientRect().top <= y) id = c.id;
    }
    set(id);
  };
  if (!spyOn) {
    spyOn = true;
    addEventListener('scroll', () => requestAnimationFrame(() => refresh()), { passive: true });
    addEventListener('resize', () => refresh());
    document.fonts?.ready.then(() => refresh());
  }
  refresh();
}
