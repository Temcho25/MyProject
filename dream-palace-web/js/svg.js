// Tiny SVG builders shared by every drawing.
export const NS = 'http://www.w3.org/2000/svg';

export function s(tag, attrs = {}, children = []) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) n.appendChild(c);
  return n;
}

/** A path that draws itself (pathLength=1 + dash animation). */
export const drawPath = (d, delay = 0, dur = 900, cls = '') =>
  s('path', { d, class: `d-line d-draw ${cls}`, pathLength: 1, style: { '--delay': `${delay}ms`, '--dur': `${dur}ms` } });

export const svgRoot = (viewBox, attrs = {}) =>
  s('svg', { viewBox, xmlns: NS, focusable: 'false', 'aria-hidden': 'true', ...attrs });

/** 8-floor schematic elevation. Origin = bottom-left of the facade on the datum line. */
export const ELEV = { bays: 6, bay: 36, floors: 8, fh: 30 };

export function elevation({ x = 0, y = 0, animated = true, windows = true, labels = null, t0 = 0 } = {}) {
  const { bays, bay, floors, fh } = ELEV;
  const W = bays * bay;
  const H = floors * fh;
  const g = s('g', { transform: `translate(${x} ${y})` });
  const d = (ms) => (animated ? t0 + ms : 0);

  // Columns: the monolithic frame rises first.
  for (let i = 0; i <= bays; i++) g.appendChild(drawPath(`M${i * bay} 0 V${-H - 8}`, d(300 + i * 60), 900, 'col'));
  // Slabs, bottom to top.
  for (let f = 1; f <= floors; f++) g.appendChild(drawPath(`M-6 ${-f * fh} H${W + 6}`, d(700 + f * 70), 700, 'slab'));
  g.appendChild(drawPath(`M-6 ${-H - 8} H${W + 6}`, d(1350), 600, 'parapet'));

  // Window grid (fades in once the frame stands).
  const wins = s('g', { class: 'windows' });
  const lit = s('g', { class: 'lit' });
  if (windows) {
    for (let f = 0; f < floors; f++) {
      for (let b = 0; b < bays; b++) {
        const wx = b * bay + 7;
        const wy = -(f + 1) * fh + 6;
        const r = { x: wx, y: wy, width: bay - 14, height: fh - 12 };
        wins.appendChild(s('rect', { ...r, class: 'd-line d-fade', style: { '--delay': `${d(1300 + (f * bays + b) * 14)}ms` }, 'stroke-width': 0.6 }));
        lit.appendChild(s('rect', { ...r, class: 'win', 'data-win': '' }));
      }
    }
    g.append(lit, wins);
  }

  if (labels) {
    const L = s('g', { class: 'labels' });
    // Ceiling dimension on floor 3 (schematic +2.90 m).
    const dx = W + 26;
    const yTop = -3 * fh;
    const yBot = -2 * fh;
    L.append(
      drawPath(`M${dx - 5} ${yBot} H${dx + 5} M${dx} ${yBot} V${yTop} M${dx - 5} ${yTop} H${dx + 5}`, d(1700), 600, 'gold'),
      s('text', { x: dx + 10, y: (yTop + yBot) / 2 + 3, class: 'd-label d-label--gold d-fade', 'data-l': 'ceiling', style: { '--delay': `${d(1900)}ms` }, text: labels.ceiling }),
      // Floors count on top.
      drawPath(`M${W + 6} ${-H - 8} H${W + 60}`, d(1800), 500),
      s('text', { x: W + 64, y: -H - 5, class: 'd-label d-fade', 'data-l': 'floors', style: { '--delay': `${d(2000)}ms` }, text: labels.floors }),
      // Frame leader from the first column.
      drawPath(`M0 ${-fh * 5} L-24 ${-fh * 5 - 16} H-104`, d(1850), 600),
      s('text', { x: -104, y: -fh * 5 - 22, class: 'd-label d-fade', 'data-l': 'frame', style: { '--delay': `${d(2050)}ms` }, text: labels.frame }),
      s('text', { x: -70, y: -6, class: 'd-label d-fade', 'data-l': 'datum', style: { '--delay': `${d(400)}ms` }, text: labels.datum }),
    );
    g.appendChild(L);
  }
  return { g, W, H };
}

/** Outline-only silhouette for distant / planned blocks. */
export function silhouette({ x, y = 0, w, h, dashed = false, delay = 0 }) {
  return drawPath(`M${x} ${y} V${y - h} H${x + w} V${y}`, delay, 1100, dashed ? 'dashed' : '');
}
