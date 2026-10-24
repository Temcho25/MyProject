// 04 — Apartments: type tabs + area slider drive a morphing typology scheme.
// Walls move (rect geometry), never the whole picture, so line weight stays constant.
import { svgRoot, s } from './svg.js';
import { tween, motion } from './motion.js';
import { apartments } from './data.js';
import { pick, t, onLang, fmt } from './i18n.js';

const VB_W = 400;
const VB_H = 344;
const ROOMS = ['living', 'bed1', 'bed2', 'bed3', 'bath', 'hall'];
// Schematic room layouts as fractions of the outer box: [x, y, w, h].
const LAYOUT = {
  r1: { living: [0, 0, 1, 0.66], bed1: [1, 0, 0, 0.66], bed2: [1, 0.66, 0, 0.34], bed3: [1, 0.66, 0, 0.34], bath: [0, 0.66, 0.42, 0.34], hall: [0.42, 0.66, 0.58, 0.34] },
  r2: { living: [0, 0, 0.58, 0.62], bed1: [0.58, 0, 0.42, 0.62], bed2: [1, 0.62, 0, 0.38], bed3: [1, 0.62, 0, 0.38], bath: [0, 0.62, 0.32, 0.38], hall: [0.32, 0.62, 0.68, 0.38] },
  r3: { living: [0, 0, 0.46, 0.58], bed1: [0.46, 0, 0.54, 0.58], bed2: [0.62, 0.58, 0.38, 0.42], bed3: [1, 0.58, 0, 0.42], bath: [0, 0.58, 0.26, 0.42], hall: [0.26, 0.58, 0.36, 0.42] },
  r4: { living: [0, 0, 0.44, 0.56], bed1: [0.44, 0, 0.28, 0.56], bed2: [0.72, 0, 0.28, 0.56], bed3: [0.62, 0.56, 0.38, 0.44], bath: [0, 0.56, 0.26, 0.44], hall: [0.26, 0.56, 0.36, 0.44] },
};
const ROOM_CLASS = { bath: 'plan-room plan-room--wet', hall: 'plan-room plan-room--hall' };

// Outer box scales with the type's mid area so size differences read honestly.
function outer(apt) {
  const mid = (apt.min + apt.max) / 2;
  const w = Math.sqrt(mid / 147) * 300;
  const h = w / 1.25;
  return { x: (VB_W - w) / 2, y: (VB_H - h) / 2 - 12, w, h };
}
function geometry(apt) {
  const o = outer(apt);
  const rooms = {};
  ROOMS.forEach((k) => {
    const [x, y, w, h] = LAYOUT[apt.id][k];
    rooms[k] = { x: o.x + x * o.w, y: o.y + y * o.h, w: w * o.w, h: h * o.h };
  });
  return { o, rooms };
}
const mix = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k });

export function initApartments({ onAsk }) {
  const tabs = document.querySelector('[data-apt-tabs]');
  const detail = document.querySelector('[data-apt-detail]');
  const stage = document.querySelector('[data-plan-stage]');
  const slider = document.querySelector('[data-area-input]');
  const out = document.querySelector('[data-area-out]');
  const chart = document.querySelector('[data-compare]');

  let current = apartments[1];
  let geo = geometry(current);
  let anim = null;
  let matchState = 'in';

  // --- Plan SVG ---
  const svg = svgRoot(`0 0 ${VB_W} ${VB_H}`, { preserveAspectRatio: 'xMidYMid meet' });
  const roomEls = {};
  const labelEls = {};
  ROOMS.forEach((k) => {
    roomEls[k] = s('rect', { class: ROOM_CLASS[k] || 'plan-room' });
    svg.appendChild(roomEls[k]);
  });
  const wall = s('rect', { class: 'plan-wall' });
  svg.appendChild(wall);
  ROOMS.forEach((k) => { labelEls[k] = s('text', { class: 'plan-label' }); svg.appendChild(labelEls[k]); });
  const dim = s('path', { class: 'plan-dim' });
  const dimText = s('text', { class: 'plan-dimtext' });
  svg.append(dim, dimText);
  stage.appendChild(svg);
  const img = document.createElement('img');
  img.loading = 'lazy';

  const labelFor = (k) => ({ living: t('living'), bed1: t('bedroom'), bed2: t('bedroom'), bed3: t('bedroom'), bath: t('bath'), hall: t('hall') }[k]);

  function paint(g) {
    ROOMS.forEach((k) => {
      const r = g.rooms[k];
      const el = roomEls[k];
      el.setAttribute('x', r.x.toFixed(2)); el.setAttribute('y', r.y.toFixed(2));
      el.setAttribute('width', Math.max(0, r.w).toFixed(2)); el.setAttribute('height', Math.max(0, r.h).toFixed(2));
      el.style.opacity = r.w < 1 ? 0 : 1;
      const L = labelEls[k];
      L.setAttribute('x', (r.x + r.w / 2).toFixed(1)); L.setAttribute('y', (r.y + r.h / 2).toFixed(1));
      L.textContent = labelFor(k);
      L.style.opacity = r.w > 52 && r.h > 30 ? 1 : 0;
    });
    const o = g.o;
    wall.setAttribute('x', o.x.toFixed(2)); wall.setAttribute('y', o.y.toFixed(2));
    wall.setAttribute('width', o.w.toFixed(2)); wall.setAttribute('height', o.h.toFixed(2));
    const dy = o.y + o.h + 22;
    dim.setAttribute('d', `M${o.x} ${dy - 6} V${dy + 6} M${o.x} ${dy} H${o.x + o.w} M${o.x + o.w} ${dy - 6} V${dy + 6}`);
    dimText.setAttribute('x', (o.x + o.w / 2).toFixed(1));
    dimText.setAttribute('y', (dy + 20).toFixed(1));
  }

  function setPlan(apt) {
    if (apt.plan) {
      img.src = apt.plan;
      img.alt = `${t('planOfficial')}: ${pick(apt.name)}`;
      svg.style.display = 'none';
      if (!img.isConnected) stage.appendChild(img);
      return;
    }
    img.remove();
    svg.style.display = '';
    const from = geo;
    const to = geometry(apt);
    anim?.stop();
    anim = tween(motion.reduced ? 0 : 720, (k) => {
      const g = { o: mix(from.o, to.o, k), rooms: {} };
      ROOMS.forEach((r) => { g.rooms[r] = mix(from.rooms[r], to.rooms[r], k); });
      geo = g;
      paint(g);
    });
    dimText.textContent = t('range')(apt.min, apt.max);
  }

  function renderTabs() {
    tabs.innerHTML = '';
    apartments.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'apt-tab';
      b.role = 'tab';
      b.id = `tab-${a.id}`;
      b.dataset.id = a.id;
      b.setAttribute('aria-selected', String(a === current));
      b.tabIndex = a === current ? 0 : -1;
      b.innerHTML = `<span class="apt-tab__name">${pick(a.name)}</span><span class="apt-tab__area">${t('range')(a.min, a.max)}</span><span class="apt-tab__check" aria-hidden="true">◆</span>`;
      b.addEventListener('click', () => { select(a, { fromTab: true }); });
      tabs.appendChild(b);
    });
    stage.setAttribute('aria-labelledby', `tab-${current.id}`);
  }
  tabs.addEventListener('keydown', (e) => {
    const i = apartments.indexOf(current);
    let n = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % apartments.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + apartments.length) % apartments.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = apartments.length - 1;
    if (n == null) return;
    e.preventDefault();
    select(apartments[n], { fromTab: true });
    tabs.querySelector(`[data-id="${apartments[n].id}"]`).focus();
  });

  function renderDetail(animate = true) {
    const a = current;
    const msg = matchState === 'in' ? t('matchIn') : matchState === 'near' ? t('matchNear') : '';
    detail.innerHTML = `
      <p class="apt-detail__name">${pick(a.name)}</p>
      <p class="apt-detail__area">${a.min === a.max ? fmt(a.min) : `${fmt(a.min)}–${fmt(a.max)}`}<small>${t('sqm')}</small></p>
      <p class="apt-detail__rooms">${pick(a.rooms)}</p>
      <p class="apt-detail__match ${matchState === 'near' ? 'apt-detail__match--no' : ''}">${msg}</p>
      <button type="button" class="btn btn--dark" data-ask>${t('askType')}<span class="btn__arrow" aria-hidden="true">→</span></button>`;
    if (animate && !motion.reduced) { detail.classList.remove('swap-in'); void detail.offsetWidth; detail.classList.add('swap-in'); }
    detail.querySelector('[data-ask]').addEventListener('click', () => onAsk(a));
  }

  // --- Comparison chart ---
  const MAXA = 150;
  let marker;
  function renderChart() {
    chart.innerHTML = '';
    apartments.forEach((a, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cbar';
      b.dataset.id = a.id;
      b.setAttribute('aria-pressed', String(a === current));
      const l = (a.min / MAXA) * 100;
      const w = Math.max(1.2, ((a.max - a.min) / MAXA) * 100);
      b.innerHTML = `<span class="cbar__name">${pick(a.name)}</span><span class="cbar__track"><span class="cbar__range" style="--l:${l}%;--w:${w}%;--i:${i}"></span><span class="cbar__val${l > 55 ? ' cbar__val--end' : ''}" style="--l:${l}%;--w:${w}%">${t('range')(a.min, a.max)}</span></span>`;
      b.addEventListener('click', () => select(a, { fromTab: true }));
      chart.appendChild(b);
    });
    const axis = document.createElement('div');
    axis.className = 'compare__axis';
    axis.setAttribute('aria-hidden', 'true');
    axis.innerHTML = '<span></span><div><span>0</span><span>50</span><span>100</span><span>150</span></div>';
    chart.appendChild(axis);
    marker = document.createElement('div');
    marker.className = 'compare__marker';
    marker.setAttribute('aria-hidden', 'true');
    chart.appendChild(marker);
    placeMarker();
  }
  function placeMarker() {
    const bar = chart.querySelector('.cbar__track');
    if (!bar || !marker) return;
    const v = Number(slider.value);
    const cr = chart.getBoundingClientRect();
    const br = bar.getBoundingClientRect();
    marker.style.setProperty('--m', `${br.left - cr.left + (v / MAXA) * br.width}px`);
    marker.innerHTML = `<span>${fmt(v)} ${t('sqm')}</span>`;
  }
  new ResizeObserver(placeMarker).observe(chart);

  function syncSliderUI() {
    const v = Number(slider.value);
    out.textContent = `${fmt(v)} ${t('sqm')}`;
    slider.style.setProperty('--fill', `${((v - slider.min) / (slider.max - slider.min)) * 100}%`);
    slider.setAttribute('aria-valuetext', `${fmt(v)} ${t('sqm')}`);
    placeMarker();
  }

  function matchFor(v) {
    const inside = apartments.find((a) => v >= Math.floor(a.min) && v <= Math.ceil(a.max));
    if (inside) return { apt: inside, state: 'in' };
    let best = apartments[0];
    let d = Infinity;
    apartments.forEach((a) => {
      const dist = v < a.min ? a.min - v : v - a.max;
      if (dist < d) { d = dist; best = a; }
    });
    return { apt: best, state: 'near' };
  }

  function select(apt, { fromTab = false } = {}) {
    if (fromTab) {
      slider.value = String(Math.round((apt.min + apt.max) / 2));
      matchState = 'in';
    }
    const changed = apt !== current;
    current = apt;
    syncSliderUI();
    tabs.querySelectorAll('.apt-tab').forEach((b) => { const on = b.dataset.id === apt.id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    chart.querySelectorAll('.cbar').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === apt.id)));
    stage.setAttribute('aria-labelledby', `tab-${apt.id}`);
    if (changed) setPlan(apt);
    renderDetail(changed || fromTab);
  }

  slider.addEventListener('input', () => {
    const { apt, state } = matchFor(Number(slider.value));
    const stateChanged = state !== matchState;
    matchState = state;
    if (apt !== current) select(apt);
    else { syncSliderUI(); if (stateChanged) renderDetail(false); }
  });

  renderTabs();
  renderChart();
  syncSliderUI();
  paint(geo);
  dimText.textContent = t('range')(current.min, current.max);
  renderDetail(false);

  onLang(() => { renderTabs(); renderChart(); syncSliderUI(); paint(geo); dimText.textContent = t('range')(current.min, current.max); renderDetail(false); });
}
