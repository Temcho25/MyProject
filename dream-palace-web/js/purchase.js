// 09 — Illustrative payment calculator and 10 — FAQ accordion.
import { faq } from './data.js';
import { pick, onLang, getLang, NUM_LOCALES as LOC } from './i18n.js';

/** Equal monthly instalments, no interest. Exported for tests. */
export function estimate(price, downPct, months) {
  if (!(price > 0) || !(months >= 1)) return null;
  const down = (price * downPct) / 100;
  const rest = price - down;
  return { down, rest, monthly: rest / months };
}

export function initCalculator() {
  const form = document.querySelector('[data-calc]');
  const price = form.querySelector('#calc-price');
  const down = form.querySelector('#calc-down');
  const months = form.querySelector('#calc-months');
  const downOut = form.querySelector('[data-calc-down-out]');
  const monthsOut = form.querySelector('[data-calc-months-out]');
  const outs = Object.fromEntries([...document.querySelectorAll('[data-calc-o]')].map((n) => [n.dataset.calcO, n]));

  const money = (v, approx = false) => {
    const f = new Intl.NumberFormat(LOC[getLang()], { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    return `${approx && Math.round(v) !== v ? '≈ ' : ''}${f.format(Math.round(v))}`;
  };
  const parsePrice = () => {
    const digits = price.value.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  };
  function update() {
    const p = parsePrice();
    downOut.textContent = `${down.value}%`;
    monthsOut.textContent = months.value;
    [down, months].forEach((r) => r.style.setProperty('--fill', `${((r.value - r.min) / (r.max - r.min)) * 100}%`));
    const r = estimate(p, Number(down.value), Number(months.value));
    if (!r) { Object.values(outs).forEach((o) => { o.textContent = '—'; }); return; }
    outs.down.textContent = money(r.down, true);
    outs.rest.textContent = money(r.rest, true);
    outs.monthly.textContent = money(r.monthly, true);
    outs.monthly.animate?.([{ transform: 'translateY(4px)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  price.addEventListener('input', () => {
    // Keep the caret-friendly digit grouping simple: format on blur only.
    update();
  });
  price.addEventListener('blur', () => {
    const p = parsePrice();
    price.value = p ? new Intl.NumberFormat(LOC[getLang()]).format(p) : '';
  });
  [down, months].forEach((r) => r.addEventListener('input', update));
  form.addEventListener('submit', (e) => e.preventDefault());
  update();
  onLang(update);
}

export function initFaq() {
  const root = document.querySelector('[data-faq]');
  const open = new Set();
  function render() {
    root.innerHTML = '';
    faq.forEach((item, i) => {
      const id = `qa-${i}`;
      const wrap = document.createElement('div');
      wrap.className = `qa${open.has(i) ? ' is-open' : ''}`;
      wrap.innerHTML = `<h3><button type="button" class="qa__q" aria-expanded="${open.has(i)}" aria-controls="${id}" id="${id}-q"><span>${pick(item.q)}</span><span class="qa__icon" aria-hidden="true"></span></button></h3><div class="qa__a" id="${id}" role="region" aria-labelledby="${id}-q"><div><p>${pick(item.a)}</p></div></div>`;
      const btn = wrap.querySelector('button');
      const region = wrap.querySelector('.qa__a');
      region.inert = !open.has(i);
      btn.addEventListener('click', () => {
        const isOpen = !open.has(i);
        if (isOpen) open.add(i); else open.delete(i);
        wrap.classList.toggle('is-open', isOpen);
        btn.setAttribute('aria-expanded', String(isOpen));
        region.inert = !isOpen;
      });
      root.appendChild(wrap);
    });
  }
  render();
  onLang(render);
}
