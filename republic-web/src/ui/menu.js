// Interactive menu: ARIA tablist of categories, staggered list transitions,
// expandable dish details. Renders only verified data from content/menu.js;
// with no data it keeps the honest empty state in the markup.
import { menu } from '../content/menu.js';
import { site } from '../content/site.js';
import { t } from './lang.js';

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let current = 0;

export function renderMenu(lang, data = menu) {
  const root = document.querySelector('[data-menu]');
  const empty = root.querySelector('[data-menu-empty]');
  root.querySelectorAll('[data-menu-link]').forEach((a) => (a.href = site.menuUrl));
  root.querySelector('.menu__ui')?.remove();
  const cats = (data.categories || []).filter((c) => c.items?.length);
  if (!cats.length) { empty.hidden = false; renderSignature(lang, data); return; }

  empty.hidden = true;
  current = Math.min(current, cats.length - 1);
  const ui = document.createElement('div');
  ui.className = 'menu__ui';
  ui.innerHTML = `
    <div class="tabs" role="tablist" aria-label="${esc(t('menu.tabs'))}">
      ${cats.map((c, i) => `<button role="tab" id="tab-${c.id}" aria-controls="panel" aria-selected="${i === current}" tabindex="${i === current ? 0 : -1}" data-i="${i}">${esc(c.name[lang] || c.name.en)}</button>`).join('')}
      <span class="tabs__ink" aria-hidden="true"></span>
    </div>
    <div class="menu__panel" id="panel" role="tabpanel" aria-labelledby="tab-${cats[current].id}" tabindex="0"></div>
    <p class="menu__source"><a href="${esc(site.menuUrl)}" target="_blank" rel="noopener">${esc(t('menu.open'))} ↗</a></p>`;
  root.prepend(ui);

  const tabs = [...ui.querySelectorAll('[role="tab"]')];
  const ink = ui.querySelector('.tabs__ink');
  const panel = ui.querySelector('.menu__panel');
  const moveInk = () => {
    const b = tabs[current];
    ink.style.transform = `translateX(${b.offsetLeft}px)`;
    ink.style.width = `${b.offsetWidth}px`;
    b.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };
  const fill = (animate) => {
    const c = cats[current];
    const html = c.items.map((it, i) => {
      const name = esc(it.name[lang] || it.name.en);
      const desc = it.description ? esc(it.description[lang] || it.description.en) : '';
      const price = typeof it.price === 'number' ? `<span class="dish__price">${it.price.toFixed(it.price % 1 ? 2 : 0)} <small>${esc(t('menu.currency'))}</small></span>` : '';
      const id = `dish-${c.id}-${i}`;
      const body = desc ? `<button class="dish__toggle" aria-expanded="false" aria-controls="${id}"><span class="dish__name">${name}</span><span class="dish__leader" aria-hidden="true"></span>${price}<span class="dish__plus" aria-hidden="true"></span><span class="sr-only">${esc(t('menu.details'))}</span></button><div class="dish__more" id="${id}"><div><p>${desc}</p></div></div>`
        : `<div class="dish__row"><span class="dish__name">${name}</span><span class="dish__leader" aria-hidden="true"></span>${price}</div>`;
      return `<li class="dish${it.signature ? ' dish--sig' : ''}" style="--i:${i}">${body}</li>`;
    }).join('');
    const swap = () => {
      panel.innerHTML = `<ul class="dishes">${html}</ul>`;
      panel.setAttribute('aria-labelledby', `tab-${c.id}`);
      requestAnimationFrame(() => panel.classList.remove('is-leaving'));
    };
    if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panel.classList.add('is-leaving');
      setTimeout(swap, 260);
    } else swap();
  };
  const select = (i, focus) => {
    if (i === current) return;
    tabs[current].setAttribute('aria-selected', 'false'); tabs[current].tabIndex = -1;
    current = i;
    tabs[i].setAttribute('aria-selected', 'true'); tabs[i].tabIndex = 0;
    if (focus) tabs[i].focus();
    moveInk(); fill(true);
  };
  tabs.forEach((b) => b.addEventListener('click', () => select(Number(b.dataset.i))));
  ui.querySelector('.tabs').addEventListener('keydown', (e) => {
    const map = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
    if (!(e.key in map)) return;
    e.preventDefault();
    const n = map[e.key];
    const i = n === -Infinity ? 0 : n === Infinity ? tabs.length - 1 : (current + n + tabs.length) % tabs.length;
    select(i, true);
  });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('.dish__toggle');
    if (!b) return;
    const open = b.getAttribute('aria-expanded') === 'true';
    b.setAttribute('aria-expanded', String(!open));
    b.closest('.dish').classList.toggle('is-open', !open);
  });
  fill(false);
  requestAnimationFrame(moveInk);
  addEventListener('resize', moveInk);
  renderSignature(lang, data);
}

// Signature spread — only dishes the restaurant has marked as signatures.
function renderSignature(lang, data) {
  const sec = document.getElementById('signature');
  const list = sec.querySelector('[data-signature]');
  const sig = (data.categories || []).flatMap((c) => c.items || []).filter((i) => i.signature);
  sec.hidden = !sig.length;
  list.innerHTML = sig.map((it, i) => `
    <article class="sig" style="--i:${i}" data-reveal>
      ${it.image ? `<figure class="sig__img" data-slot="${esc(it.image)}" data-sizes="(min-width: 900px) 40vw, 90vw"></figure>` : ''}
      <h3 class="display display--m">${esc(it.name[lang] || it.name.en)}</h3>
      ${it.description ? `<p>${esc(it.description[lang] || it.description.en)}</p>` : ''}
      ${typeof it.price === 'number' ? `<p class="sig__price">${it.price} ${esc(t('menu.currency'))}</p>` : ''}
    </article>`).join('');
}
