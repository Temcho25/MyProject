/* Sasperia — site behaviour: languages, preloader, smooth scroll, scroll scenes, QR menu, booking. */
const D = window.SASPERIA_DATA;
const I = window.SASPERIA_I18N;
const C = window.SASPERIA_CONTACT;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);
window.SasperiaAudio = window.SasperiaAudio || { on: false, pluck() {}, async toggle() { return false; }, async renderOffline() { return null; } };

const $ = (s, r = document) => r.querySelector(s);
const pathLen = (p) => { try { return p.getTotalLength() || 0; } catch (e) { return 0; } };
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
};

const params = new URLSearchParams(location.search);
const CAPTURE = params.has('capture');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches && !CAPTURE;
const coarse = matchMedia('(pointer: coarse)').matches;
const small = Math.min(screen.width, screen.height) < 520;
const QUALITY = params.get('q') || ((coarse && small) ? 'low' : 'high');
document.documentElement.classList.toggle('reduce', reduce);
document.documentElement.classList.toggle('capture', CAPTURE);

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
  if (bottleApi) bottleApi.setWines(sasperiaWines());
}

function setLang(l) {
  if (!I[l] || l === lang) return;
  lang = l; store.set('sasperia.lang', l);
  applyI18n();
  requestAnimationFrame(() => ScrollTrigger.refresh());
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
function sasperiaWines() {
  const out = [];
  D.wine.georgian.forEach((g) => g.items.forEach((w) => {
    if (w.producer && w.producer.en === 'Sasperia') out.push({ ...w, kindKey: g.key });
  }));
  return out.map((w) => ({
    name: L(w.name), kind: L(KIND[w.kindKey] || {}), region: (L(w.region) + ', ' + ({ ka: 'საქართველო', en: 'Georgia', ru: 'Грузия' })[lang]),
    bottle: w.bottle, glass: w.glass,
  }));
}
const photoOrPh = (d, cls = '') => d.img
  ? `<img src="${d.img}" alt="" loading="lazy" decoding="async" class="${cls}">`
  : `<span class="ph ${cls}"><img src="assets/img/emblem.svg" alt=""></span>`;

/* ============================== renderers ============================== */
function renderStory() {
  $('#storyParas').innerHTML = t('story.p').map((p) =>
    `<p>${p.split(/\s+/).map((w) => `<span class="w">${esc(w)}</span>`).join(' ')}</p>`).join('');
  if (reduce) $$('#storyParas .w').forEach((w) => w.classList.add('on'));
  storyWordTriggers();
}

function renderSpecials() {
  $('#specialsTrack').innerHTML = SPECIALS.map((id, i) => {
    const d = dishById(id);
    return `<article class="dish-card" data-dish="${d.id}" tabindex="0" role="button">
      <div class="dish-card__media">${photoOrPh(d)}<span class="dish-card__price">${d.price} ₾</span><span class="dish-card__idx">${['I', 'II', 'III', 'IV'][i]}</span></div>
      <h3>${esc(L(d.name))}</h3><p>${esc(L(d.desc))}</p></article>`;
  }).join('');
  $$('#specialsTrack .dish-card').forEach((c) => {
    c.addEventListener('click', () => openDishSheet(dishById(c.dataset.dish)));
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(), openDishSheet(dishById(c.dataset.dish)); });
  });
}

function menuUrl() {
  const base = window.SASPERIA_SITE_URL || (location.origin + location.pathname);
  return base.split('#')[0] + '#menu';
}
function renderQr() {
  $('#qrCats').innerHTML = D.food.map((c) => `<li>${esc(L(c.title))}<b>${c.items.length}</b></li>`).join('');
  const withPhotos = allDishes().filter((d) => d.img).slice(0, 14);
  const feed = `<div class="mini-head">${esc(t('menu.food'))}</div>` + withPhotos.map((d) =>
    `<div class="mini">${photoOrPh(d)}<div><b>${esc(L(d.name))}</b><span>${d.price} ₾</span></div></div>`).join('');
  $('#phoneFeed').innerHTML = feed + feed;
  if (window.qrcode && !$('#qrCode').dataset.url) {
    const q = window.qrcode(0, 'H');
    q.addData(menuUrl()); q.make();
    $('#qrCode').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    $('#qrCode').dataset.url = menuUrl();
    $('#qrCode svg').setAttribute('role', 'img');
    $('#qrCode svg').setAttribute('aria-label', 'QR: ' + menuUrl());
  }
}

function renderCocktails() {
  const sig = D.cocktails.filter((c) => c.kind === 'signature');
  const cls = D.cocktails.filter((c) => c.kind === 'classic');
  $('#cocktailList').innerHTML =
    sig.map((c) => `<li><strong>${esc(c.name)}</strong><span class="price">${c.price} ₾</span><span class="ing">${esc(L(c.desc))}</span></li>`).join('') +
    `<li class="group">${esc(t('bar.classic'))} · 30 ₾</li>` +
    cls.map((c) => `<li class="classic"><strong>${esc(c.name)}</strong><span class="price">${c.price} ₾</span><span class="ing">${esc(L(c.desc))}</span></li>`).join('');
}

function renderArt() {
  $('#artName').textContent = L(D.sasperiaArt.name);
  $('#artPrice').textContent = D.sasperiaArt.price + ' ₾';
  $('#artDesc').textContent = L(D.sasperiaArt.desc);
}

function renderWine() {
  const ws = sasperiaWines();
  $('#wineList').innerHTML = ws.map((w, i) => `<li data-i="${i}"><strong>${esc(w.name)}</strong><small>${esc(w.kind)} · ${esc(w.region)}</small>
    <span class="price">${w.bottle} ₾<br><small>${esc(t('wine.glass'))} ${w.glass ?? '—'} ₾</small></span></li>`).join('');
  $$('#wineList li').forEach((li) => li.addEventListener('click', () => scrollToWine(+li.dataset.i)));
  setActiveWine(activeWine, true);
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
  const today = new Date(); const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $('#fDate').min = iso; if (!$('#fDate').value) $('#fDate').value = iso;
  if (!$('#summary').hidden) buildSummary();
}
$('#timeChips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-time]'); if (!b) return;
  form.time = b.dataset.time;
  $$('#timeChips .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  window.SasperiaAudio && window.SasperiaAudio.pluck(1);
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
    err.hidden = false; err.textContent = t('reserve.required') + ' — ' + bad.map((b) => b.id === 'timeChips' ? t('reserve.time') : b.closest('label').querySelector('span').textContent).join(', ');
    bad[0].focus ? bad[0].focus() : null;
    return;
  }
  err.hidden = true;
  buildSummary();
  $('#reserveForm').hidden = true; $('#summary').hidden = false;
  gsap.from('#summary', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out' });
  window.SasperiaAudio && window.SasperiaAudio.pluck(4);
  ScrollTrigger.refresh();
});
$('#editBtn').addEventListener('click', () => { $('#summary').hidden = true; $('#reserveForm').hidden = false; ScrollTrigger.refresh(); });
$('#copyBtn').addEventListener('click', async () => {
  const text = buildSummary(); const btn = $('#copyBtn');
  try { await navigator.clipboard.writeText(text); btn.textContent = t('reserve.copied'); }
  catch (e) { const r = document.createRange(); r.selectNodeContents($('#summaryText')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  setTimeout(() => { btn.textContent = t('reserve.copy'); }, 1800);
});

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
    if (coffee && match(D.sasperiaArt.name, D.sasperiaArt.desc)) coffee.items = [{ name: D.sasperiaArt.name, price: D.sasperiaArt.price, desc: D.sasperiaArt.desc, art: true }, ...coffee.items];
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
  const row = (s, it, i) => {
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
    <ul class="m-list ${s.kind === 'dish' ? 'has-photos' : ''}">${s.items.map((it, i) => row(s, it, i)).join('')}</ul></section>`).join('') +
    (app.tab !== 'food' ? `<p class="m-note">${esc(t('menu.vat'))}</p>` : '') +
    (app.tab === 'wine' ? `<p class="m-note">${esc(t('wine.soon'))}</p>` : '');
  observeMenuSections();
}

let menuObserver = null;
function observeMenuSections() {
  menuObserver && menuObserver.disconnect();
  menuObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      $$('#menuChips button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.target === id)));
      const act = $(`#menuChips [data-target="${id}"]`);
      act && act.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
  }, { root: $('#menuBody'), rootMargin: '0px 0px -70% 0px' });
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
  history.replaceState(null, '', app.tab === 'food' ? '#menu' : '#menu-' + app.tab);
});
$('#menuSearch').addEventListener('input', (e) => { app.q = e.target.value.trim(); renderMenu(); });
$('#menuBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-dish]'); if (b) openDishSheet(dishById(b.dataset.dish));
});

/* Scroll lock + inert background shared by the menu, the dish sheet and the drawer */
const locks = new Set();
function lock(key, on) {
  on ? locks.add(key) : locks.delete(key);
  const any = locks.size > 0;
  document.documentElement.classList.toggle('no-scroll', any);
  if (lenis) any ? lenis.stop() : lenis.start();
}
function setInert(nodes, on) { nodes.forEach((n) => { if (n) n.inert = on; }); }
const pageParts = () => [$('main'), $('#nav'), $('.footer')];
const menuParts = () => ['.menu-app__top', '.menu-app__tabs', '.menu-app__tools', '#menuBody'].map((q) => $(q));

let lastFocus = null, menuPushed = false, menuClosing = false;
const menuHash = () => (app.tab === 'food' ? '#menu' : '#menu-' + app.tab);
function openMenu(tab = 'food', origin, push = false) {
  app.tab = TABS.includes(tab) ? tab : 'food';
  const el = $('#menuApp');
  gsap.killTweensOf(el);
  const wasHidden = el.hidden || menuClosing;
  menuClosing = false;
  if (wasHidden) lastFocus = document.activeElement;
  renderMenu();
  el.hidden = false; gsap.set(el, { clearProps: 'clipPath' });
  lock('menu', true); setInert([...pageParts(), $('#drawer')], true);
  if (location.hash !== menuHash()) {
    if (push && wasHidden) { history.pushState({ menu: 1 }, '', menuHash()); menuPushed = true; }
    else history.replaceState(history.state, '', menuHash());
  }
  if (wasHidden && !reduce) {
    const x = origin ? origin.x : innerWidth / 2, y = origin ? origin.y : innerHeight / 2;
    gsap.fromTo(el, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${x}px ${y}px)`, duration: 0.9, ease: 'power3.inOut', clearProps: 'clipPath' });
    gsap.from('#menuBody .m-sec', { y: 30, opacity: 0, duration: 0.7, stagger: 0.06, delay: 0.35, ease: 'power3.out', clearProps: 'all' });
  }
  $('#menuClose').focus({ preventScroll: true });
  heroApi && heroApi.pause();
}
function closeMenu(fromHistory = false) {
  const el = $('#menuApp'); if (el.hidden || menuClosing) return;
  menuClosing = true;
  if (!fromHistory && menuPushed) { menuPushed = false; history.back(); }
  else { menuPushed = false; if (/^#menu/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); }
  const done = () => {
    if (!menuClosing) return;
    menuClosing = false;
    el.hidden = true; lock('menu', false); setInert([...pageParts(), $('#drawer')], false);
    if (!heroStarted) startHero(); else if (stageOn) heroApi && heroApi.resume();
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  };
  if (reduce) return done();
  gsap.to(el, { clipPath: `circle(0px at 40px 40px)`, duration: 0.6, ease: 'power3.in', onComplete: () => { gsap.set(el, { clearProps: 'clipPath' }); done(); } });
}
$('#menuClose').addEventListener('click', () => closeMenu());

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-open-menu]');
  if (a) { e.preventDefault(); closeDrawer(); openMenu(a.dataset.openMenu, { x: e.clientX, y: e.clientY }, true); return; }
  const link = e.target.closest('a[href^="#"]');
  if (link && link.getAttribute('href').length > 1) {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { e.preventDefault(); closeDrawer(); lenis ? lenis.scrollTo(target, { duration: 1.6 }) : target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  }
});
function routeHash() {
  const h = location.hash.replace('#', '');
  if (h === 'menu' || h.startsWith('menu-')) openMenu(h.split('-')[1] || 'food');
  else if (!$('#menuApp').hidden) { menuPushed = false; closeMenu(true); }
}
window.addEventListener('hashchange', routeHash);
window.addEventListener('popstate', routeHash);

/* Dish sheet with drag-to-dismiss */
let sheetDish = null, sheetOpener = null;
function fillSheet(d) {
  $('#sheetMedia').innerHTML = photoOrPh(d);
  $('#sheetName').textContent = L(d.name);
  $('#sheetPrice').textContent = d.price + ' ₾';
  $('#sheetDesc').textContent = L(d.desc);
}
function openDishSheet(d) {
  if (!d) return;
  sheetDish = d; sheetOpener = document.activeElement;
  fillSheet(d);
  const sh = $('#sheet');
  gsap.killTweensOf(['#sheetCard', '.sheet__scrim']);
  const inMenu = !$('#menuApp').hidden;
  if (inMenu) $('#menuApp').appendChild(sh); else document.body.appendChild(sh);
  sh.hidden = false;
  lock('sheet', true);
  setInert(inMenu ? menuParts() : [...pageParts(), $('#drawer')], true);
  gsap.fromTo('#sheetCard', { yPercent: 100, y: 0 }, { yPercent: 0, duration: reduce ? 0 : 0.55, ease: 'power3.out' });
  gsap.fromTo('.sheet__scrim', { opacity: 0 }, { opacity: 1, duration: 0.4 });
  $('.sheet__close').focus({ preventScroll: true });
}
function closeSheet() {
  const sh = $('#sheet'); if (sh.hidden) return;
  const inMenu = !!sh.closest('#menuApp');
  gsap.to('#sheetCard', { yPercent: 100, y: 0, duration: reduce ? 0 : 0.4, ease: 'power3.in', onComplete: () => {
    sh.hidden = true; sheetDish = null; gsap.set('#sheetCard', { clearProps: 'all' });
    lock('sheet', false);
    setInert(inMenu ? menuParts() : pageParts(), false);
    if (!$('#menuApp').hidden) setInert([...pageParts(), $('#drawer')], true);
    sheetOpener && sheetOpener.focus && sheetOpener.focus({ preventScroll: true });
  } });
  gsap.to('.sheet__scrim', { opacity: 0, duration: 0.3 });
}
$('#sheet').addEventListener('click', (e) => { if (e.target.closest('[data-close-sheet]')) closeSheet(); });
(() => {
  // Drag starts on the photo or the grab bar (touch-action:none there), so the text can still scroll.
  const card = $('#sheetCard'); let y0 = null, ts = 0, dy = 0, pid = null;
  const reset = () => { y0 = null; pid = null; };
  card.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.sheet__media, .sheet__grab') || card.scrollTop > 0) return;
    y0 = e.clientY; ts = performance.now(); dy = 0; pid = e.pointerId;
    try { card.setPointerCapture(pid); } catch (err) { /* capture optional */ }
  });
  card.addEventListener('pointermove', (e) => { if (y0 == null || e.pointerId !== pid) return; dy = Math.max(0, e.clientY - y0); gsap.set(card, { y: dy }); });
  card.addEventListener('pointerup', () => {
    if (y0 == null) return; const v = dy / Math.max(1, performance.now() - ts); reset();
    if (dy > 120 || (v > 0.6 && dy > 30)) closeSheet(); else gsap.to(card, { y: 0, duration: 0.4, ease: 'back.out(1.6)' });
  });
  card.addEventListener('pointercancel', () => { if (y0 == null) return; reset(); gsap.to(card, { y: 0, duration: 0.3 }); });
})();
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#sheet').hidden) closeSheet(); else if (!$('#menuApp').hidden) closeMenu(); else closeDrawer();
});

/* ============================== nav / drawer ============================== */
const burger = $('#burger'), drawer = $('#drawer');
function closeDrawer() {
  if (drawer.hidden) return;
  burger.setAttribute('aria-expanded', 'false');
  gsap.to(drawer, { opacity: 0, duration: 0.3, onComplete: () => { drawer.hidden = true; gsap.set(drawer, { clearProps: 'opacity' }); } });
  lock('drawer', false); setInert([$('main'), $('.footer')], false);
}
burger.addEventListener('click', () => {
  if (!drawer.hidden) return closeDrawer();
  gsap.killTweensOf(drawer);
  drawer.hidden = false; burger.setAttribute('aria-expanded', 'true'); lock('drawer', true); setInert([$('main'), $('.footer')], true);
  gsap.fromTo(drawer, { opacity: 0 }, { opacity: 1, duration: 0.35 });
  gsap.from('.drawer__links a', { yPercent: 60, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out', clearProps: 'all' });
});

$('#soundBtn').addEventListener('click', async () => {
  const on = await window.SasperiaAudio.toggle();
  $('#soundBtn').setAttribute('aria-pressed', String(!!on));
});

/* ============================== smooth scroll ============================== */
let lenis = null;
if (!reduce && !CAPTURE && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ============================== 3D hero ============================== */
let heroApi = null, heroStarted = false, stageOn = true;
async function startHero() {
  if (heroStarted) return; heroStarted = true;
  try {
    const { initHero } = await import('./hero3d.js');
    heroApi = await initHero($('#heroCanvas'), { emblemUrl: 'assets/img/emblem.svg', quality: QUALITY });
    heroApi.setProgress(heroProgress);
    heroApi.setIntro(reduce ? 1 : intro.v);
    window.__hero = heroApi;
  } catch (err) {
    console.warn('WebGL hero unavailable:', err);
    document.documentElement.classList.add('no-webgl');
  }
}

/* ============================== scroll scenes ============================== */
let heroProgress = 0;
const intro = { v: 0 };

function splitHeroLetters() {
  const el = $('.hero__letters');
  el.innerHTML = el.textContent.split('').map((c) => `<span class="ch">${c}</span>`).join('');
}

function storyWordTriggers() {
  ScrollTrigger.getAll().filter((s) => s.vars.id && s.vars.id.startsWith('para-')).forEach((s) => s.kill());
  if (reduce) return;
  $$('#storyParas p').forEach((p, i) => {
    const words = $$('.w', p);
    const paint = (st) => { const n = Math.round(st.progress * words.length); words.forEach((w, k) => w.classList.toggle('on', k < n)); };
    const st = ScrollTrigger.create({ id: 'para-' + i, trigger: p, start: 'top 82%', end: 'bottom 48%', scrub: true, onUpdate: paint });
    paint(st);
  });
}

function scenes() {
  const mm = gsap.matchMedia();

  /* Nav state */
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      const y = s.scroll();
      $('#nav').classList.toggle('is-scrolled', y > 40);
      $('#nav').classList.toggle('is-hidden', y > innerHeight * 1.2 && y > lastY + 2 && $('#drawer').hidden);
      if (y < lastY - 2) $('#nav').classList.remove('is-hidden');
      lastY = y;
    },
  });

  /* Velocity: skew headings, push the dust, steer the marquee */
  const skews = $$('[data-skew]').map((el) => gsap.quickTo(el, 'skewY', { duration: 0.6, ease: 'power3.out' }));
  let vel = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      vel = s.getVelocity();
      const sk = reduce ? 0 : clamp(vel / -380, -5, 5);
      skews.forEach((q) => q(sk));
      heroApi && heroApi.setVelocity(clamp(vel / 1500, -2, 2));
    },
  });

  /* Hero → story: drives the 3D camera */
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', endTrigger: '#story', end: 'bottom bottom', scrub: true,
    onUpdate: (s) => { heroProgress = s.progress; heroApi && heroApi.setProgress(s.progress); },
  });
  if (!reduce) {
    gsap.to('.hero__inner', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 25%', scrub: true } });
    gsap.to('.hero__letters .ch', {
      yPercent: (i) => -40 - (i % 3) * 25, rotateX: 50, opacity: 0, stagger: 0.02, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: '10% top', end: 'bottom top', scrub: true },
    });
  }

  /* Stage off after the story (saves battery) */
  ScrollTrigger.create({
    trigger: '#specials', start: 'top 60%',
    onEnter: () => { stageOn = false; gsap.to('#stage', { opacity: 0, duration: 0.8, onComplete: () => heroApi && !stageOn && heroApi.pause() }); },
    onLeaveBack: () => { stageOn = true; heroApi && heroApi.resume(); gsap.to('#stage', { opacity: 1, duration: 0.6 }); },
  });

  /* Rivers draw and meet */
  const rA = $('#riverA'), rB = $('#riverB'), rC = $('#riverC');
  [rA, rB, rC].forEach((p) => { const l = pathLen(p); p.style.strokeDasharray = l; p.style.strokeDashoffset = reduce ? 0 : l; p.dataset.len = l; });
  if (!reduce) {
    let met = false;
    ScrollTrigger.create({
      trigger: '#story', start: 'top 70%', end: 'bottom bottom', scrub: true,
      onUpdate: (s) => {
        const p = s.progress;
        const a = smooth(0, 0.45, p), c = smooth(0.42, 0.95, p);
        rA.style.strokeDashoffset = rA.dataset.len * (1 - a);
        rB.style.strokeDashoffset = rB.dataset.len * (1 - a);
        rC.style.strokeDashoffset = rC.dataset.len * (1 - c);
        gsap.set('.confluence', { scale: smooth(0.4, 0.47, p) * (1 + 0.3 * Math.sin(p * 40)), transformOrigin: '50% 50%' });
        gsap.set('.river__label', { opacity: smooth(0.1, 0.3, p) * (1 - smooth(0.85, 1, p)) });
        if (p > 0.44 && !met) { met = true; window.SasperiaAudio.pluck(0); }
        if (p < 0.4) met = false;
      },
    });
  }

  /* Specials: horizontal track pinned to vertical scroll, cards turn as they pass the centre */
  if (!reduce) {
    const track = $('#specialsTrack');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    ScrollTrigger.create({
      trigger: '#specials', pin: '.specials__pin', start: 'top top', end: () => '+=' + (dist() + innerHeight * 0.4),
      scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
      onEnter: () => window.SasperiaAudio.pluck(2),
      onUpdate: (s) => {
        const p = smooth(0.04, 0.92, s.progress);
        gsap.set(track, { x: -p * dist() });
        $('#specialsBar').style.transform = `scaleX(${s.progress})`;
        const mid = innerWidth / 2;
        $$('.dish-card', track).forEach((card) => {
          const r = card.getBoundingClientRect();
          const d = clamp((r.left + r.width / 2 - mid) / innerWidth, -1.2, 1.2);
          gsap.set(card, { rotateY: d * -32, z: -Math.abs(d) * 160, rotateZ: d * 2 });
          const img = card.querySelector('img'); img && gsap.set(img, { xPercent: d * -10 });
        });
      },
    });
  }

  /* QR: phone turns toward the guest */
  if (!reduce) {
    gsap.fromTo('#phone', { rotateY: -38, rotateX: 16, rotateZ: -8, y: 90 }, {
      rotateY: 16, rotateX: -6, rotateZ: 2, y: -40, ease: 'none',
      scrollTrigger: { trigger: '#qrmenu', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo('#qrCard', { y: 140, rotate: -16 }, { y: -30, rotate: -4, ease: 'none', scrollTrigger: { trigger: '#qrmenu', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* Bar: deck of cocktail photos fans out */
  const deckImgs = $$('#deck img');
  const nC = deckImgs.length, cIdx = (nC - 1) / 2;
  const layDeck = (p) => {
    const spread = smooth(0.12, 0.55, p);
    const wide = innerWidth > 900 ? 1 : 0.34;
    deckImgs.forEach((img, i) => {
      const k = i - cIdx;
      gsap.set(img, {
        xPercent: -50 + k * 26 * spread * wide, yPercent: -50 + Math.abs(k) * 6 * spread,
        rotate: k * 7 * spread, rotateY: k * -10 * spread, z: -Math.abs(k) * 60 * spread + i * 2,
        zIndex: i,
      });
    });
    gsap.set('#deck', { rotateX: 14 * (1 - spread) });
  };
  layDeck(reduce ? 0.6 : 0);
  if (!reduce) ScrollTrigger.create({ trigger: '#deck', start: 'top 85%', end: 'bottom 30%', scrub: 0.5, onUpdate: (s) => layDeck(s.progress), onEnter: () => window.SasperiaAudio.pluck(3) });

  /* Wine bottle */
  wineTrigger = ScrollTrigger.create({
    trigger: '.wine__grid', start: 'top 70%', end: 'bottom 30%', scrub: true,
    onUpdate: (s) => { bottleApi && bottleApi.setProgress(s.progress); const i = Math.min(3, Math.floor(s.progress * 4)); setActiveWine(i); },
  });

  /* Grape marquee follows scroll direction */
  if (!reduce) {
    const row = $('#grapes'); let x = 0, dir = -1;
    gsap.ticker.add(window.__marqueeStep = () => {
      if (Math.abs(vel) > 30) dir = vel > 0 ? -1 : 1;
      x += dir * (0.6 + Math.min(6, Math.abs(vel) / 400));
      const w = row.scrollWidth / 2 || 1;
      if (x < -w) x += w; if (x > 0) x -= w;
      row.style.transform = `translate3d(${x}px,0,0)`;
    });
  }

  /* Spaces: photo ring */
  const ring = $('#ring'), ringImgs = $$('img', ring);
  let ringA = 0;
  const ringTilt = () => `translateZ(${-ring.dataset.r}px) rotateX(-7deg) rotateY(${ringA}deg)`;
  const layRing = () => {
    const cw = clamp(innerWidth * 0.3, 140, 250);
    ring.style.setProperty('--card-w', cw + 'px');
    const R = (cw * 1.12 * ringImgs.length) / (2 * Math.PI);
    ringImgs.forEach((img, i) => { img.style.transform = `rotateY(${(i * 360) / ringImgs.length}deg) translateZ(${R}px)`; });
    ring.dataset.r = R;
    ring.style.transform = ringTilt();
  };
  layRing();
  window.addEventListener('resize', layRing);
  if (!reduce) {
    ScrollTrigger.create({
      trigger: '#spaces', start: 'top bottom', end: 'bottom top', scrub: 0.8,
      onEnter: () => window.SasperiaAudio.pluck(5),
      onUpdate: (s) => { ringA = -s.progress * 220; ring.style.transform = ringTilt(); },
    });
  }

  /* Route: dotted path draws, pins pop */
  const route = $('#mapRoute'), walk = $('#mapWalk');
  const svg = $('#map svg');
  const ns = 'http://www.w3.org/2000/svg';
  const defs = svg.querySelector('defs');
  const masks = [route, walk].map((p, i) => {
    const m = document.createElementNS(ns, 'mask'); m.id = 'mRoute' + i;
    const mp = document.createElementNS(ns, 'path'); mp.setAttribute('d', p.getAttribute('d'));
    mp.setAttribute('stroke', '#fff'); mp.setAttribute('stroke-width', '14'); mp.setAttribute('fill', 'none'); mp.setAttribute('stroke-linecap', 'round');
    const len = pathLen(p); mp.style.strokeDasharray = len; mp.style.strokeDashoffset = reduce ? 0 : len;
    m.appendChild(mp); defs.appendChild(m); p.setAttribute('mask', `url(#${m.id})`); return { mp, len };
  });
  if (!reduce) {
    const pins = $$('.map__pin, .map__boat, .map__home, .map__min, .map__church');
    gsap.set(pins, { scale: 0, transformOrigin: 'center', transformBox: 'fill-box' });
    ScrollTrigger.create({
      trigger: '#map', start: 'top 80%', end: 'bottom 45%', scrub: true,
      onUpdate: (s) => {
        const p = s.progress;
        masks[0].mp.style.strokeDashoffset = masks[0].len * (1 - smooth(0.05, 0.55, p));
        masks[1].mp.style.strokeDashoffset = masks[1].len * (1 - smooth(0.55, 0.95, p));
        const at = [0.02, 0.3, 0.55, 0.78, 0.95];
        pins.forEach((el, i) => gsap.set(el, { scale: smooth(at[i], at[i] + 0.08, p) }));
      },
    });
    gsap.to('.route__bg img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '#route', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* Generic reveals */
  if (!reduce) {
    $$('.section-head, .qr__copy > *, .bar__copy > *, .wine__copy > *, .route__copy > *, .reserve__head > *, .art > *, .areas li, .footer__grid > *').forEach((el) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    gsap.from('.footer__mark img', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 30%', scrub: true } });
  }

  /* Pointer: hero parallax, magnetic buttons, phone tilt */
  mm.add('(pointer: fine)', () => {
    const onMove = (e) => {
      const nx = (e.clientX / innerWidth) * 2 - 1, ny = (e.clientY / innerHeight) * 2 - 1;
      heroApi && heroApi.setPointer(nx, ny);
    };
    window.addEventListener('pointermove', onMove);
    $$('.magnetic').forEach((b) => {
      const qx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3.out' }), qy = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3.out' });
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.25); qy((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
    return () => window.removeEventListener('pointermove', onMove);
  });
  if (coarse && 'DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      heroApi && heroApi.setPointer(clamp(e.gamma / 30, -1, 1), clamp((e.beta - 45) / 30, -1, 1));
    });
  }
}

/* Wine list state */
let activeWine = 0, wineTrigger = null, bottleApi = null;
function setActiveWine(i, force) {
  if (i === activeWine && !force) return;
  activeWine = i;
  $$('#wineList li').forEach((li, k) => li.classList.toggle('on', k === i));
  if (!force) window.SasperiaAudio.pluck(i + 1);
}
function scrollToWine(i) {
  if (!wineTrigger) return;
  const y = wineTrigger.start + ((i + 0.5) / 4) * (wineTrigger.end - wineTrigger.start);
  lenis ? lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: 'smooth' });
}
async function startBottle() {
  try {
    const { initBottle } = await import('./bottle3d.js');
    bottleApi = await initBottle($('#bottleCanvas'), { emblemUrl: 'assets/img/emblem.svg', patternUrl: 'assets/img/pattern.webp', quality: QUALITY });
    bottleApi.setWines(sasperiaWines());
    if (wineTrigger) bottleApi.setProgress(wineTrigger.progress);
    window.__bottle = bottleApi;
    new IntersectionObserver(([en]) => bottleApi.setVisible(en.isIntersecting), { rootMargin: '100px' }).observe($('#bottleCanvas'));
  } catch (err) {
    console.warn('Bottle 3D unavailable:', err);
    document.documentElement.classList.add('no-webgl');
  }
}

/* ============================== preloader + boot ============================== */
async function boot() {
  splitHeroLetters();
  applyI18n();
  const menuFirst = /^#menu/.test(location.hash);

  // Loader: the ring and figures of the emblem draw like a river line, then fill with gold.
  const paths = $$('#loaderEmblem path');
  paths.forEach((p) => { const l = pathLen(p); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
  const tl = gsap.timeline();
  if (!menuFirst && !reduce && !CAPTURE) {
    tl.to(paths, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', stagger: { each: 0.025, from: 'random' } })
      .to(paths, { fill: '#d5b784', strokeOpacity: 0, duration: 0.6, ease: 'power1.out' }, '-=0.35');
  }
  gsap.to('#loaderBar', { scaleX: 0.7, duration: 1.6, ease: 'power2.out' });

  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    menuFirst ? Promise.resolve() : startHero(),
  ]);
  const maxWait = new Promise((r) => setTimeout(r, 6000));
  await Promise.race([Promise.all([ready, tl.then ? tl.then() : null]), maxWait]);
  gsap.to('#loaderBar', { scaleX: 1, duration: 0.3 });

  scenes();
  ScrollTrigger.refresh();
  if (menuFirst) routeHash();

  // Exit: emblem grows and dissolves into the 3D emblem behind it.
  gsap.timeline({ onComplete: () => { $('#loader').remove(); document.body.classList.remove('is-loading'); } })
    .to('#loaderEmblem', { scale: 1.6, opacity: 0, duration: menuFirst ? 0.3 : 1.1, ease: 'power3.in' })
    .to('#loader', { opacity: 0, duration: 0.6 }, '-=0.5');

  if (!CAPTURE) playIntro(menuFirst);

  // Bottle when the wine chapter gets near
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); startBottle(); } }, { rootMargin: '600px' });
  io.observe($('#wine'));

  if (document.readyState === 'complete') ScrollTrigger.refresh(); else window.addEventListener('load', () => ScrollTrigger.refresh());
}

function playIntro(menuFirst) {
  if (!reduce && !menuFirst) {
    gsap.to(intro, { v: 1, duration: 3.2, ease: 'power2.out', delay: 0.4, onUpdate: () => heroApi && heroApi.setIntro(intro.v) });
    gsap.timeline({ delay: 0.75 })
      .from('.hero__letters .ch', { yPercent: 115, rotateX: -80, opacity: 0, duration: 1.4, stagger: 0.07, ease: 'expo.out', transformOrigin: '50% 100%' })
      .from('.hero__eyebrow', { y: 20, opacity: 0, duration: 0.9, ease: 'power3.out' }, 0.2)
      .from('.hero__wordmark', { clipPath: 'inset(0 100% 0 0)', duration: 1.4, ease: 'power3.inOut' }, 0.6)
      .from('.hero__tagline, .hero__meta, .hero__cta > *, .hero__welcome', { y: 24, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out' }, 0.9)
      .from('.nav', { opacity: 0, duration: 1.2, ease: 'power2.out', clearProps: 'opacity,transform' }, 0.5);
  } else {
    intro.v = 1; heroApi && heroApi.setIntro(1);
  }
}

/* ============================== video capture hooks ============================== */
// Used only by tools/capture.js to render a deterministic promo video.
let capBase = 0, capAnims = [];
window.__capture = {
  async ready() { await startHero(); await startBottle(); return true; },
  begin() {
    // Only the capture clock may move the timeline: detach the root update from the ticker
    // (ScrollTrigger wakes the ticker, which would otherwise advance it in real time).
    gsap.ticker.remove(gsap.updateRoot);
    gsap.ticker.sleep();
    capBase = gsap.ticker.time;
    capAnims = document.getAnimations();
    capAnims.forEach((an) => an.pause());
    playIntro(false);
  },
  frame(time, y) {
    window.scrollTo(0, y);
    ScrollTrigger.update();
    gsap.updateRoot(capBase + time);
    window.__marqueeStep && window.__marqueeStep();
    document.getAnimations().forEach((an) => { if (!capAnims.includes(an)) { an.pause(); capAnims.push(an); } an.currentTime = time * 1000; });
    if (heroApi && stageOn) heroApi.renderAt(time);
    if (bottleApi) bottleApi.renderAt(time);
  },
  openMenu() { openMenu('food', { x: innerWidth / 2, y: innerHeight * 0.8 }); },
  menuScroll(y) { $('#menuBody').scrollTop = y; },
  plucks: [],
};
const _pluck = window.SasperiaAudio.pluck;
window.SasperiaAudio.pluck = (i) => { if (CAPTURE) window.__capture.plucks.push({ i, y: scrollY }); else _pluck(i); };

boot();
