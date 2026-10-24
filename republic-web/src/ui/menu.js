// Interactive menu built from the official menu data (content/menu.js):
// featured dishes, an ARIA tablist of categories with staggered list
// transitions, allergen marks, and an allergen filter that dims dishes.
import { menu as officialMenu, allergens, featured } from '../content/menu.js';
import { site } from '../content/site.js';
import { t } from './lang.js';

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const other = (lang) => (lang === 'ka' ? 'en' : 'ka');
const price = (p) => (typeof p === 'number' ? `<span class="dish__price">${p}<small> ₾</small></span>` : '');
let current = 0;
const avoid = new Set();

function allergenMarks(a, lang) {
  if (!a?.length) return '';
  const names = a.map((n) => allergens[n]?.[lang]).filter(Boolean).join(', ');
  return `<span class="dish__allergens" aria-label="${esc(t('menu.contains'))}: ${esc(names)}" title="${esc(names)}">${a.join(' · ')}</span>`;
}

function dishHTML(it, i, lang) {
  const note = it.note ? `<span class="dish__note">${esc(it.note[lang] || it.note.en)}</span>` : '';
  return `<li class="dish" style="--i:${i}" data-a="${(it.a || []).join(',')}">
    <div class="dish__row">
      <span class="dish__name">${esc(it.name[lang])}${allergenMarks(it.a, lang)}</span>
      <span class="dish__leader" aria-hidden="true"></span>${price(it.price)}
    </div>
    <span class="dish__alt" lang="${other(lang)}">${esc(it.name[other(lang)])}</span>${note}
  </li>`;
}

function applyAvoid(root) {
  root.querySelectorAll('.dish, .feat').forEach((d) => {
    const a = (d.dataset.a || '').split(',').filter(Boolean).map(Number);
    d.classList.toggle('is-avoided', a.some((n) => avoid.has(n)));
  });
}

export function renderMenu(lang, data = officialMenu) {
  const root = document.querySelector('[data-menu]');
  const empty = root.querySelector('[data-menu-empty]');
  document.querySelectorAll('[data-pdf]').forEach((a) => (a.href = data.pdfs?.[a.dataset.pdf] || site.menuUrl));
  root.querySelector('.menu__ui')?.remove();
  const cats = (data.categories || []).filter((c) => c.items?.length);
  renderFeatured(lang, data);
  renderLegend(lang, root);
  if (!cats.length) { empty.hidden = false; return; }
  empty.hidden = true;
  current = Math.min(current, cats.length - 1);

  const ui = document.createElement('div');
  ui.className = 'menu__ui';
  ui.innerHTML = `
    <div class="tabs" role="tablist" aria-label="${esc(t('menu.tabs'))}">
      ${cats.map((c, i) => `<button role="tab" id="tab-${c.id}" aria-controls="menu-panel" aria-selected="${i === current}" tabindex="${i === current ? 0 : -1}" data-i="${i}"><span>${esc(c.name[lang])}</span><small>${c.items.length}</small></button>`).join('')}
      <span class="tabs__ink" aria-hidden="true"></span>
    </div>
    <div class="menu__panel" id="menu-panel" role="tabpanel" aria-labelledby="tab-${cats[current].id}" tabindex="0"></div>`;
  root.prepend(ui);

  const tabs = [...ui.querySelectorAll('[role="tab"]')];
  const ink = ui.querySelector('.tabs__ink');
  const panel = ui.querySelector('.menu__panel');
  const moveInk = () => {
    const b = tabs[current];
    ink.style.transform = `translateX(${b.offsetLeft}px)`;
    ink.style.width = `${b.offsetWidth}px`;
    const strip = b.parentElement;
    const target = b.offsetLeft - (strip.clientWidth - b.offsetWidth) / 2;
    strip.scrollTo({ left: target, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const fill = (animate) => {
    const c = cats[current];
    const swap = () => {
      panel.innerHTML = `<ul class="dishes">${c.items.map((it, i) => dishHTML(it, i, lang)).join('')}</ul>`;
      panel.setAttribute('aria-labelledby', `tab-${c.id}`);
      applyAvoid(panel);
      requestAnimationFrame(() => panel.classList.remove('is-leaving'));
    };
    if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panel.style.minHeight = panel.offsetHeight + 'px';
      panel.classList.add('is-leaving');
      setTimeout(() => { swap(); requestAnimationFrame(() => (panel.style.minHeight = '')); }, 240);
    } else swap();
  };
  const select = (i, focus) => {
    if (i === current) return;
    tabs[current].setAttribute('aria-selected', 'false'); tabs[current].tabIndex = -1;
    current = i;
    tabs[i].setAttribute('aria-selected', 'true'); tabs[i].tabIndex = 0;
    if (focus) tabs[i].focus({ preventScroll: true });
    moveInk(); fill(true);
  };
  tabs.forEach((b) => b.addEventListener('click', () => select(Number(b.dataset.i))));
  ui.querySelector('.tabs').addEventListener('keydown', (e) => {
    const map = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
    if (!(e.key in map)) return;
    e.preventDefault();
    const n = map[e.key];
    select(n === -Infinity ? 0 : n === Infinity ? tabs.length - 1 : (current + n + tabs.length) % tabs.length, true);
  });
  fill(false);
  requestAnimationFrame(moveInk);
  document.fonts?.ready.then(moveInk);
  addEventListener('resize', moveInk);
}

function renderFeatured(lang, data) {
  const box = document.querySelector('[data-featured]');
  box.querySelectorAll('.feat, .featured__label').forEach((n) => n.remove());
  const find = ([cat, en]) => data.categories?.find((c) => c.id === cat)?.items.find((i) => i.name.en === en);
  const items = featured.map((f) => [f[0], find(f)]).filter(([, it]) => it);
  if (!items.length) { box.hidden = true; return; }
  box.hidden = false;
  box.insertAdjacentHTML('beforeend', `<p class="featured__label kicker" aria-hidden="true">${esc(t('menu.featured'))}</p>` + items.map(([cat, it], i) => {
    const c = data.categories.find((x) => x.id === cat);
    return `<article class="feat" style="--i:${i}" data-reveal data-a="${(it.a || []).join(',')}">
      <span class="feat__no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <p class="feat__cat">${esc(c.name[lang])}</p>
      <h4 class="feat__name">${esc(it.name[lang])}</h4>
      <p class="feat__alt" lang="${other(lang)}">${esc(it.name[other(lang)])}</p>
      ${it.note ? `<p class="feat__note">${esc(it.note[lang])}</p>` : ''}
      <p class="feat__price">${it.price}<small> ₾</small>${allergenMarks(it.a, lang)}</p>
    </article>`;
  }).join(''));
}

function renderLegend(lang, root) {
  const box = document.querySelector('[data-legend]');
  box.innerHTML = `<p class="legend__title">${esc(t('menu.allergens'))}</p>
    <div class="legend__chips" role="group" aria-label="${esc(t('menu.allergens'))}">
      ${Object.entries(allergens).map(([n, a]) => `<button type="button" class="chip-a" aria-pressed="${avoid.has(+n)}" data-n="${n}"><b>${n}</b>${esc(a[lang])}</button>`).join('')}
    </div>
    <p class="legend__hint">${esc(t('menu.filter'))}</p>
    <p class="legend__note">${esc(t('menu.vat'))} ${esc(t('menu.ask'))}</p>`;
  box.querySelectorAll('.chip-a').forEach((b) => b.addEventListener('click', () => {
    const n = Number(b.dataset.n);
    avoid.has(n) ? avoid.delete(n) : avoid.add(n);
    b.setAttribute('aria-pressed', String(avoid.has(n)));
    applyAvoid(document.querySelector('#menu'));
  }));
}
