// Typography as motion: words are wrapped in masks, then grouped into the
// lines the browser actually laid out, so each line rises as one gesture
// (an editorial line reveal) with a slight lag between its words.

const wordRe = /\S+/g;

export function split(el) {
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  el.dataset.text = text;
  el.textContent = '';
  const frag = document.createDocumentFragment();
  const words = text.match(wordRe) || [];
  words.forEach((w, i) => {
    const outer = document.createElement('span');
    outer.className = 'w';
    const inner = document.createElement('span');
    inner.className = 'wi';
    inner.textContent = w;
    outer.appendChild(inner);
    frag.appendChild(outer);
    if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
  });
  el.appendChild(frag);
  el.classList.add('is-split');
  assignLines(el);
}

/** Group words by rendered line and set --li (line index) and --wi (word index in line). */
export function assignLines(el) {
  const ws = el.querySelectorAll('.w');
  let line = -1, lastTop = null, wi = 0;
  const base = Number(el.dataset.lineBase || 0);
  ws.forEach((w) => {
    const top = w.offsetTop;
    if (lastTop === null || Math.abs(top - lastTop) > 4) { line++; wi = 0; lastTop = top; }
    w.style.setProperty('--li', line + base);
    w.style.setProperty('--wi', wi++);
  });
  el.style.setProperty('--lines', line + 1);
}

export function splitAll(root = document) {
  root.querySelectorAll('[data-split]').forEach(split);
}

export function relineAll(root = document) {
  root.querySelectorAll('.is-split').forEach(assignLines);
}

// Reveal on entering the viewport. One-shot, except elements marked
// data-replay which can re-arm (used inside the hero's second phase).
let io;
export function observeReveals(root = document) {
  io ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  root.querySelectorAll('[data-reveal], [data-split]').forEach((el) => {
    if (el.closest('[data-hero-intro]')) return; // driven by the hero scene
    if (!el.classList.contains('is-in')) io.observe(el);
  });
}
