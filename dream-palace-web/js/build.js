// 03 — From structure to space: a pinned, scroll-scrubbed construction sequence.
// The crane delivers each slab; columns rise floor by floor; the camera trucks from
// Block 1 to Block 2 and pulls back to reveal the planned phase.
import { svgRoot, s, drawPath } from './svg.js';
import { scene, motion, range, settle, easeInOut, lerp, clamp } from './motion.js';
import { milestones, phases } from './data.js';
import { pick, onLang, t } from './i18n.js';

const GROUND = 360;
const FH = 32;
const FLOORS = 8;
const BAYS = 6;
const BAY = 36;
const W = BAYS * BAY;
const BLOCKS = [
  { x: 110, f0: 0.14, f1: 0.47, found: [0.07, 0.14], glaze: [0.8, 0.9] },
  { x: 470, f0: 0.56, f1: 0.79, found: [0.5, 0.56], glaze: [0.84, 0.94] },
];
const PLANNED_X = 830;
const CRANE_X = 420;
const JIB_Y = 34;

// Camera keyframes: [progress, x, y, w, h] of the SVG viewBox.
const CAM = [
  [0.0, -20, 40, 620, 350],
  [0.46, -20, 10, 620, 380],
  [0.56, 330, 10, 620, 380],
  [0.86, 330, 10, 620, 380],
  [1.0, 70, 30, 1000, 370],
];

function camAt(p) {
  for (let i = 0; i < CAM.length - 1; i++) {
    const [a, ...va] = CAM[i];
    const [b, ...vb] = CAM[i + 1];
    if (p <= b) {
      const k = easeInOut(range(p, a, b));
      return va.map((v, j) => lerp(v, vb[j], k));
    }
  }
  return CAM[CAM.length - 1].slice(1);
}

export function initBuild() {
  const root = document.querySelector('[data-scene="build"]');
  const holder = root.querySelector('[data-build-svg]');
  const floorOut = root.querySelector('[data-build-floor]');
  const phaseOut = root.querySelector('[data-build-phase]');
  const bar = root.querySelector('[data-build-bar]');
  const list = root.querySelector('[data-milestones]');

  const svg = svgRoot('-20 40 620 350', { preserveAspectRatio: 'xMidYMax meet' });
  svg.appendChild(s('defs', {}, [
    s('filter', { id: 'mb1', x: '-10%', y: '-200%', width: '120%', height: '500%' }, [s('feGaussianBlur', { stdDeviation: '0 1.4' })]),
    s('filter', { id: 'mb2', x: '-10%', y: '-200%', width: '120%', height: '500%' }, [s('feGaussianBlur', { stdDeviation: '0 3' })]),
    s('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, [
      s('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: 'rgba(247,246,240,.25)', 'stroke-width': 1 }),
    ]),
  ]));

  // Ground and datum line.
  svg.appendChild(s('rect', { x: -600, y: GROUND, width: 2400, height: 120, class: 'ground-fill' }));
  const datum = s('path', { d: `M-600 ${GROUND} H1800`, class: 'd-line', stroke: 'var(--gold)', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 });
  datum.style.color = 'var(--gold)';
  svg.appendChild(datum);

  // Planned phase (dashed outline, drawn at the end).
  const planned = s('g', { class: 'planned' }, [
    s('path', { d: `M${PLANNED_X} ${GROUND} V${GROUND - FLOORS * FH} H${PLANNED_X + W} V${GROUND}`, class: 'd-line', 'stroke-dasharray': '6 5', pathLength: undefined }),
    s('text', { x: PLANNED_X + W / 2, y: GROUND - FLOORS * FH / 2, 'text-anchor': 'middle', class: 'd-label', 'data-l': 'planned', text: t('labels').planned }),
  ]);
  planned.style.opacity = 0;
  svg.appendChild(planned);

  // Blocks.
  const parts = BLOCKS.map((b) => {
    const g = s('g', { class: 'slab' });
    const foundEl = s('rect', { x: b.x - 12, y: GROUND, width: W + 24, height: 16, fill: 'url(#hatch)', stroke: 'currentColor', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' });
    g.appendChild(foundEl);
    const cols = [];
    const slabs = [];
    const glazeEls = [];
    for (let f = 0; f < FLOORS; f++) {
      const yb = GROUND - f * FH;
      const row = [];
      for (let i = 0; i <= BAYS; i++) {
        const c = s('rect', { x: b.x + i * BAY - 1.5, y: -FH, width: 3, height: FH, fill: 'currentColor' });
        const wrap = s('g', { transform: `translate(0 ${yb}) scale(1 0)` }, [c]);
        row.push(wrap);
        g.appendChild(wrap);
      }
      cols.push(row);
      const gl = s('g', { opacity: 0 });
      for (let i = 0; i < BAYS; i++) gl.appendChild(s('rect', { x: b.x + i * BAY + 5, y: yb - FH + 7, width: BAY - 10, height: FH - 12, class: 'glaze', opacity: 0.32 }));
      glazeEls.push(gl);
      g.appendChild(gl);
    }
    for (let f = 0; f < FLOORS; f++) {
      const slab = s('rect', { x: b.x - 6, y: -2.5, width: W + 12, height: 5, fill: 'currentColor' });
      const wrap = s('g', { opacity: 0 }, [slab]);
      slabs.push({ wrap, y: GROUND - (f + 1) * FH, last: null });
      g.appendChild(wrap);
    }
    svg.appendChild(g);
    return { ...b, foundEl, cols, slabs, glazeEls };
  });

  // Crane: mast, jib, trolley, cable.
  const crane = s('g', { class: 'crane' });
  const mast = [];
  for (let y = GROUND; y > JIB_Y + 10; y -= 24) {
    mast.push(`M${CRANE_X - 6} ${y} L${CRANE_X + 6} ${y - 24} M${CRANE_X + 6} ${y} L${CRANE_X - 6} ${y - 24}`);
  }
  crane.append(
    s('path', { d: `M${CRANE_X - 6} ${GROUND} V${JIB_Y} M${CRANE_X + 6} ${GROUND} V${JIB_Y} ${mast.join(' ')}`, class: 'd-line', 'stroke-width': 1 }),
    s('path', { d: `M${CRANE_X - 120} ${JIB_Y} H${CRANE_X + 420} M${CRANE_X - 120} ${JIB_Y + 8} H${CRANE_X + 420} M${CRANE_X} ${JIB_Y - 30} L${CRANE_X - 120} ${JIB_Y} M${CRANE_X} ${JIB_Y - 30} L${CRANE_X + 420} ${JIB_Y} M${CRANE_X} ${JIB_Y - 30} V${JIB_Y}`, class: 'd-line', 'stroke-width': 1 }),
    s('rect', { x: CRANE_X - 150, y: JIB_Y - 4, width: 30, height: 18, fill: 'currentColor', opacity: 0.6 }),
  );
  const trolley = s('rect', { x: -8, y: JIB_Y + 6, width: 16, height: 6, fill: 'currentColor' });
  const cable = s('line', { x1: 0, y1: JIB_Y + 12, x2: 0, y2: 80, stroke: 'currentColor', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' });
  const trolleyG = s('g', {}, [trolley, cable]);
  crane.appendChild(trolleyG);
  svg.appendChild(crane);
  holder.appendChild(svg);

  // Milestone list.
  const renderList = () => {
    list.innerHTML = '';
    milestones.forEach((m, i) => {
      const li = document.createElement('li');
      li.className = 'ms';
      li.dataset.i = i;
      li.innerHTML = `<p class="ms__date">${pick(m.date)}</p><p class="ms__title">${pick(m.title)}</p><p class="ms__src">${pick(m.src)}</p>${m.img ? `<img class="ms__img" src="${m.img}" alt="${pick(m.alt)}" loading="lazy">` : ''}`;
      list.appendChild(li);
    });
  };
  renderList();

  // Stage aspect is cached (no layout reads inside the scroll loop).
  let stageAspect = 0;
  new ResizeObserver(([e]) => { stageAspect = e.contentRect.width / (e.contentRect.height || 1); }).observe(holder);
  let lastActive = -1;
  let lastPhase = '';
  let trolleyX = BLOCKS[0].x + W / 2;

  const update = (p) => {
    // Camera.
    let [cx, cy, cw, ch] = camAt(p);
    // Portrait screens: tighter lens anchored to the ground so the frame stays legible.
    if (stageAspect && stageAspect < 1.2) {
      const z = lerp(0.62, 0.9, range(p, 0.86, 1));
      const focus = lerp(BLOCKS[0].x + W / 2, BLOCKS[1].x + W / 2, easeInOut(range(p, 0.47, 0.55)));
      const center = lerp(focus, cx + cw / 2, range(p, 0.86, 1));
      cy += ch * (1 - z); cw *= z; ch *= z; cx = center - cw / 2;
    }
    svg.setAttribute('viewBox', `${cx.toFixed(1)} ${cy.toFixed(1)} ${cw.toFixed(1)} ${ch.toFixed(1)}`);
    datum.setAttribute('stroke-dashoffset', (1 - range(p, 0, 0.08)).toFixed(4));

    let floorsDone = 0;
    let hookY = 80;
    let hookTarget = null;
    parts.forEach((b, bi) => {
      const fp = range(p, b.found[0], b.found[1]);
      b.foundEl.setAttribute('opacity', fp.toFixed(3));
      b.foundEl.setAttribute('transform', `translate(0 ${(1 - fp) * 10})`);
      const span = (b.f1 - b.f0) / FLOORS;
      for (let f = 0; f < FLOORS; f++) {
        const a = b.f0 + f * span;
        const colT = easeInOut(range(p, a, a + span * 0.45));
        const slabT = range(p, a + span * 0.4, a + span);
        b.cols[f].forEach((c) => c.setAttribute('transform', `translate(0 ${GROUND - f * FH}) scale(1 ${colT.toFixed(4)})`));
        const sl = b.slabs[f];
        const yStart = JIB_Y + 50;
        const y = lerp(yStart, sl.y, settle(slabT));
        const vis = slabT > 0 ? 1 : 0;
        sl.wrap.setAttribute('opacity', vis);
        sl.wrap.setAttribute('transform', `translate(0 ${y.toFixed(2)})`);
        // Motion blur from on-screen velocity of the falling slab.
        const dy = sl.last == null ? 0 : Math.abs(y - sl.last);
        sl.last = y;
        sl.wrap.setAttribute('filter', motion.reduced || slabT >= 1 ? '' : dy > 9 ? 'url(#mb2)' : dy > 3 ? 'url(#mb1)' : '');
        if (slabT > 0 && slabT < 1) { hookY = y; hookTarget = b.x + W / 2; }
        if (slabT >= 1 && bi === (p < 0.52 ? 0 : 1)) floorsDone = f + 1;
        const gT = range(p, b.glaze[0] + f * 0.008, b.glaze[0] + f * 0.008 + 0.04);
        b.glazeEls[f].setAttribute('opacity', gT.toFixed(3));
      }
    });

    // Trolley follows the block being built; travels between blocks during the hand-over.
    const target = hookTarget ?? (p < 0.5 ? BLOCKS[0].x + W / 2 : BLOCKS[1].x + W / 2);
    trolleyX = lerp(BLOCKS[0].x + W / 2, BLOCKS[1].x + W / 2, easeInOut(range(p, 0.47, 0.55)));
    if (hookTarget != null) trolleyX = target;
    trolleyG.setAttribute('transform', `translate(${trolleyX.toFixed(1)} 0)`);
    cable.setAttribute('y2', (hookTarget != null ? hookY - 3 : JIB_Y + 50).toFixed(1));

    planned.style.opacity = range(p, 0.9, 1).toFixed(3);

    floorOut.textContent = String(floorsDone).padStart(2, '0');
    bar.style.setProperty('--bp', p.toFixed(4));

    const phase = p < 0.14 ? 'foundation' : p < 0.5 ? 'frame1' : p < 0.8 ? 'frame2' : 'facade';
    if (phase !== lastPhase) { lastPhase = phase; phaseOut.textContent = pick(phases[phase]); phaseOut.dataset.phase = phase; }

    let active = 0;
    milestones.forEach((m, i) => { if (p >= m.at - 0.03) active = i; });
    if (active !== lastActive) {
      lastActive = active;
      list.querySelectorAll('.ms').forEach((li, i) => li.classList.toggle('is-active', motion.compact ? i === active : i <= active));
    }
  };

  scene(root, update, { mode: 'pin', damping: 6 });

  onLang(() => {
    renderList();
    lastActive = -1;
    lastPhase = '';
    planned.querySelector('[data-l]').textContent = t('labels').planned;
    update(clamp(parseFloat(bar.style.getPropertyValue('--bp')) || 0));
  });
}
