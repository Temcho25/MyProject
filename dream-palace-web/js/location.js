// 07 — Location as a relationship diagram (no scale, no directions).
// The datum line becomes Bob Walsh Street; links draw outward from the complex.
import { svgRoot, s } from './svg.js';
import { places } from './data.js';
import { pick, t, onLang } from './i18n.js';
import { motion } from './motion.js';

export function initLocation() {
  const holder = document.querySelector('[data-loc-svg]');
  const list = document.querySelector('[data-places]');
  const svg = svgRoot('0 0 600 400');
  const dp = places[0];
  let active = dp.id;

  const street = s('path', { d: 'M20 210 H580', class: 'd-line loc-street d-draw', pathLength: 1, style: { '--dur': '1400ms' } });
  const streetLabel = s('text', { x: 30, y: 230, class: 'd-label d-label--gold' });
  svg.append(street, streetLabel);

  const links = {};
  places.slice(1).forEach((p, i) => {
    const mx = (dp.x + p.x) / 2;
    const d = p.y === dp.y ? `M${dp.x} ${dp.y} H${p.x}` : `M${dp.x} ${dp.y} C${dp.x} ${(dp.y + p.y) / 2} ${mx} ${p.y} ${p.x} ${p.y}`;
    links[p.id] = s('path', { d, class: 'loc-link', pathLength: 1, style: { '--delay': `${500 + i * 220}ms` } });
    svg.appendChild(links[p.id]);
  });

  const nodes = places.map((p, i) => {
    const isDP = i === 0;
    const label = s('text', { x: p.x, y: p.y - (isDP ? 26 : 18), 'text-anchor': 'middle', class: 'd-label', style: { fontSize: isDP ? '13px' : '11px' } });
    const g = s('g', { class: 'loc-node', 'data-id': p.id }, [
      isDP ? s('rect', { x: p.x - 12, y: p.y - 12, width: 24, height: 24, fill: 'var(--forest)', transform: `rotate(45 ${p.x} ${p.y})` }) : null,
      s('circle', { cx: p.x, cy: p.y, r: isDP ? 4 : 7, class: 'loc-dot', fill: isDP ? 'var(--gold)' : 'var(--white)', stroke: 'var(--ink)', 'stroke-width': 1.5 }),
      label,
    ]);
    g.addEventListener('click', () => set(p.id));
    svg.appendChild(g);
    return { p, g, label };
  });
  holder.appendChild(svg);

  function render() {
    streetLabel.textContent = t('labels').street;
    nodes.forEach(({ p, label }) => { label.textContent = pick(p.t); });
    list.innerHTML = '';
    places.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'place';
      li.innerHTML = `<button type="button" class="place__btn" data-id="${p.id}" aria-pressed="${p.id === active}"><span class="place__no">${String(i).padStart(2, '0')}</span><span class="place__t">${pick(p.t)}</span><span class="place__d">${pick(p.d)}</span></button>`;
      li.firstElementChild.addEventListener('click', () => set(p.id));
      li.firstElementChild.addEventListener('focus', () => set(p.id));
      list.appendChild(li);
    });
  }
  function set(id) {
    active = id;
    nodes.forEach(({ p, g }) => g.classList.toggle('is-active', p.id === id));
    Object.entries(links).forEach(([k, l]) => l.classList.toggle('is-active', k === id));
    list.querySelectorAll('.place__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  }
  render();
  set(active);

  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    holder.classList.add('is-drawn');
    io.disconnect();
  }, { threshold: 0.3 });
  if (motion.reduced) {
    holder.classList.add('is-drawn');
    Object.values(links).forEach((l) => { l.style.strokeDashoffset = 0; });
  } else io.observe(holder);
  onLang(() => { render(); set(active); });
}
