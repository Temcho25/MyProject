// 06 — The building in section. Each verified feature lights the part of the
// section drawing it refers to. Auto-advances only while visible and untouched.
import { svgRoot, s } from './svg.js';
import { features } from './data.js';
import { pick, t, onLang } from './i18n.js';
import { motion } from './motion.js';

const G = 330; // ground line
const FH = 30;
const X0 = 120;
const X1 = 420;
const TOP = G - 8 * FH;

const line = (d, cls = '', extra = {}) => s('path', { d, class: `d-line ${cls}`, ...extra });

function drawing() {
  const svg = svgRoot('0 0 620 420', { class: 'sx' });
  const base = s('g', { class: 'base' });
  // Ground, basement, building envelope, slabs.
  base.append(
    line(`M0 ${G} H620`, '', { stroke: 'var(--gold)', style: { color: 'var(--gold)' } }),
    line(`M${X0} ${G} V${G + 62} H${X1} V${G}`),
    line(`M${X0} ${G} V${TOP} H${X1} V${G}`),
  );
  for (let f = 1; f < 8; f++) base.appendChild(line(`M${X0} ${G - f * FH} H${X1}`, '', { 'stroke-width': 0.8 }));
  base.appendChild(line(`M${X0 - 6} ${TOP - 8} H${X1 + 6}`));
  // Partition hints.
  for (let f = 0; f < 8; f++) [195, 345].forEach((x) => base.appendChild(line(`M${x} ${G - f * FH} V${G - f * FH - FH + 6}`, '', { 'stroke-width': 0.5 })));
  // Shaft outline.
  base.appendChild(line(`M262 ${G + 62} V${TOP} M296 ${G + 62} V${TOP}`, '', { 'stroke-width': 0.6, 'stroke-dasharray': '3 3' }));
  svg.appendChild(base);

  // FRAME — columns and slabs in gold.
  const frame = s('g', { class: 'hl hl-frame gold' });
  [X0, 195, 270, 345, X1].forEach((x) => frame.appendChild(s('rect', { x: x - 3, y: TOP, width: 6, height: G - TOP + 62, fill: 'currentColor' })));
  for (let f = 0; f <= 8; f++) frame.appendChild(s('rect', { x: X0 - 6, y: G - f * FH - 2, width: X1 - X0 + 12, height: 4, fill: 'currentColor' }));
  svg.appendChild(frame);

  // CEILING — dimension on the 4th floor.
  const fy = G - 4 * FH;
  const ceil = s('g', { class: 'hl hl-ceiling gold' }, [
    s('g', { class: 'ceil-dim' }, [
      line(`M220 ${fy} V${fy + FH} M212 ${fy} H228 M212 ${fy + FH} H228`, '', { 'stroke-width': 1.5 }),
    ]),
    s('rect', { x: 196, y: fy + 2, width: 66, height: FH - 4, fill: 'currentColor', opacity: 0.12 }),
    s('text', { x: 234, y: fy + FH / 2 + 4, class: 'd-label d-label--gold', text: '2,90' }),
  ]);
  svg.appendChild(ceil);

  // ELEVATOR — shaft and moving car.
  const lift = s('g', { class: 'hl hl-elevator gold' }, [
    s('rect', { x: 262, y: TOP, width: 34, height: G - TOP + 62, fill: 'currentColor', opacity: 0.1 }),
    s('g', { class: 'lift-car', style: { '--lift': `${-(G + 40 - TOP - 30)}px` } }, [
      s('rect', { x: 266, y: G + 30, width: 26, height: 26, fill: 'currentColor' }),
    ]),
    s('text', { x: 279, y: TOP - 16, 'text-anchor': 'middle', class: 'd-label d-label--gold', 'data-l': 'lift' }),
  ]);
  svg.appendChild(lift);

  // PARKING — basement and surface spaces.
  const park = s('g', { class: 'hl hl-parking gold' });
  park.appendChild(s('rect', { x: X0 + 2, y: G + 2, width: X1 - X0 - 4, height: 58, fill: 'currentColor', opacity: 0.12 }));
  [140, 186, 312, 358].forEach((x) => park.appendChild(s('rect', { x, y: G + 30, width: 36, height: 18, rx: 4, fill: 'currentColor' })));
  [30, 72].forEach((x) => park.appendChild(s('rect', { x, y: G - 18, width: 36, height: 16, rx: 4, fill: 'currentColor' })));
  park.appendChild(s('text', { x: X0 + 8, y: G + 18, class: 'd-label d-label--gold', 'data-l': 'parking' }));
  svg.appendChild(park);

  // CCTV — cameras with sweeping cones.
  const cctv = s('g', { class: 'hl hl-cctv gold' });
  [[X0, G - 34, -1], [X1, G - 34, 1]].forEach(([x, y, dir]) => {
    cctv.appendChild(s('rect', { x: x + (dir > 0 ? 0 : -10), y: y - 4, width: 10, height: 7, fill: 'currentColor' }));
    cctv.appendChild(s('path', { d: `M${x + dir * 8} ${y} L${x + dir * 80} ${G} L${x + dir * 30} ${G} Z`, fill: 'currentColor', opacity: 0.18, class: 'cctv-cone', style: { '--ox': `${x}px`, '--oy': `${y}px` } }));
  });
  svg.appendChild(cctv);

  // YARD — trees and playground to the right.
  const yard = s('g', { class: 'hl hl-yard fresh' });
  [[470, 18], [585, 14]].forEach(([x, r]) => yard.append(s('circle', { cx: x, cy: G - 26 - r, r, fill: 'currentColor', opacity: 0.5 }), line(`M${x} ${G} V${G - 26}`)));
  yard.appendChild(line(`M505 ${G} L520 ${G - 40} L535 ${G} M520 ${G - 40} H560 M545 ${G} L560 ${G - 40} L575 ${G}`, '', { 'stroke-width': 1.5 }));
  yard.appendChild(line(`M532 ${G - 40} V${G - 14} M548 ${G - 40} V${G - 14} M528 ${G - 14} H552`, '', { 'stroke-width': 1.5 }));
  svg.appendChild(yard);

  // GREEN FRAME — one apartment shown with bare-wall hatching.
  const green = s('g', { class: 'hl hl-green fresh' });
  svg.appendChild(s('defs', {}, [
    s('pattern', { id: 'gfh', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, [s('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: '#75bd68', 'stroke-width': 1.2 })]),
  ]));
  green.appendChild(s('rect', { x: 296, y: G - 6 * FH + 2, width: 124, height: FH - 4, fill: 'url(#gfh)' }));
  green.appendChild(s('rect', { x: 296, y: G - 6 * FH + 2, width: 124, height: FH - 4, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' }));
  svg.appendChild(green);
  return svg;
}

export function initFeatures() {
  const list = document.querySelector('[data-feature-list]');
  const holder = document.querySelector('[data-section-svg]');
  const svg = drawing();
  holder.appendChild(svg);
  let active = features[0].id;
  let touched = false;
  let visible = false;

  const labels = () => { const L = t('labels'); svg.querySelectorAll('[data-l]').forEach((n) => { n.textContent = L[n.dataset.l]; }); };

  function render() {
    list.innerHTML = '';
    features.forEach((f, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<button type="button" class="feat" data-id="${f.id}" aria-pressed="${f.id === active}"><span class="feat__no">${String(i + 1).padStart(2, '0')}</span><span class="feat__t">${pick(f.t)}</span><span class="feat__d"><span>${pick(f.d)}</span></span></button>`;
      const btn = li.firstElementChild;
      btn.addEventListener('click', () => { touched = true; set(f.id); });
      btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { touched = true; set(f.id); } });
      btn.addEventListener('focus', () => { touched = true; set(f.id); });
      list.appendChild(li);
    });
    labels();
  }
  function set(id) {
    active = id;
    svg.dataset.active = id;
    list.querySelectorAll('.feat').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  }
  render();
  set(active);

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.4 }).observe(holder);
  if (!motion.reduced) {
    setInterval(() => {
      if (touched || !visible || document.hidden) return;
      const i = features.findIndex((f) => f.id === active);
      set(features[(i + 1) % features.length].id);
    }, 3200);
  }
  onLang(() => { render(); set(active); });
}
