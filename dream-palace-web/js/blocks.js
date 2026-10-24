// 05 — Block status lineup. Status is shown by fill AND text, never colour alone.
import { svgRoot, s } from './svg.js';
import { blocks } from './data.js';
import { pick, t, onLang } from './i18n.js';
import { motion } from './motion.js';

export function initBlocks() {
  const holder = document.querySelector('[data-blocks-svg]');
  const tabs = document.querySelector('[data-block-tabs]');
  const detail = document.querySelector('[data-block-detail]');
  let current = blocks[0];

  const GROUND = 270;
  const FH = 26;
  const BW = 150;
  const svg = svgRoot('0 0 600 300');
  svg.appendChild(s('path', { d: `M0 ${GROUND} H600`, class: 'd-line', stroke: 'var(--gold)', style: { color: 'var(--gold)' }, 'stroke-width': 2 }));
  const groups = blocks.map((b, i) => {
    const x = 30 + i * 190;
    const planned = b.status === 'planned';
    const h = 8 * FH;
    const g = s('g', { class: `blk ${planned ? 'blk--planned' : ''}`, 'data-id': b.id });
    g.appendChild(s('rect', { x, y: GROUND - h, width: BW, height: h, class: 'blk-body' }));
    if (!planned) {
      for (let f = 1; f < 8; f++) g.appendChild(s('line', { x1: x, x2: x + BW, y1: GROUND - f * FH, y2: GROUND - f * FH, class: 'blk-line' }));
      for (let c = 1; c < 5; c++) g.appendChild(s('line', { x1: x + c * (BW / 5), x2: x + c * (BW / 5), y1: GROUND, y2: GROUND - h, class: 'blk-line' }));
    } else {
      g.appendChild(s('text', { x: x + BW / 2, y: GROUND - h / 2, class: 'blk-name', text: '?' }));
    }
    g.appendChild(s('rect', { x, y: GROUND - 4, width: BW, height: 4, class: 'blk-scan' }));
    const name = s('text', { x: x + BW / 2, y: GROUND + 22, class: 'blk-name' });
    g.appendChild(name);
    g.addEventListener('click', () => select(b, true));
    svg.appendChild(g);
    return { b, g, name };
  });
  holder.appendChild(svg);

  function renderTabs() {
    tabs.innerHTML = '';
    blocks.forEach((b) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'block-tab';
      btn.role = 'tab';
      btn.id = `btab-${b.id}`;
      btn.dataset.id = b.id;
      btn.setAttribute('aria-selected', String(b === current));
      btn.tabIndex = b === current ? 0 : -1;
      btn.innerHTML = `<span class="block-tab__dot ${b.status === 'planned' ? 'block-tab__dot--planned' : ''}" aria-hidden="true"></span>${pick(b.name)}`;
      btn.addEventListener('click', () => select(b, true));
      tabs.appendChild(btn);
    });
    groups.forEach(({ b, name }) => { name.textContent = pick(b.name); });
  }
  tabs.addEventListener('keydown', (e) => {
    const i = blocks.indexOf(current);
    const n = e.key === 'ArrowRight' ? (i + 1) % blocks.length : e.key === 'ArrowLeft' ? (i - 1 + blocks.length) % blocks.length : null;
    if (n == null) return;
    e.preventDefault();
    select(blocks[n], true);
    tabs.querySelector(`[data-id="${blocks[n].id}"]`).focus();
  });

  function renderDetail(animate) {
    const b = current;
    const planned = b.status === 'planned';
    detail.setAttribute('aria-labelledby', `btab-${b.id}`);
    detail.innerHTML = `
      <span class="block-detail__status ${planned ? 'block-detail__status--planned' : ''}">${planned ? t('statusPlanned') : t('statusDone')}</span>
      <h3>${pick(b.name)}</h3>
      <dl>
        <dt>${t('statusK')}</dt><dd>${pick(b.when)}</dd>
        <dt>${t('floorsK')}</dt><dd>${b.floors ?? t('tbc')}</dd>
        <dt>${t('unitsK')}</dt><dd>${b.units ?? t('tbc')}</dd>
      </dl>
      <p class="block-detail__src">${t('blockSrc')}</p>`;
    if (animate && !motion.reduced) { detail.classList.remove('swap-in'); void detail.offsetWidth; detail.classList.add('swap-in'); }
  }

  function select(b, animate) {
    current = b;
    tabs.querySelectorAll('.block-tab').forEach((x) => { const on = x.dataset.id === b.id; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; });
    groups.forEach(({ b: gb, g }) => {
      g.classList.remove('is-active');
      if (gb === b) { void g.getBoundingClientRect(); g.classList.add('is-active'); }
    });
    renderDetail(animate);
  }

  renderTabs();
  select(current, false);
  onLang(() => { renderTabs(); renderDetail(false); });
}
