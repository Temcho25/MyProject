// SVG drawings built from the project's verified specifications. Rendered at build time.
import { plan } from '../content/plots.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------------------------------------------------------------- location */
// Schematic radial diagram, 0.5 units per metre. Lake to the north-west and the street to the
// south-east follow the general geography of Lisi; the drawing is not to scale.
export function locationMap(L) {
  const c = 300;
  const r300 = 150;
  const r500 = 250;
  const lakeX = c - r300 * 0.74 - 46;
  const lakeY = c - r300 * 0.74 - 52;
  return `
<svg class="locmap" viewBox="0 0 600 600" role="img" aria-labelledby="locmap-title">
  <title id="locmap-title">${esc(L.site)} — ${esc(L.lake)} 300 m, ${esc(L.street)} 500 m</title>
  <defs>
    <pattern id="loc-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width=".7" opacity=".35"/>
    </pattern>
  </defs>
  <g class="locmap__grid" aria-hidden="true">
    ${Array.from({ length: 11 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="600"/><line x1="0" y1="${i * 60}" x2="600" y2="${i * 60}"/>`).join('')}
  </g>
  <g class="locmap__ring locmap__ring--500" data-step="2">
    <circle cx="${c}" cy="${c}" r="${r500}" pathLength="1"/>
    <text x="${c + r500 * 0.71 + 8}" y="${c - r500 * 0.71 - 6}" class="locmap__tick">500 m</text>
  </g>
  <g class="locmap__ring locmap__ring--300" data-step="0">
    <circle cx="${c}" cy="${c}" r="${r300}" pathLength="1"/>
    <text x="${c + 8}" y="${c - r300 - 8}" class="locmap__tick">300 m</text>
  </g>
  <g class="locmap__lake" data-step="0">
    <path d="M${lakeX - 40} ${lakeY - 70} C${lakeX + 10} ${lakeY - 110} ${lakeX + 70} ${lakeY - 60} ${lakeX + 64} ${lakeY + 4}
             C${lakeX + 60} ${lakeY + 54} ${lakeX + 30} ${lakeY + 86} ${lakeX - 8} ${lakeY + 78}
             C${lakeX - 52} ${lakeY + 70} ${lakeX - 74} ${lakeY + 10} ${lakeX - 62} ${lakeY - 30} Z"/>
    <text x="${lakeX - 34}" y="${lakeY + 4}" class="locmap__label locmap__label--lake">${esc(L.lake)}</text>
  </g>
  <path class="locmap__path" data-step="0" pathLength="1" d="M${c - 6} ${c - 8} C${c - 40} ${c - 40} ${c - 70} ${c - 70} ${lakeX + 52} ${lakeY + 50}"/>
  <g class="locmap__street" data-step="1">
    <path pathLength="1" d="M${c + 120} 600 C${c + 160} ${c + 240} ${c + 230} ${c + 190} 600 ${c + 120}"/>
    <text x="${c + 248}" y="${c + 226}" class="locmap__label" text-anchor="end">${esc(L.street)}</text>
  </g>
  <g class="locmap__schools" data-step="2" aria-hidden="true">
    ${[0, 1, 2, 3].map((i) => `<rect x="${c - r500 * 0.71 - 52 + i * 14}" y="${c + r500 * 0.71 - 2}" width="9" height="9"/>`).join('')}
    <text x="${c - r500 * 0.71 - 52}" y="${c + r500 * 0.71 + 26}" class="locmap__label">${esc(L.schools)} · 4</text>
  </g>
  <g class="locmap__site" data-step="3">
    <rect x="${c - 26}" y="${c - 20}" width="52" height="40" class="locmap__site-fence" pathLength="1"/>
    <rect x="${c - 26}" y="${c - 20}" width="52" height="40" fill="url(#loc-hatch)" class="locmap__site-fill"/>
  </g>
  <g class="locmap__pin">
    <circle cx="${c}" cy="${c}" r="5"/>
    <circle cx="${c}" cy="${c}" r="14" class="locmap__pulse"/>
    <text x="${c + 34}" y="${c + 4}" class="locmap__label locmap__label--site">${esc(L.site)}</text>
  </g>
  <g class="locmap__north" transform="translate(548 52)" aria-hidden="true">
    <circle r="20"/>
    <path d="M0 -14 L5 4 L0 0 L-5 4 Z"/>
    <text y="-26" text-anchor="middle">N</text>
  </g>
</svg>`;
}

/* ---------------------------------------------------------------- site plan */
// Shrinks a convex polygon towards its centre by roughly `d` units (keeps a gap between plots).
export function insetPoints(pts, d) {
  const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length;
  const cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
  return pts
    .map(([x, y]) => {
      const dx = cx - x, dy = cy - y;
      const len = Math.hypot(dx, dy) || 1;
      const k = (d * Math.SQRT2) / len;
      return `${(x + dx * k).toFixed(2)},${(y + dy * k).toFixed(2)}`;
    })
    .join(' ');
}
export function sitePlan(P, { id = 'siteplan', interactive = true } = {}) {
  const [vx, vy, vw, vh] = plan.viewBox;
  const plots = plan.plots
    .map((p) => {
      const label = `${P.plot} ${p.id}`;
      const attrs = interactive
        ? ` tabindex="0" role="button" aria-pressed="false" aria-label="${esc(label)}" data-plot="${p.id}"`
        : ' aria-hidden="true"';
      // Usable depth: the shallowest side of the plot, so the house sits inside wedge-shaped plots.
      const depth = Math.min(...p.pts.filter((q) => q[1] > p.y).map((q) => q[1])) - p.y;
      const cx = p.x + p.w / 2;
      const cy = p.y + depth / 2;
      return `<g class="plot"${attrs} style="--i:${p.id}">
  <polygon class="plot__shape" points="${insetPoints(p.pts, 0.6)}" pathLength="1"/>
  <rect class="plot__house" x="${cx - p.w * 0.22}" y="${cy - depth * 0.18}" width="${p.w * 0.44}" height="${depth * 0.36}"/>
  <text class="plot__num" x="${cx}" y="${cy + 2.6}" text-anchor="middle">${String(p.id).padStart(2, '0')}</text>
</g>`;
    })
    .join('');
  const roads = plan.roads.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`).join('');
  const { gate, path } = plan;
  const sb = plan.size.height + 14;
  return `
<svg class="siteplan" id="${id}" viewBox="${vx} ${vy} ${vw} ${vh}" ${interactive ? `role="group" aria-label="${esc(P.legend)}"` : 'aria-hidden="true" focusable="false"'}>
  <defs>
    <pattern id="${id}-sold" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="3" stroke="currentColor" stroke-width=".7"/>
    </pattern>
    <pattern id="${id}-reserved" width="3" height="3" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r=".55" fill="currentColor"/>
    </pattern>
  </defs>
  <g class="siteplan__roads" aria-hidden="true">${roads}</g>
  <path class="siteplan__path" aria-hidden="true" d="M${path.from[0]} ${path.from[1]} C${path.from[0] + 14} ${path.from[1]} ${path.to[0] - 12} ${path.to[1] + 10} ${path.to[0]} ${path.to[1]}"/>
  <g class="siteplan__plots">${plots}</g>
  <g class="siteplan__gate" aria-hidden="true" transform="translate(${gate.x} ${gate.y})">
    <line x1="0" y1="-5" x2="0" y2="5"/>
    <circle r="1.6"/>
  </g>
  <g class="siteplan__labels" aria-hidden="true">
    <text x="${gate.x - 14}" y="${gate.y - 8}">${esc(P.gate)}</text>
    <text x="${path.to[0] - 2}" y="${path.to[1] - 4}" text-anchor="end">${esc(P.path)}</text>
  </g>
  <g class="siteplan__scale" aria-hidden="true" transform="translate(${plan.roads[0].x} ${sb})">
    <line x1="0" y1="0" x2="50" y2="0"/><line x1="0" y1="-2" x2="0" y2="2"/><line x1="25" y1="-1.4" x2="25" y2="1.4"/><line x1="50" y1="-2" x2="50" y2="2"/>
    <text x="0" y="7">${esc(P.scale)}</text>
  </g>
  <g class="siteplan__north" aria-hidden="true" transform="translate(${vx + vw - 12} ${vy + 12})">
    <circle r="6"/><path d="M0 -4.4 L1.8 1.6 L0 .4 L-1.8 1.6Z"/><text y="-8" text-anchor="middle">${esc(P.north)}</text>
  </g>
  ${interactive ? '<g class="siteplan__measure" aria-hidden="true"></g>' : ''}
</svg>`;
}

/* ---------------------------------------------------------------- street section */
// Horizontal units: 60 px per metre. Underground depths are schematic.
export function streetSection(S) {
  const m = 60;
  const G = 360; // ground line
  const W = 2520;
  const xs = {
    plotL: 0,
    fenceL: 9 * m,
    walkL: 9.3 * m,
    road: 11.3 * m,
    walkR: 18.3 * m,
    fenceR: 20.3 * m,
    plotR: 20.6 * m,
    end: 42 * m,
  };
  const fence = (x, flip) => {
    const h = 1.8 * m;
    const plinth = 0.4 * m;
    const boards = Array.from({ length: 1 }, () => '').join('');
    return `<g class="sec__fence" data-callout="fence">
      <rect x="${x}" y="${G - plinth}" width="${0.3 * m}" height="${plinth}" class="sec__concrete"/>
      <rect x="${x + 3}" y="${G - h}" width="${0.3 * m - 6}" height="${h - plinth}" class="sec__deck"/>
      ${boards}
      <g class="sec__dim" transform="translate(${flip ? x + 0.3 * m + 18 : x - 18} 0)">
        <line x1="0" y1="${G}" x2="0" y2="${G - h}"/><line x1="-5" y1="${G - h}" x2="5" y2="${G - h}"/><line x1="-5" y1="${G}" x2="5" y2="${G}"/>
        <text x="${flip ? 10 : -10}" y="${G - h / 2}" text-anchor="${flip ? 'start' : 'end'}">≤ 1.8 m</text>
      </g>
    </g>`;
  };
  const pipe = (key, x, depth, r, label, cls) =>
    `<g class="sec__pipe sec__pipe--${cls}" data-callout="${key}">
      <circle cx="${x}" cy="${G + depth}" r="${r}"/>
      <line class="sec__leader" x1="${x}" y1="${G + depth + r}" x2="${x}" y2="${G + 214}"/>
      <text x="${x}" y="${G + 232}" text-anchor="middle">${esc(label)}</text>
    </g>`;
  const tree = (x, s = 1) => `<g class="sec__tree" transform="translate(${x} ${G}) scale(${s})">
      <line x1="0" y1="0" x2="0" y2="-120"/>
      <path d="M0 -250 C 70 -240 92 -170 70 -132 C 50 -100 -50 -100 -70 -132 C -94 -172 -66 -240 0 -250Z"/>
    </g>`;
  const person = (x) => `<g class="sec__person" transform="translate(${x} ${G})">
      <circle cx="0" cy="-96" r="9"/><path d="M-11 -84 L11 -84 L14 -40 L8 -40 L6 0 L-6 0 L-8 -40 L-14 -40Z"/>
    </g>`;
  const lightX = xs.walkR + 1 * m;
  return `
<svg class="sec" viewBox="0 0 ${W} 640" role="img" aria-labelledby="sec-title">
  <title id="sec-title">${esc(S.diagram)}</title>
  <defs>
    <pattern id="sec-soil" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="currentColor" stroke-width="1" opacity=".18"/>
    </pattern>
    <pattern id="sec-conc" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r=".9" fill="currentColor" opacity=".45"/><circle cx="6" cy="5" r=".6" fill="currentColor" opacity=".35"/>
    </pattern>
    <linearGradient id="sec-light" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#F3D9A0" stop-opacity=".75"/><stop offset="1" stop-color="#F3D9A0" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect class="sec__soil" x="0" y="${G}" width="${W}" height="${640 - G}" fill="url(#sec-soil)"/>
  <g class="sec__ground">
    <path class="sec__ground-line" pathLength="1" d="M0 ${G} L${xs.road} ${G} L${xs.road} ${G + 6} L${xs.walkR} ${G + 6} L${xs.walkR} ${G} L${W} ${G}"/>
  </g>
  <g class="sec__labels-top">
    <text x="${xs.plotL + 4.5 * m}" y="${G - 300}" text-anchor="middle" class="sec__zone">${esc(S.plot)}</text>
    <text x="${(xs.walkL + xs.road) / 2}" y="${G - 300}" text-anchor="middle" class="sec__zone">${esc(S.walk)}</text>
    <text x="${(xs.road + xs.walkR) / 2}" y="${G - 300}" text-anchor="middle" class="sec__zone">${esc(S.road)}</text>
    <text x="${(xs.walkR + xs.fenceR) / 2}" y="${G - 300}" text-anchor="middle" class="sec__zone">${esc(S.walk)}</text>
    <text x="${xs.plotR + 8 * m}" y="${G - 300}" text-anchor="middle" class="sec__zone">${esc(S.plot)}</text>
    ${[xs.fenceL, xs.walkL, xs.road, xs.walkR, xs.fenceR + 0.3 * m].map((x) => `<line class="sec__axis" x1="${x}" y1="${G - 330}" x2="${x}" y2="${G - 286}"/>`).join('')}
  </g>
  ${tree(3.5 * m, 1)}
  ${person(6.5 * m)}
  ${fence(xs.fenceL, false)}
  <g class="sec__walk" data-callout="walk">
    <rect x="${xs.walkL}" y="${G - 6}" width="${2 * m}" height="12" fill="url(#sec-conc)"/>
    <rect x="${xs.walkR}" y="${G - 6}" width="${2 * m}" height="12" fill="url(#sec-conc)"/>
  </g>
  <g class="sec__road" data-callout="road">
    <rect x="${xs.road}" y="${G}" width="${7 * m}" height="14"/>
    <line x1="${xs.road + 3.5 * m - 30}" y1="${G + 2}" x2="${xs.road + 3.5 * m + 30}" y2="${G + 2}" class="sec__mark"/>
    <g class="sec__car" transform="translate(${xs.road + 1.4 * m} ${G})">
      <path d="M0 -14 L0 -52 Q4 -64 30 -68 L70 -92 Q96 -100 150 -98 L196 -70 Q236 -64 242 -48 L244 -14 Z"/>
      <circle cx="52" cy="-12" r="16"/><circle cx="192" cy="-12" r="16"/>
    </g>
  </g>
  <g class="sec__light" data-callout="light">
    <path class="sec__beam" d="M${lightX - 64} ${G - 372} L${lightX - 260} ${G} L${lightX + 20} ${G} Z" fill="url(#sec-light)"/>
    <line x1="${lightX}" y1="${G}" x2="${lightX}" y2="${G - 380}"/>
    <path d="M${lightX} ${G - 380} Q${lightX} ${G - 392} ${lightX - 16} ${G - 392} L${lightX - 70} ${G - 392}"/>
    <rect x="${lightX - 88}" y="${G - 396}" width="34" height="8" rx="2"/>
  </g>
  ${fence(xs.fenceR, true)}
  <g class="sec__gate" data-callout="gate">
    <rect x="${xs.plotR + 1.4 * m}" y="${G - 1.8 * m}" width="${4 * m}" height="${1.8 * m}" class="sec__gate-leaf"/>
    ${Array.from({ length: 15 }, (_, i) => `<line x1="${xs.plotR + 1.4 * m + 8 + i * 15.4}" y1="${G - 1.8 * m + 8}" x2="${xs.plotR + 1.4 * m + 8 + i * 15.4}" y2="${G - 8}"/>`).join('')}
    <g class="sec__dim">
      <line x1="${xs.plotR + 1.4 * m}" y1="${G - 1.8 * m - 22}" x2="${xs.plotR + 5.4 * m}" y2="${G - 1.8 * m - 22}"/>
      <line x1="${xs.plotR + 1.4 * m}" y1="${G - 1.8 * m - 28}" x2="${xs.plotR + 1.4 * m}" y2="${G - 1.8 * m - 16}"/>
      <line x1="${xs.plotR + 5.4 * m}" y1="${G - 1.8 * m - 28}" x2="${xs.plotR + 5.4 * m}" y2="${G - 1.8 * m - 16}"/>
      <text x="${xs.plotR + 3.4 * m}" y="${G - 1.8 * m - 32}" text-anchor="middle">${esc(S.gate)}</text>
    </g>
  </g>
  <g class="sec__house" transform="translate(${xs.plotR + 9 * m} ${G})">
    <path pathLength="1" d="M0 0 L0 -170 L260 -170 L260 -110 L470 -110 L470 0" class="sec__house-line"/>
    <line x1="40" y1="-60" x2="180" y2="-60" class="sec__house-glass"/>
    <text x="235" y="-196" text-anchor="middle" class="sec__note">${esc(S.house)}</text>
  </g>
  ${tree(xs.plotR + 19 * m, 1.15)}
  ${pipe('power', xs.walkL + 0.6 * m, 70, 9, S.power, 'power')}
  ${pipe('net', xs.walkL + 1.4 * m, 64, 7, S.net, 'net')}
  ${pipe('water', xs.road + 1.6 * m, 118, 13, S.water, 'water')}
  ${pipe('storm', xs.road + 3.5 * m, 150, 22, S.storm, 'storm')}
  ${pipe('sewer', xs.road + 5.4 * m, 176, 18, S.sewer, 'sewer')}
  ${pipe('gas', xs.walkR + 1 * m, 90, 9, S.gas, 'gas')}
  <g class="sec__service" aria-hidden="true">
    <path pathLength="1" d="M${xs.walkR + 1 * m} ${G + 90} L${xs.plotR + 1 * m} ${G + 90} L${xs.plotR + 1 * m} ${G + 30} L${xs.plotR + 9 * m} ${G + 30} L${xs.plotR + 9 * m} ${G}"/>
  </g>
  <text x="${W - 24}" y="${640 - 18}" text-anchor="end" class="sec__caption">${esc(S.diagram)}</text>
</svg>`;
}

/* ---------------------------------------------------------------- plates */
const frame = (inner, label) => `<svg class="plate-svg" viewBox="0 0 400 500" role="img" aria-label="${esc(label)}">
  <rect class="plate-svg__frame" x="10" y="10" width="380" height="480"/>
  ${inner}
</svg>`;

export function plateSvg(id, label, P) {
  if (id === 'scale') {
    const s = 8.2; // px per metre
    const side = 31.6 * s;
    const x = 200 - side / 2;
    const y = 90;
    return frame(
      `<rect class="pl-fill" x="${x}" y="${y}" width="${side}" height="${side}"/>
       <rect class="pl-court" x="${x + 14}" y="${y + side - 14 - 10.97 * s}" width="${23.77 * s}" height="${10.97 * s}"/>
       <line class="pl-court" x1="${x + 14 + 11.885 * s}" y1="${y + side - 14 - 10.97 * s}" x2="${x + 14 + 11.885 * s}" y2="${y + side - 14}"/>
       <g class="pl-dim"><line x1="${x}" y1="${y - 18}" x2="${x + side}" y2="${y - 18}"/><line x1="${x}" y1="${y - 24}" x2="${x}" y2="${y - 12}"/><line x1="${x + side}" y1="${y - 24}" x2="${x + side}" y2="${y - 12}"/>
       <text x="200" y="${y - 26}" text-anchor="middle">31.6 m</text></g>
       <g class="pl-dim"><line x1="${x + side + 18}" y1="${y}" x2="${x + side + 18}" y2="${y + side}"/><text x="${x + side + 24}" y="${y + side / 2}" transform="rotate(90 ${x + side + 24} ${y + side / 2})" text-anchor="middle">31.6 m</text></g>
       <text class="pl-big" x="200" y="${y + side / 2 - 10}" text-anchor="middle">1000 m²</text>
       <text class="pl-small" x="${x + 14}" y="${y + side - 22 - 10.97 * s}">23.77 × 10.97 m</text>
       <text class="pl-cap" x="30" y="460">${esc(label)}</text>`,
      label,
    );
  }
  if (id === 'fence') {
    const s = 120;
    const G = 400;
    const boards = Array.from({ length: 13 }, (_, i) => `<rect class="pl-board" x="${46 + i * 18}" y="${G - 1.8 * s}" width="14" height="${1.8 * s - 0.4 * s}"/>`).join('');
    return frame(
      `<line class="pl-ground" x1="20" y1="${G}" x2="380" y2="${G}"/>
       <rect class="pl-conc" x="40" y="${G - 0.4 * s}" width="240" height="${0.4 * s}"/>
       ${boards}
       <g class="pl-dim"><line x1="300" y1="${G}" x2="300" y2="${G - 1.8 * s}"/><line x1="294" y1="${G - 1.8 * s}" x2="306" y2="${G - 1.8 * s}"/><line x1="294" y1="${G}" x2="306" y2="${G}"/>
       <text x="312" y="${G - 0.9 * s}">≤ 1.8 m</text></g>
       <text class="pl-small" x="46" y="${G + 22}">${P.plinth}</text>
       <text class="pl-small" x="46" y="${G - 1.8 * s - 12}">${P.deck}</text>
       <text class="pl-cap" x="30" y="460">${esc(label)}</text>`,
      label,
    );
  }
  if (id === 'gate') {
    const s = 64;
    const G = 380;
    const gx = 40;
    return frame(
      `<line class="pl-ground" x1="20" y1="${G}" x2="380" y2="${G}"/>
       <rect class="pl-leaf" x="${gx}" y="${G - 1.8 * s}" width="${4 * s}" height="${1.8 * s}"/>
       ${Array.from({ length: 16 }, (_, i) => `<line class="pl-slat" x1="${gx + 8 + i * 15.5}" y1="${G - 1.8 * s + 6}" x2="${gx + 8 + i * 15.5}" y2="${G - 6}"/>`).join('')}
       <rect class="pl-door" x="${gx + 4 * s + 18}" y="${G - 1.8 * s}" width="56" height="${1.8 * s}"/>
       <circle class="pl-knob" cx="${gx + 4 * s + 26}" cy="${G - 0.9 * s}" r="2.5"/>
       <g class="pl-dim"><line x1="${gx}" y1="${G - 1.8 * s - 22}" x2="${gx + 4 * s}" y2="${G - 1.8 * s - 22}"/><line x1="${gx}" y1="${G - 1.8 * s - 28}" x2="${gx}" y2="${G - 1.8 * s - 16}"/><line x1="${gx + 4 * s}" y1="${G - 1.8 * s - 28}" x2="${gx + 4 * s}" y2="${G - 1.8 * s - 16}"/>
       <text x="${gx + 2 * s}" y="${G - 1.8 * s - 32}" text-anchor="middle">4.0 m</text></g>
       <text class="pl-small" x="${gx + 4 * s + 18}" y="${G + 22}">${P.door}</text>
       <text class="pl-cap" x="30" y="460">${esc(label)}</text>`,
      label,
    );
  }
  if (id === 'radius') {
    return frame(
      `<circle class="pl-ring" cx="200" cy="230" r="150"/>
       <circle class="pl-ring pl-ring--in" cx="200" cy="230" r="90"/>
       <circle class="pl-site" cx="200" cy="230" r="6"/>
       <text class="pl-small" x="206" y="134">300 m</text>
       <text class="pl-small" x="206" y="74">500 m</text>
       ${[0, 1, 2, 3].map((i) => `<rect class="pl-school" x="${30 + i * 14}" y="404" width="9" height="9"/>`).join('')}
       <text class="pl-small" x="92" y="412">${esc(P.schools)}</text>
       <text class="pl-cap" x="30" y="460">${esc(label)}</text>`,
      label,
    );
  }
  // plan
  return `<div class="plate-plan">${sitePlan(P.planCopy, { id: 'plate-plan', interactive: false })}<p class="plate-plan__cap">${esc(label)}</p></div>`;
}
