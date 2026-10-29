/* Sasperia — site behaviour without animation libraries.
   Phones: native scrolling only; motion is CSS (transform/opacity) started by IntersectionObserver.
   Desktop with a mouse: a few scroll scenes driven by one passive scroll handler. */
(() => {
const D = window.SASPERIA_DATA;
const I = window.SASPERIA_I18N;
const C = window.SASPERIA_CONTACT;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
};
const params = new URLSearchParams(location.search);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const richMQ = matchMedia('(min-width: 1000px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

/* ============================== i18n ============================== */
let lang = (() => {
  const s = store.get('sasperia.lang');
  if (I[s]) return s;
  const n = (navigator.language || '').slice(0, 2).toLowerCase();
  return I[n] ? n : 'en';
})();
if (I[params.get('lang')]) lang = params.get('lang');

const t = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), I[lang]) ?? '';
const L = (obj) => (obj && typeof obj === 'object' ? (obj[lang] ?? obj.en ?? '') : obj ?? '');

function applyI18n() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $$('[data-i18n-placeholder]').forEach((el) => el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)));
  $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  renderStory(); renderSpecials(); renderQr(); renderCocktails(); renderArt(); renderWine(); renderAreas(); renderForm();
  if (!$('#menuApp').hidden) renderMenu();
  if (sheetDish) fillSheet(sheetDish);
  measure();
}
function setLang(l) {
  if (!I[l] || l === lang) return;
  lang = l; store.set('sasperia.lang', l);
  applyI18n();
}
$$('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

/* ============================== contacts ============================== */
$$('[data-phone]').forEach((a) => { a.textContent = C.phone; a.href = C.phoneHref; });
$$('[data-phone-btn]').forEach((a) => { a.href = C.phoneHref; });
$$('[data-email]').forEach((a) => { a.textContent = C.email; a.href = 'mailto:' + C.email; });
$$('[data-map]').forEach((a) => { a.href = C.maps[a.dataset.map]; });
$('#social').innerHTML = C.social.map(([n, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${n}</a></li>`).join('');

/* ============================== data helpers ============================== */
const allDishes = () => D.food.flatMap((c) => c.items);
const dishById = (id) => allDishes().find((d) => d.id === id);
const SPECIALS = ['signature_ribs', 'OxpfD9QIqHzmRfNTruX', 'Oxpp-5s9ksq7SWWdtV_', 'Oxq0p_i9zYe-3VgRuDx'];
const KIND = { white: { ka: 'თეთრი', en: 'White', ru: 'Белое' }, amber: { ka: 'ქარვისფერი', en: 'Amber', ru: 'Янтарное' } };
const GEORGIA = { ka: 'საქართველო', en: 'Georgia', ru: 'Грузия' };
function sasperiaWines() {
  const out = [];
  D.wine.georgian.forEach((g) => g.items.forEach((w) => { if (w.producer && w.producer.en === 'Sasperia') out.push({ ...w, kindKey: g.key }); }));
  return out.map((w) => ({ name: L(w.name), kind: L(KIND[w.kindKey] || {}), region: L(w.region) + ', ' + GEORGIA[lang], bottle: w.bottle, glass: w.glass }));
}
const photoOrPh = (d) => d.img
  ? `<img src="${d.img}" alt="" loading="lazy" decoding="async">`
  : `<span class="ph"><img src="assets/img/emblem.svg" alt=""></span>`;

/* ============================== renderers ============================== */
function renderStory() {
  $('#storyParas').innerHTML = t('story.p').map((p, i) => `<p data-reveal style="--d:${i * 0.08}s">${esc(p)}</p>`).join('');
  observeReveals($('#storyParas'));
}

function renderSpecials() {
  $('#specialsTrack').innerHTML = SPECIALS.map((id, i) => {
    const d = dishById(id);
    return `<button type="button" class="dish-card" data-dish="${d.id}">
      <span class="dish-card__media">${photoOrPh(d)}<span class="dish-card__price">${d.price} ₾</span><span class="dish-card__idx">${['I', 'II', 'III', 'IV'][i]}</span></span>
      <span class="dish-card__name">${esc(L(d.name))}</span><span class="dish-card__desc">${esc(L(d.desc))}</span></button>`;
  }).join('');
}
$('#specialsTrack').addEventListener('click', (e) => { const c = e.target.closest('[data-dish]'); if (c) openDishSheet(dishById(c.dataset.dish)); });

function menuUrl() {
  const base = window.SASPERIA_SITE_URL || (location.origin + location.pathname);
  return base.split('#')[0] + '#menu';
}
function renderQr() {
  $('#qrCats').innerHTML = D.food.map((c) => `<li>${esc(L(c.title))}<b>${c.items.length}</b></li>`).join('');
  const withPhotos = allDishes().filter((d) => d.img).slice(0, 10);
  const feed = `<div class="mini-head">${esc(t('menu.food'))}</div>` + withPhotos.map((d) =>
    `<div class="mini">${photoOrPh(d)}<div><b>${esc(L(d.name))}</b><span>${d.price} ₾</span></div></div>`).join('');
  $('#phoneFeed').innerHTML = feed + feed;
  if (window.qrcode && !$('#qrCode').dataset.url) {
    const q = window.qrcode(0, 'H');
    q.addData(menuUrl()); q.make();
    $('#qrCode').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    $('#qrCode').dataset.url = menuUrl();
    const svg = $('#qrCode svg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'QR: ' + menuUrl());
  }
}

function renderCocktails() {
  const row = (c, cls) => `<li class="${cls}"><strong>${esc(c.name)}</strong><span class="price">${c.price} ₾</span><span class="ing">${esc(L(c.desc))}</span></li>`;
  $('#cocktailList').innerHTML =
    D.cocktails.filter((c) => c.kind === 'signature').map((c) => row(c, '')).join('') +
    `<li class="group">${esc(t('bar.classic'))} · 30 ₾</li>` +
    D.cocktails.filter((c) => c.kind === 'classic').map((c) => row(c, 'classic')).join('');
}

function renderArt() {
  $('#artName').textContent = L(D.sasperiaArt.name);
  $('#artPrice').textContent = D.sasperiaArt.price + ' ₾';
  $('#artDesc').textContent = L(D.sasperiaArt.desc);
}

function renderWine() {
  $('#wineList').innerHTML = sasperiaWines().map((w) => `<li><strong>${esc(w.name)}</strong><small>${esc(w.kind)} · ${esc(w.region)}</small>
    <span class="price">${w.bottle} ₾<br><small>${esc(t('wine.glass'))} ${w.glass ?? '—'} ₾</small></span></li>`).join('');
  const grapes = [];
  D.wine.georgian.forEach((g) => g.items.forEach((w) => { if (w.region) grapes.push([L(w.name).split(',')[0], L(w.region)]); }));
  const uniq = [...new Map(grapes.map((g) => [g[0], g])).values()];
  const row = uniq.map(([n, r]) => `<span>${esc(n)}</span><em>${esc(r)}</em>`).join('');
  $('#grapes').innerHTML = row + row;
}

function renderAreas() {
  $('#areas').innerHTML = t('spaces.list').map(([n, d]) => `<li><strong>${esc(n)}</strong><span>${esc(d)}</span></li>`).join('');
}

/* ============================== booking form ============================== */
const form = { time: null, area: 0 };
function renderForm() {
  const chips = [];
  for (let h = 12; h < 24; h++) for (const m of ['00', '30']) chips.push(`${h}:${m}`);
  $('#timeChips').innerHTML = chips.map((c) => `<button type="button" class="chip" aria-pressed="${c === form.time}" data-time="${c}">${c}</button>`).join('');
  const g = $('#fGuests'); const keep = g.value;
  g.innerHTML = Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('') + `<option value="10+">${esc(t('reserve.guestsMore'))}</option>`;
  g.value = keep || '2';
  $('#areaPick').innerHTML = t('spaces.list').map(([n, d], i) =>
    `<label><input type="radio" name="area" value="${i}" ${i === form.area ? 'checked' : ''}><strong>${esc(n)}</strong><small>${esc(d)}</small></label>`).join('');
  const now = new Date(); const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $('#fDate').min = iso; if (!$('#fDate').value) $('#fDate').value = iso;
  if (!$('#summary').hidden) buildSummary();
}
$('#timeChips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-time]'); if (!b) return;
  form.time = b.dataset.time;
  $$('#timeChips .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
});
$('#areaPick').addEventListener('change', (e) => { form.area = +e.target.value; });

function buildSummary() {
  const area = t('spaces.list')[form.area];
  const lines = [
    'Sasperia — ' + t('reserve.title'),
    `${t('reserve.name')}: ${$('#fName').value.trim()}`,
    `${t('reserve.phone')}: ${$('#fPhone').value.trim()}`,
    `${t('reserve.date')}: ${$('#fDate').value}`,
    `${t('reserve.time')}: ${form.time}`,
    `${t('reserve.guests')}: ${$('#fGuests').selectedOptions[0].textContent}`,
    `${t('reserve.area')}: ${area[0]} (${area[1]})`,
  ];
  const cm = $('#fComment').value.trim();
  if (cm) lines.push(`${t('reserve.comment')}: ${cm}`);
  const text = lines.join('\n');
  $('#summaryText').textContent = text;
  $('#mailBtn').href = `mailto:${C.email}?subject=${encodeURIComponent('Sasperia — ' + t('reserve.title'))}&body=${encodeURIComponent(text)}`;
  return text;
}
$('#reserveForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const err = $('#formError');
  const bad = [];
  [['#fName', (v) => v.trim().length > 1], ['#fPhone', (v) => v.replace(/\D/g, '').length >= 6], ['#fDate', (v) => !!v]].forEach(([s, ok]) => {
    const el = $(s); const good = ok(el.value); el.setAttribute('aria-invalid', String(!good)); if (!good) bad.push(el);
  });
  if (!form.time) bad.push($('#timeChips'));
  if (bad.length) {
    err.hidden = false;
    err.textContent = t('reserve.required') + ' — ' + bad.map((b) => b.id === 'timeChips' ? t('reserve.time') : b.closest('label').querySelector('span').textContent).join(', ');
    if (bad[0].focus) bad[0].focus();
    return;
  }
  err.hidden = true;
  buildSummary();
  $('#reserveForm').hidden = true; $('#summary').hidden = false;
  $('#summary').scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
});
$('#editBtn').addEventListener('click', () => { $('#summary').hidden = true; $('#reserveForm').hidden = false; });
$('#copyBtn').addEventListener('click', async () => {
  const text = buildSummary(); const btn = $('#copyBtn');
  try { await navigator.clipboard.writeText(text); btn.textContent = t('reserve.copied'); }
  catch (e) { const r = document.createRange(); r.selectNodeContents($('#summaryText')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  setTimeout(() => { btn.textContent = t('reserve.copy'); }, 1800);
});

/* ============================== overlays: shared helpers ============================== */
const locks = new Set();
function lock(key, on) {
  on ? locks.add(key) : locks.delete(key);
  document.documentElement.classList.toggle('no-scroll', locks.size > 0);
}
const setInert = (nodes, on) => nodes.forEach((n) => { if (n) n.inert = on; });
const pageParts = () => [$('main'), $('#nav'), $('.footer'), $('#drawer')];
const menuParts = () => ['.menu-app__top', '.menu-app__tabs', '.menu-app__tools', '#menuBody'].map((q) => $(q));

// Show/hide with a CSS transition; `hidden` is set only after the transition ends.
function showLayer(el) {
  clearTimeout(el._hideT);
  el.hidden = false;
  void el.offsetWidth; // start the transition from the hidden state
  el.classList.add('is-open');
}
function hideLayer(el, done) {
  el.classList.remove('is-open');
  clearTimeout(el._hideT);
  el._hideT = setTimeout(() => { el.hidden = true; done && done(); }, reduce ? 0 : 320);
}

/* ============================== QR menu app ============================== */
const app = { tab: 'food', q: '' };
const TABS = ['food', 'bar', 'wine', 'cocktails'];
const norm = (s) => String(s).toLowerCase();
const hl = (s) => {
  const e = esc(s); if (!app.q) return e;
  const i = norm(s).indexOf(norm(app.q)); if (i < 0) return e;
  return esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + app.q.length)) + '</mark>' + esc(s.slice(i + app.q.length));
};
const match = (...vals) => !app.q || vals.some((v) => v && Object.values(typeof v === 'object' ? v : { v }).some((x) => norm(x).includes(norm(app.q))));

function menuSections() {
  if (app.tab === 'food') return D.food.map((c) => ({ id: 'm-' + c.key, title: L(c.title), items: c.items.filter((d) => match(d.name, d.desc)), kind: 'dish' }));
  if (app.tab === 'bar') {
    const secs = D.bar.map((s) => ({ id: 'm-' + s.key, title: L(s.title), unit: s.unit && L(s.unit), items: s.items.filter((i) => match(i.name)), kind: 'row' }));
    const coffee = secs.find((s) => s.id === 'm-coffee');
    if (coffee && match(D.sasperiaArt.name, D.sasperiaArt.desc)) coffee.items = [{ name: D.sasperiaArt.name, price: D.sasperiaArt.price, desc: D.sasperiaArt.desc }, ...coffee.items];
    return secs;
  }
  if (app.tab === 'wine') {
    return [['georgian', t('menu.georgian')], ['world', t('menu.world')]].flatMap(([k, title]) =>
      D.wine[k].map((g, gi) => ({ id: 'm-' + k + '-' + g.key, title: L(g.title), group: gi === 0 ? title : null, items: g.items.filter((w) => match(w.name, w.producer)), kind: 'wine' })));
  }
  return [['signature', t('bar.signature')], ['classic', t('bar.classic')]].map(([k, title]) => ({
    id: 'm-c-' + k, title, items: D.cocktails.filter((c) => c.kind === k && match(c.name, c.desc)), kind: 'cocktail' }));
}

function renderMenu() {
  $$('#menuTabs [data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === app.tab)));
  const secs = menuSections().filter((s) => s.items.length);
  $('#menuChips').innerHTML = secs.map((s, i) => `<button type="button" data-target="${s.id}" aria-current="${i === 0}">${esc(s.title)}</button>`).join('');
  if (!secs.length) { $('#menuBody').innerHTML = `<p class="m-empty">${esc(t('menu.noResults'))}</p>`; return; }
  const row = (s, it) => {
    if (s.kind === 'dish') return `<li><button type="button" class="m-item" data-dish="${it.id}">${photoOrPh(it)}<span><b>${hl(L(it.name))}</b><small>${hl(L(it.desc))}</small></span><span class="price">${it.price} ₾</span></button></li>`;
    if (s.kind === 'wine') {
      const sub = [it.producer && L(it.producer), it.region && L(it.region)].filter(Boolean).join(' · ');
      return `<li class="m-item m-item--text"><span><b>${hl(L(it.name))}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span><span class="price">${it.bottle} ₾${it.glass ? `<small>${esc(t('wine.glass'))} ${it.glass} ₾</small>` : ''}</span></li>`;
    }
    if (s.kind === 'cocktail') return `<li class="m-item m-item--text"><span><b>${hl(it.name)}</b><small>${hl(L(it.desc))}</small></span><span class="price">${it.price} ₾</span></li>`;
    return `<li class="m-item m-item--text"><span><b>${hl(L(it.name))}</b>${it.desc ? `<small>${esc(L(it.desc))}</small>` : ''}</span><span class="price">${it.price} ₾</span></li>`;
  };
  $('#menuBody').innerHTML = secs.map((s) => `
    ${s.group ? `<p class="m-sub">${esc(s.group)}</p>` : ''}
    <section class="m-sec" id="${s.id}"><h2>${esc(s.title)} ${s.unit ? `<small>${esc(s.unit)}</small>` : `<small>${s.items.length}</small>`}</h2>
    <ul class="m-list ${s.kind === 'dish' ? 'has-photos' : ''}">${s.items.map((it) => row(s, it)).join('')}</ul></section>`).join('') +
    (app.tab !== 'food' ? `<p class="m-note">${esc(t('menu.vat'))}</p>` : '') +
    (app.tab === 'wine' ? `<p class="m-note">${esc(t('wine.soon'))}</p>` : '');
  observeMenuSections();
}

let menuObserver = null;
function setActiveChip(id) {
  const chips = $('#menuChips');
  let act = null;
  $$('button', chips).forEach((b) => { const on = b.dataset.target === id; b.setAttribute('aria-current', String(on)); if (on) act = b; });
  // Scroll only the chip row; never scrollIntoView, which would fight the menu's own momentum scroll.
  if (act) chips.scrollTo({ left: act.offsetLeft - chips.clientWidth / 2 + act.offsetWidth / 2, behavior: 'smooth' });
}
function observeMenuSections() {
  menuObserver && menuObserver.disconnect();
  menuObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setActiveChip(en.target.id); });
  }, { root: $('#menuBody'), rootMargin: '0px 0px -75% 0px' });
  $$('#menuBody .m-sec').forEach((s) => menuObserver.observe(s));
}
$('#menuChips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-target]'); if (!b) return;
  const sec = document.getElementById(b.dataset.target);
  $('#menuBody').scrollTo({ top: sec.offsetTop - 6, behavior: reduce ? 'auto' : 'smooth' });
});
$('#menuTabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  app.tab = b.dataset.tab; $('#menuBody').scrollTop = 0; renderMenu();
  history.replaceState(history.state, '', menuHash());
});
$('#menuSearch').addEventListener('input', (e) => { app.q = e.target.value.trim(); renderMenu(); });
$('#menuBody').addEventListener('click', (e) => { const b = e.target.closest('[data-dish]'); if (b) openDishSheet(dishById(b.dataset.dish)); });

let lastFocus = null, menuPushed = false;
const menuHash = () => (app.tab === 'food' ? '#menu' : '#menu-' + app.tab);
function openMenu(tab = 'food', push = false) {
  app.tab = TABS.includes(tab) ? tab : 'food';
  const el = $('#menuApp');
  const wasHidden = el.hidden || !el.classList.contains('is-open');
  if (wasHidden) lastFocus = document.activeElement;
  renderMenu();
  showLayer(el);
  lock('menu', true); setInert(pageParts(), true);
  if (location.hash !== menuHash()) {
    if (push && wasHidden) { history.pushState({ menu: 1 }, '', menuHash()); menuPushed = true; }
    else history.replaceState(history.state, '', menuHash());
  }
  $('#menuClose').focus({ preventScroll: true });
}
function closeMenu(fromHistory = false) {
  const el = $('#menuApp'); if (el.hidden || !el.classList.contains('is-open')) return;
  if (!fromHistory && menuPushed) { menuPushed = false; history.back(); }
  else { menuPushed = false; if (/^#menu/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); }
  hideLayer(el, () => {
    lock('menu', false); setInert(pageParts(), false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  });
}
$('#menuClose').addEventListener('click', () => closeMenu());

function routeHash() {
  const h = location.hash.replace('#', '');
  if (h === 'menu' || h.startsWith('menu-')) openMenu(h.split('-')[1] || 'food');
  else if (!$('#menuApp').hidden) { menuPushed = false; closeMenu(true); }
}
window.addEventListener('hashchange', routeHash);
window.addEventListener('popstate', routeHash);

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-open-menu]');
  if (a) { e.preventDefault(); closeDrawer(); openMenu(a.dataset.openMenu, true); return; }
  const link = e.target.closest('a[href^="#"]');
  if (link && link.getAttribute('href').length > 1) {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { e.preventDefault(); closeDrawer(); target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  }
});

/* ============================== dish sheet ============================== */
let sheetDish = null, sheetOpener = null;
function fillSheet(d) {
  $('#sheetMedia').innerHTML = d.img ? `<img src="${d.img}" alt="" decoding="async">` : photoOrPh(d);
  $('#sheetName').textContent = L(d.name);
  $('#sheetPrice').textContent = d.price + ' ₾';
  $('#sheetDesc').textContent = L(d.desc);
}
function openDishSheet(d) {
  if (!d) return;
  sheetDish = d; sheetOpener = document.activeElement;
  fillSheet(d);
  const sh = $('#sheet');
  const inMenu = !$('#menuApp').hidden;
  (inMenu ? $('#menuApp') : document.body).appendChild(sh);
  $('#sheetCard').style.transform = '';
  showLayer(sh);
  lock('sheet', true);
  setInert(inMenu ? menuParts() : pageParts(), true);
  $('.sheet__close').focus({ preventScroll: true });
}
function closeSheet() {
  const sh = $('#sheet'); if (sh.hidden || !sh.classList.contains('is-open')) return;
  const inMenu = !!sh.closest('#menuApp');
  $('#sheetCard').style.transform = '';
  hideLayer(sh, () => {
    sheetDish = null; lock('sheet', false);
    setInert(inMenu ? menuParts() : pageParts(), false);
    if (!$('#menuApp').hidden) setInert(pageParts(), true);
    if (sheetOpener && sheetOpener.focus) sheetOpener.focus({ preventScroll: true });
  });
}
$('#sheet').addEventListener('click', (e) => { if (e.target.closest('[data-close-sheet]')) closeSheet(); });
(() => {
  // Drag down from the photo or the grab bar to close (those areas have touch-action:none).
  const card = $('#sheetCard'); let y0 = null, ts = 0, dy = 0, pid = null;
  const reset = () => { y0 = null; pid = null; card.classList.remove('is-dragging'); };
  card.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.sheet__media, .sheet__grab') || card.scrollTop > 0) return;
    y0 = e.clientY; ts = performance.now(); dy = 0; pid = e.pointerId; card.classList.add('is-dragging');
    try { card.setPointerCapture(pid); } catch (err) { /* optional */ }
  });
  card.addEventListener('pointermove', (e) => {
    if (y0 == null || e.pointerId !== pid) return;
    dy = Math.max(0, e.clientY - y0); card.style.transform = `translate3d(0,${dy}px,0)`;
  });
  card.addEventListener('pointerup', () => {
    if (y0 == null) return; const v = dy / Math.max(1, performance.now() - ts); reset();
    if (dy > 120 || (v > 0.6 && dy > 30)) closeSheet(); else card.style.transform = '';
  });
  card.addEventListener('pointercancel', () => { if (y0 == null) return; reset(); card.style.transform = ''; });
})();
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#sheet').hidden) closeSheet(); else if (!$('#menuApp').hidden) closeMenu(); else closeDrawer();
});

/* ============================== drawer ============================== */
const burger = $('#burger'), drawer = $('#drawer');
function closeDrawer() {
  if (drawer.hidden) return;
  burger.setAttribute('aria-expanded', 'false');
  hideLayer(drawer);
  lock('drawer', false); setInert([$('main'), $('.footer')], false);
}
burger.addEventListener('click', () => {
  if (!drawer.hidden && drawer.classList.contains('is-open')) return closeDrawer();
  burger.setAttribute('aria-expanded', 'true');
  showLayer(drawer); lock('drawer', true); setInert([$('main'), $('.footer')], true);
});

/* ============================== reveals (CSS, started once) ============================== */
const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
}, { rootMargin: '0px 0px -8% 0px' }) : null;
function observeReveals(root = document) {
  $$('[data-reveal]:not(.in)', root).forEach((el) => (revealIO ? revealIO.observe(el) : el.classList.add('in')));
}
// Looping CSS animations run only while their section is on screen.
const runIO = new IntersectionObserver((entries) => entries.forEach((en) => en.target.classList.toggle('run', en.isIntersecting)));
['#qrmenu', '#bar', '#wine', '#story'].forEach((s) => runIO.observe($(s)));
const storyIO = new IntersectionObserver(([en]) => { if (en.isIntersecting) { $('#story').classList.add('in'); storyIO.disconnect(); } }, { threshold: 0.2 });
storyIO.observe($('#story'));

/* ============================== nav state ============================== */
let lastY = 0, navTick = false;
function onScrollNav() {
  navTick = false;
  const y = window.scrollY;
  const nav = $('#nav');
  nav.classList.toggle('is-scrolled', y > 40);
  if (y > lastY + 4 && y > innerHeight && drawer.hidden) nav.classList.add('is-hidden');
  else if (y < lastY - 4) nav.classList.remove('is-hidden');
  lastY = y;
}

/* ============================== desktop scroll scenes ============================== */
let rich = false;
const S = { spDist: 0, cards: [], ringR: 0 };
function measure() {
  rich = richMQ.matches;
  document.documentElement.classList.toggle('rich', rich);
  const sp = $('#specials'), track = $('#specialsTrack');
  if (!rich) {
    sp.style.height = ''; track.style.transform = '';
    $$('.dish-card', track).forEach((c) => { c.style.transform = ''; });
    $$('#deck img, #ring img').forEach((i) => { i.style.transform = ''; });
    $('#ring').style.transform = ''; $('#phone').style.transform = ''; $('#qrCard').style.transform = '';
    return;
  }
  S.spDist = Math.max(0, track.scrollWidth - innerWidth);
  sp.style.height = innerHeight + S.spDist + 'px';
  S.cards = $$('.dish-card', track).map((c) => ({ el: c, center: c.offsetLeft + c.offsetWidth / 2 }));
  const ringImgs = $$('#ring img');
  const cw = clamp(innerWidth * 0.2, 180, 260);
  $('#ring').style.setProperty('--card-w', cw + 'px');
  S.ringR = (cw * 1.12 * ringImgs.length) / (2 * Math.PI);
  ringImgs.forEach((img, i) => { img.style.transform = `rotateY(${(i * 360) / ringImgs.length}deg) translateZ(${S.ringR}px)`; });
  scenes();
}
const progress = (el) => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1); };
function scenes() {
  if (!rich) return;
  // Specials: vertical scroll moves the track sideways; cards turn as they pass the centre.
  const sp = $('#specials'); const r = sp.getBoundingClientRect();
  if (r.bottom > 0 && r.top < innerHeight) {
    const p = S.spDist ? clamp(-r.top / S.spDist, 0, 1) : 0;
    const x = -p * S.spDist;
    $('#specialsTrack').style.transform = `translate3d(${x}px,0,0)`;
    const mid = innerWidth / 2;
    S.cards.forEach(({ el, center }) => {
      const d = clamp((center + x - mid) / innerWidth, -1, 1);
      el.style.transform = `perspective(1200px) rotateY(${d * -28}deg) translateZ(${-Math.abs(d) * 120}px)`;
    });
  }
  const phoneScene = $('#qrmenu');
  if (inView(phoneScene)) {
    const p = progress(phoneScene);
    $('#phone').style.transform = `rotateY(${-34 + p * 50}deg) rotateX(${14 - p * 20}deg) rotateZ(${-6 + p * 8}deg) translateY(${80 - p * 120}px)`;
    $('#qrCard').style.transform = `translateY(${120 - p * 150}px) rotate(${-14 + p * 10}deg)`;
  }
  const deck = $('#deck');
  if (inView(deck)) {
    const p = progress(deck); const spread = clamp((p - 0.1) / 0.4, 0, 1);
    const imgs = $$('img', deck); const c = (imgs.length - 1) / 2;
    imgs.forEach((img, i) => {
      const k = i - c;
      img.style.transform = `translate(-50%,-50%) translate3d(${k * 26 * spread}%, ${Math.abs(k) * 6 * spread}%, ${-Math.abs(k) * 60 * spread}px) rotate(${k * 7 * spread}deg) rotateY(${k * -10 * spread}deg)`;
    });
  }
  const ringScene = $('.ring-scene');
  if (inView(ringScene)) {
    $('#ring').style.transform = `translateZ(${-S.ringR}px) rotateX(-7deg) rotateY(${-progress(ringScene) * 200}deg)`;
  }
  const heroImg = $('.hero__photo img');
  if (window.scrollY < innerHeight * 1.2) heroImg.style.transform = `translate3d(0,${window.scrollY * 0.18}px,0) scale(1.04)`;
}
const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > -100 && r.top < innerHeight + 100; };

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { ticking = false; onScrollNav(); scenes(); });
}, { passive: true });
let resizeT = 0;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(measure, 150); });
richMQ.addEventListener ? richMQ.addEventListener('change', measure) : richMQ.addListener(measure);

/* ============================== boot ============================== */
function boot() {
  applyI18n();
  observeReveals();
  document.documentElement.classList.add('ready');
  routeHash();
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
}
boot();
})();
