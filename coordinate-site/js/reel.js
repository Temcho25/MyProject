/* Coordinate — cinematic photo reel (#gallery).
   Scroll-driven: each render opens from a small centred window to the full frame while the previous one sinks back
   and dims; slow push-in inside every frame; large numbered captions; segmented progress; tap opens a lightbox.
   Phones in portrait get a full-width frame (~62% of the height) instead of full bleed, so the renders are never
   blown up past their native resolution. Data: data/reel.json. */
const root = document.getElementById("gallery");
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const VH_PER = 62, VH_TAIL = 40;
const lang = () => (["ka", "en", "ru"].includes(document.documentElement.lang) ? document.documentElement.lang : "en");
const T = {
  en: { eyebrow: "Gallery", tap: "Tap to view full screen", close: "Close", prev: "Previous", next: "Next" },
  ru: { eyebrow: "Галерея", tap: "Нажмите, чтобы открыть", close: "Закрыть", prev: "Назад", next: "Вперёд" },
  ka: { eyebrow: "გალერეა", tap: "შეეხეთ სრულ ეკრანზე სანახავად", close: "დახურვა", prev: "წინა", next: "შემდეგი" },
};
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, eo = t => 1 - Math.pow(1 - t, 3);
const pad = n => String(n).padStart(2, "0");

let P = [], slides = [], stage, capNum, capTitle, segs, active = -1, vis = false;
let sy = scrollY, ssy = scrollY, W = innerWidth, H = innerHeight;
const srcset = p => p.srcset.map(([u, w]) => `${u} ${w}w`).join(", ");

async function boot() {
  if (!root) return;
  try { P = await (await fetch("data/reel.json")).json(); } catch (e) { return; }
  if (!P.length) return;
  root.hidden = false;
  root.classList.add("reel");
  root.innerHTML = `
    <div class="reel-stage" id="reelStage">
      ${P.map((p, i) => `<figure class="reel-slide" data-i="${i}"><img alt="" decoding="async" sizes="100vw" data-srcset="${srcset(p)}" data-src="${p.full}"></figure>`).join("")}
      <div class="reel-vignette"></div>
      <div class="reel-top wrap"><div class="eyebrow" id="reelEyebrow"></div></div>
      <div class="reel-cap wrap">
        <div class="reel-num"><span id="reelNum">01</span><small>/ ${pad(P.length)}</small></div>
        <div class="reel-title"><span id="reelTitle"></span></div>
        <div class="reel-tap" id="reelTap"></div>
      </div>
      <div class="reel-bar wrap">${P.map((_, i) => `<button aria-label="${i + 1}" data-go="${i}"><i></i></button>`).join("")}</div>
    </div>`;
  stage = root.querySelector("#reelStage");
  slides = [...root.querySelectorAll(".reel-slide")].map((el, i) => ({ el, img: el.querySelector("img"), i, loaded: false }));
  capNum = root.querySelector("#reelNum"); capTitle = root.querySelector("#reelTitle");
  segs = [...root.querySelectorAll(".reel-bar i")];
  relang();
  if (REDUCE) { root.classList.add("static"); slides.forEach(load); setActive(0); return; }
  resize();
  addEventListener("resize", resize);
  addEventListener("scroll", () => { sy = scrollY; }, { passive: true });
  new IntersectionObserver(([e]) => { const was = vis; vis = e.isIntersecting; if (vis && !was) { ssy = sy = scrollY; requestAnimationFrame(frame); } }, { rootMargin: "300px" }).observe(root);
  stage.addEventListener("click", e => {
    const go = e.target.closest("[data-go]");
    if (go) { jump(+go.dataset.go); return; }
    if (e.target.closest(".reel-slide, .reel-vignette, .reel-cap")) openLb(Math.max(0, active));
  });
}

function load(s) {
  if (s.loaded) return; s.loaded = true;
  s.img.srcset = s.img.dataset.srcset; s.img.src = s.img.dataset.src;
}
function resize() {
  W = innerWidth; H = innerHeight;
  root.style.height = (100 + P.length * VH_PER + VH_TAIL) + "svh";
}
function prog() {
  const r = root.getBoundingClientRect(), span = r.height - H;
  return clamp((-(r.top + (sy - ssy))) / span);
}
function jump(i) {
  const span = root.offsetHeight - H, per = VH_PER / (P.length * VH_PER + VH_TAIL);
  scrollTo({ top: root.offsetTop + span * per * (i + .6), behavior: "smooth" });
}
// final frame: full bleed on landscape screens; on portrait phones a full-width band ~62% of the height
function finalRect() {
  if (W / H < .8) { const h = Math.min(H * .62, W * 1.25); return { t: (H - h) * .44, b: (H - h) * .56, l: 0, r: 0 }; }
  return { t: 0, b: 0, l: 0, r: 0 };
}

function frame() {
  if (!vis) return;
  requestAnimationFrame(frame);
  ssy = lerp(ssy, sy, .14); if (Math.abs(ssy - sy) < .3) ssy = sy;
  const N = P.length, perF = VH_PER / (N * VH_PER + VH_TAIL), pos = prog() / perF;
  const F = finalRect(), portrait = W / H < .8, cur = clamp(Math.floor(pos + .45), 0, N - 1);
  const sw = portrait ? .58 : .34, sh = portrait ? .3 : .38;
  for (const s of slides) {
    const d = pos - s.i;                                    // <0 waiting · -1..0 opening · 0..1 holding · >1 sinking
    if (d > -1.6 && d < 2.4) load(s);
    if (d < -1 || d > 2.2) { if (s.el.style.visibility !== "hidden") s.el.style.visibility = "hidden"; continue; }
    s.el.style.visibility = "visible";
    const open = s.i === 0 ? 1 : eio(clamp(d + 1));          // the first frame starts open
    const t = lerp(H * (1 - sh) / 2, F.t, open), b = lerp(H * (1 - sh) / 2, F.b, open);
    const l = lerp(W * (1 - sw) / 2, F.l, open), r = lerp(W * (1 - sw) / 2, F.r, open);
    const rad = lerp(14, portrait ? 4 : 0, open);
    const sink = eio(clamp(d - .1));                         // the next frame opening over this one
    s.el.style.clipPath = `inset(${t.toFixed(1)}px ${r.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${rad.toFixed(1)}px)`;
    s.el.style.transform = `scale(${(1 - sink * .08).toFixed(4)})`;
    s.el.style.filter = sink > .001 ? `brightness(${(1 - sink * .62).toFixed(3)})` : "none";
    s.el.style.zIndex = 10 + s.i;
    const life = clamp((d + 1) / 3.2);                       // slow push-in and drift inside the frame
    s.img.style.transform = `scale(${(1.16 - .14 * eo(life)).toFixed(4)}) translate3d(0,${((.5 - life) * 2.5).toFixed(2)}%,0)`;
  }
  if (cur !== active) setActive(cur);
  const fill = clamp(pos + .45 - cur);
  segs.forEach((sg, i) => { sg.style.transform = `scaleX(${i < cur ? 1 : i === cur ? fill.toFixed(3) : 0})`; });
}
function setActive(i) {
  active = i;
  const p = P[i];
  capNum.textContent = pad(i + 1);
  root.classList.remove("swap"); void root.offsetWidth; root.classList.add("swap");
  capTitle.textContent = (p.alt && (p.alt[lang()] || p.alt.en)) || "";
}
function relang() {
  if (!root || !P.length || !stage) return;
  const L = T[lang()];
  root.querySelector("#reelEyebrow").textContent = L.eyebrow;
  root.querySelector("#reelTap").textContent = L.tap;
  if (active >= 0) setActive(active);
  slides.forEach((s, i) => { s.img.alt = P[i].alt[lang()] || P[i].alt.en; });
  if (lb && lb.classList.contains("on")) lbRender();
}

/* ---------- lightbox ---------- */
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
  im.sizes = "100vw"; im.srcset = srcset(p); im.src = p.full; im.alt = p.alt[lang()] || p.alt.en;
  lb.querySelector(".rlb-cap b").textContent = `${pad(lbI + 1)} / ${pad(P.length)}`;
  lb.querySelector(".rlb-cap span").textContent = im.alt;
  lb.querySelector(".rlb-x").setAttribute("aria-label", L.close);
  lb.querySelector(".rlb-p").setAttribute("aria-label", L.prev); lb.querySelector(".rlb-n").setAttribute("aria-label", L.next);
}
function step(k) { lbI = (lbI + k + P.length) % P.length; lbRender(); }
function closeLb() { lb.classList.remove("on"); document.documentElement.classList.remove("lb-open"); if (lbOpener && lbOpener.focus) lbOpener.focus(); }

addEventListener("coord:lang", relang);
new MutationObserver(relang).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
boot();
