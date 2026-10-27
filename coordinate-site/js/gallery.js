/* Coordinate — light gallery (#gallery): six renders, no scroll-jacking.
   Desktop: an airy editorial layout; each photo is revealed once with a soft wipe when it comes into view.
   Phones: a native swipe rail (scroll-snap) with a counter. Tap opens a simple full-screen viewer.
   Nothing is downloaded until the section gets close. Data: data/gallery.json. */
const root = document.getElementById("gallery");
const lang = () => (["ka", "en", "ru"].includes(document.documentElement.lang) ? document.documentElement.lang : "en");
const T = {
  en: { eyebrow: "Gallery", title: "Life at Coordinate", close: "Close", prev: "Previous", next: "Next", swipe: "Swipe to see more" },
  ru: { eyebrow: "Галерея", title: "Жизнь в Coordinate", close: "Закрыть", prev: "Назад", next: "Вперёд", swipe: "Листайте, чтобы увидеть больше" },
  ka: { eyebrow: "გალერეა", title: "ცხოვრება Coordinate-ში", close: "დახურვა", prev: "წინა", next: "შემდეგი", swipe: "გადაფურცლეთ მეტის სანახავად" },
};
const pad = n => String(n).padStart(2, "0");
let P = [];
const srcset = p => p.srcset.map(([u, w]) => `${u} ${w}w`).join(", ");
const altOf = p => (p.alt && (p.alt[lang()] || p.alt.en)) || "";

async function boot() {
  try { P = await (await fetch("data/gallery.json")).json(); } catch (e) { return; }
  if (!P.length) return;
  root.classList.add("glite");
  root.innerHTML = `
    <div class="wrap">
      <div class="gl-head"><div><div class="eyebrow" data-g="eyebrow"></div><h2 class="h2" data-g="title"></h2></div>
        <div class="gl-count" aria-hidden="true"><b id="glNow">01</b> / ${pad(P.length)}</div></div>
      <div class="gl-grid" id="glGrid">
        ${P.map((p, i) => `<figure class="gl-item gl-${i}" data-i="${i}" style="--d:${(i % 3) * .12}s">
            <button class="gl-open" type="button"><img loading="lazy" decoding="async" alt=""
              sizes="(min-width: 801px) ${i === 0 ? 58 : 40}vw, 84vw" srcset="${srcset(p)}" src="${p.srcset[1] ? p.srcset[1][0] : p.full}"
              width="${p.w}" height="${p.h}"></button>
            <figcaption><span>${pad(i + 1)}</span><em></em></figcaption></figure>`).join("")}
      </div>
      <div class="gl-hint" data-g="swipe"></div>
    </div>`;
  relang();
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
  root.querySelectorAll(".gl-item").forEach(f => io.observe(f));
  const grid = root.querySelector("#glGrid"), now = root.querySelector("#glNow");
  grid.addEventListener("click", e => { const f = e.target.closest(".gl-item"); if (f) openLb(+f.dataset.i); });
  // phone rail: the counter follows the swipe
  grid.addEventListener("scroll", () => {
    const items = grid.children, mid = grid.scrollLeft + grid.clientWidth / 2;
    let best = 0, bd = 1e9;
    for (let i = 0; i < items.length; i++) { const d = Math.abs(items[i].offsetLeft + items[i].offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } }
    now.textContent = pad(best + 1);
  }, { passive: true });
}
function relang() {
  if (!root.classList.contains("glite")) return;
  const L = T[lang()];
  root.querySelectorAll("[data-g]").forEach(el => { el.textContent = L[el.dataset.g]; });
  root.querySelectorAll(".gl-item").forEach((f, i) => {
    const a = altOf(P[i]); f.querySelector("img").alt = a; f.querySelector("em").textContent = a; f.querySelector(".gl-open").setAttribute("aria-label", a);
  });
  if (lb && lb.classList.contains("on")) lbRender();
}

/* ---------- full-screen viewer ---------- */
let lb = null, lbI = 0, lbOpener = null;
function openLb(i) {
  lbOpener = document.activeElement;
  if (!lb) {
    lb = document.createElement("div"); lb.className = "rlb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    lb.innerHTML = `<img alt=""><div class="rlb-cap"><b></b><span></span></div>
      <button class="rlb-x" data-a="x">✕</button><button class="rlb-p" data-a="p">‹</button><button class="rlb-n" data-a="n">›</button>`;
    document.body.appendChild(lb);
    lb.addEventListener("click", e => { const a = e.target.closest("[data-a]")?.dataset.a; if (a === "x" || e.target === lb) closeLb(); else if (a === "p") step(-1); else if (a === "n") step(1); });
    let x0 = null, y0 = 0;
    lb.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1); else if (dy > 90) closeLb(); x0 = null; });
    addEventListener("keydown", e => { if (!lb.classList.contains("on")) return;
      if (e.key === "Escape") closeLb(); else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1); });
  }
  lbI = i; lbRender(); lb.classList.add("on"); document.documentElement.classList.add("lb-open");
  lb.querySelector(".rlb-x").focus();
}
function lbRender() {
  const p = P[lbI], L = T[lang()], im = lb.querySelector("img");
  im.sizes = "100vw"; im.srcset = srcset(p); im.src = p.full; im.alt = altOf(p);
  lb.querySelector(".rlb-cap b").textContent = `${pad(lbI + 1)} / ${pad(P.length)}`;
  lb.querySelector(".rlb-cap span").textContent = im.alt;
  lb.querySelector(".rlb-x").setAttribute("aria-label", L.close);
  lb.querySelector(".rlb-p").setAttribute("aria-label", L.prev); lb.querySelector(".rlb-n").setAttribute("aria-label", L.next);
}
function step(k) { lbI = (lbI + k + P.length) % P.length; lbRender(); }
function closeLb() { lb.classList.remove("on"); document.documentElement.classList.remove("lb-open"); if (lbOpener && lbOpener.focus) lbOpener.focus(); }

if (root) {
  addEventListener("coord:lang", relang);
  new MutationObserver(relang).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); boot(); } }, { rootMargin: "1200px" }).observe(root);
}
