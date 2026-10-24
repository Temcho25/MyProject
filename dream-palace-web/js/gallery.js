// 08 — Gallery filmstrip with type filters and an accessible lightbox.
// Today only schematic drawings exist; official media is added via data.js → media.
import { svgRoot, s, elevation, silhouette, drawPath } from './svg.js';
import { media } from './data.js';
import { pick, t, onLang } from './i18n.js';

function plateSvg(kind) {
  if (kind === 'elevation') {
    const svg = svgRoot('-80 -280 400 300');
    const { g } = elevation({ x: 20, animated: false, labels: t('labels') });
    svg.append(silhouette({ x: 160, w: 140, h: 180 }), g, drawPath('M-80 0 H320'));
    return svg;
  }
  if (kind === 'frame') {
    const svg = svgRoot('-20 -270 280 290');
    for (let i = 0; i <= 6; i++) svg.appendChild(s('rect', { x: i * 36 - 2, y: -248, width: 4, height: 248, fill: 'currentColor' }));
    for (let f = 1; f <= 8; f++) svg.appendChild(s('rect', { x: -6, y: -f * 31 - 3, width: 228, height: 6, fill: 'currentColor' }));
    svg.appendChild(drawPath('M-20 0 H260'));
    return svg;
  }
  if (kind === 'section') {
    return document.querySelector('[data-section-svg] svg').cloneNode(true);
  }
  if (kind === 'plan') {
    const n = document.querySelector('[data-plan-stage] svg').cloneNode(true);
    n.style.color = 'var(--white)';
    return n;
  }
  const n = document.querySelector('[data-blocks-svg] svg').cloneNode(true);
  return n;
}

// 01.11.2025 for Georgian and Russian, 1 Nov 2025 for English (never the ambiguous 11/1/2025).
function fmtDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  const lang = document.documentElement.lang;
  if (lang === 'en') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function initGallery() {
  const strip = document.querySelector('[data-filmstrip]');
  const filters = document.querySelector('[data-gallery-filters]');
  const note = document.querySelector('[data-gallery-note]');
  const lb = document.querySelector('[data-lightbox]');
  const lbFrame = lb.querySelector('[data-lb-frame]');
  const lbCap = lb.querySelector('[data-lb-cap]');
  let filter = 'all';
  let items = [];
  let shown = [];
  let lbIndex = 0;
  let lastFocus = null;

  const drawingKinds = ['elevation', 'frame', 'section', 'plan', 'blocks'];
  const typeLabel = (type) => t({ drawing: 'gTypeDrawing', photo: 'gTypePhoto', render: 'gTypeRender', progress: 'gTypeProgress', video: 'gTypeVideo' }[type]);

  function build() {
    items = [
      ...drawingKinds.map((k) => ({ type: 'drawing', kind: k, cap: () => t('plates')[k] })),
      ...media.map((m) => ({ ...m, cap: () => `${pick(m.alt)}${m.date ? ` · ${fmtDate(m.date)}` : ''}` })),
    ];
  }
  const count = (f) => (f === 'all' ? items.length : items.filter((i) => i.type === f || (f === 'photo' && i.type === 'video')).length);

  function renderFilters() {
    filters.innerHTML = '';
    [['all', 'gAll'], ['drawing', 'gDrawing'], ['photo', 'gPhoto'], ['render', 'gRender'], ['progress', 'gProgress']].forEach(([f, key]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('aria-pressed', String(f === filter));
      b.innerHTML = `${t(key)}<span class="chip__n">${count(f)}</span>`;
      b.addEventListener('click', () => { filter = f; renderFilters(); renderStrip(true); });
      filters.appendChild(b);
    });
  }

  function mediaNode(item, large = false) {
    if (item.type === 'drawing') return plateSvg(item.kind);
    if (item.type === 'video') {
      const v = document.createElement('video');
      v.src = item.src; v.poster = item.poster || ''; v.muted = true; v.playsInline = true; v.preload = 'none';
      if (large) v.controls = true;
      return v;
    }
    const img = document.createElement('img');
    img.src = item.src; img.alt = pick(item.alt); img.loading = 'lazy'; img.decoding = 'async';
    if (item.srcset) img.srcset = item.srcset;
    img.sizes = large ? '100vw' : '(max-width: 759px) 82vw, 36vw';
    return img;
  }

  function renderStrip(animate = false) {
    strip.innerHTML = '';
    shown = items.filter((i) => filter === 'all' || i.type === filter || (filter === 'photo' && i.type === 'video'));
    if (!shown.length) {
      const empty = document.createElement('div');
      empty.className = 'plate plate--empty';
      empty.innerHTML = `<div class="plate__media">${t('gEmpty')}</div>`;
      strip.appendChild(empty);
    }
    shown.forEach((item, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `plate${animate ? ' is-entering' : ''}`;
      b.style.setProperty('--i', i);
      const m = document.createElement('div');
      m.className = 'plate__media is-drawn';
      m.appendChild(mediaNode(item));
      b.appendChild(m);
      const cap = document.createElement('div');
      cap.className = 'plate__cap';
      cap.innerHTML = `<span>${item.cap()}</span><span class="plate__type">${typeLabel(item.type)}</span>`;
      b.appendChild(cap);
      b.setAttribute('aria-label', `${item.cap()} — ${typeLabel(item.type)}`);
      b.addEventListener('click', () => { if (!dragMoved) open(i); });
      strip.appendChild(b);
    });
    strip.scrollTo({ left: 0 });
    note.textContent = media.length ? '' : t('gNoteDrawings');
  }

  // Drag-to-scroll for mouse; touch uses native scrolling.
  let dragX = 0; let startLeft = 0; let dragging = false; let dragMoved = false;
  strip.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    dragging = true; dragMoved = false; dragX = e.clientX; startLeft = strip.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragX;
    if (Math.abs(dx) > 5) { dragMoved = true; strip.classList.add('is-dragging'); }
    if (dragMoved) strip.scrollLeft = startLeft - dx;
  });
  addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    strip.classList.remove('is-dragging');
    setTimeout(() => { dragMoved = false; }, 0);
  });
  const stepBy = (dir) => {
    const plate = strip.querySelector('.plate');
    strip.scrollBy({ left: dir * (plate ? plate.getBoundingClientRect().width + 20 : 300), behavior: 'smooth' });
  };
  document.querySelector('[data-strip-prev]').addEventListener('click', () => stepBy(-1));
  document.querySelector('[data-strip-next]').addEventListener('click', () => stepBy(1));
  strip.addEventListener('keydown', (e) => {
    if (e.target !== strip) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stepBy(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepBy(-1); }
  });

  // Lightbox.
  function show(i) {
    lbIndex = (i + shown.length) % shown.length;
    const item = shown[lbIndex];
    lbFrame.innerHTML = '';
    lbFrame.style.animation = 'none'; void lbFrame.offsetWidth; lbFrame.style.animation = '';
    lbFrame.classList.add('is-drawn');
    lbFrame.appendChild(mediaNode(item, true));
    lbCap.textContent = `${item.cap()} · ${typeLabel(item.type)} · ${t('lbOf')(lbIndex + 1, shown.length)}`;
    const multi = shown.length > 1;
    lb.querySelector('[data-lb-prev]').hidden = !multi;
    lb.querySelector('[data-lb-next]').hidden = !multi;
  }
  function open(i) {
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    show(i);
    lb.querySelector('[data-lb-close]').focus();
  }
  function close() {
    lb.hidden = true;
    lbFrame.innerHTML = '';
    document.documentElement.style.overflow = '';
    lastFocus?.focus();
  }
  lb.querySelector('[data-lb-close]').addEventListener('click', close);
  lb.querySelector('[data-lb-prev]').addEventListener('click', () => show(lbIndex - 1));
  lb.querySelector('[data-lb-next]').addEventListener('click', () => show(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target === lbFrame) close(); });
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(lbIndex + 1);
    if (e.key === 'ArrowLeft') show(lbIndex - 1);
    if (e.key === 'Tab') {
      const f = [...lb.querySelectorAll('button:not([hidden]), video[controls]')];
      const iFirst = f[0]; const iLast = f[f.length - 1];
      if (e.shiftKey && document.activeElement === iFirst) { e.preventDefault(); iLast.focus(); }
      else if (!e.shiftKey && document.activeElement === iLast) { e.preventDefault(); iFirst.focus(); }
    }
  });

  build();
  renderFilters();
  renderStrip();
  onLang(() => { build(); renderFilters(); renderStrip(); });
}
