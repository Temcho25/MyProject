/* Coordinate — "scattered prints" photo gallery.
   Scroll story inside a sticky stage:
     1. a pile of prints in the centre,
     2. the prints get thrown across the table (staggered, with a lift while flying),
     3. one by one each print lifts to near-fullscreen with a slow Ken Burns, then settles back,
     4. the collage keeps drifting gently.
   Tap any print → fullscreen lightbox (swipe / arrows / keys).
   Mounts into <section class="gal" id="gallery">. Data: data/photos.json. */

const T = {
  en: { eyebrow: "Gallery", hint: "Tap a photo to open", close: "Close", prev: "Previous photo", next: "Next photo", of: "of" },
  ru: { eyebrow: "Галерея", hint: "Нажмите на фото, чтобы открыть", close: "Закрыть", prev: "Предыдущее фото", next: "Следующее фото", of: "из" },
  ka: { eyebrow: "გალერეა", hint: "შეეხეთ ფოტოს გასადიდებლად", close: "დახურვა", prev: "წინა ფოტო", next: "შემდეგი ფოტო", of: "/" },
};
const lang = () => (T[document.documentElement.lang] ? document.documentElement.lang : "en");

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const eo = t => 1 - Math.pow(1 - t, 3);
const eio = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rnd = seed => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }; // deterministic 0..1
const pad2 = n => String(n).padStart(2, "0");
const srcsetOf = p => p.srcset.map(([u, w]) => `${u} ${w}w`).join(", ");

// Scroll budget in viewport heights
const VH_SCATTER = 60, VH_PER_PHOTO = 36, VH_TAIL = 40;

async function mount() {
  const root = document.getElementById("gallery");
  if (!root) return;
  let photos;
  try { photos = await (await fetch("data/photos.json")).json(); } catch (e) { return; }
  if (!photos.length) return;
  root.hidden = false;
  const N = photos.length;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.innerHTML = `
    <div class="gal-sticky">
      <div class="gal-table"><div class="gal-dim"></div></div>
      <div class="gal-head wrap"><div class="eyebrow gal-eyebrow"></div><div class="gal-count"><b>01</b><span>/ ${pad2(N)}</span></div></div>
      <div class="gal-cap wrap"><p></p></div>
      <div class="gal-hint"></div>
    </div>`;
  const sticky = root.querySelector(".gal-sticky"), table = root.querySelector(".gal-table"),
        dim = root.querySelector(".gal-dim"), capP = root.querySelector(".gal-cap p"), cap = root.querySelector(".gal-cap"),
        countB = root.querySelector(".gal-count b"), headEl = root.querySelector(".gal-head"), hint = root.querySelector(".gal-hint"), eyebrow = root.querySelector(".gal-eyebrow");

  // Prints
  const cards = photos.map((p, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "gp";
    b.innerHTML = `<span class="gp-in"><img alt="" decoding="async" draggable="false"></span>`;
    b.addEventListener("click", () => openLightbox(i, b));
    table.appendChild(b);
    const img = b.querySelector("img");
    return { el: b, img, inner: b.querySelector(".gp-in"), p, ar: p.w / p.h, i, z: -1,
             order: 0, rot: (rnd(i + 1) - .5) * 15, pileRot: (rnd(i + 7) - .5) * 22,
             pileX: (rnd(i + 13) - .5) * 26, pileY: (rnd(i + 19) - .5) * 20, depth: .9 + rnd(i + 23) * .22 };
  });
  // throw order: shuffled but deterministic
  cards.map(c => [rnd(c.i + 31), c]).sort((a, b) => a[0] - b[0]).forEach(([, c], k) => (c.order = k));

  // Load images only when the section gets close
  let loaded = false;
  const loadImgs = () => {
    if (loaded) return; loaded = true;
    cards.forEach(c => { c.img.sizes = sizesAttr(); c.img.srcset = srcsetOf(c.p); c.img.src = c.p.srcset[0][0]; });
  };
  const sizesAttr = () => "(orientation: portrait) 190vw, min(86vw, 125vh)";

  function setTexts() {
    const L = T[lang()];
    eyebrow.textContent = L.eyebrow; hint.textContent = L.hint;
    cards.forEach(c => { c.img.alt = c.p.alt?.[lang()] || ""; c.el.setAttribute("aria-label", c.img.alt || `${c.i + 1}`); });
    lbSetTexts();
  }

  /* ---------- layout (recomputed on resize) ---------- */
  let W = 0, H = 0, headClash = false;
  function layout() {
    W = sticky.clientWidth; H = sticky.clientHeight;
    const aspect = W / H, portrait = aspect < .85;
    const cols = portrait ? 3 : aspect > 1.9 ? 5 : 4, rows = Math.ceil(N / cols);
    const head = root.querySelector(".gal-head"), headBottom = head.offsetTop + head.offsetHeight;
    const top0 = Math.max(H * (portrait ? .15 : .16), headBottom + 10);
    const areaW = W * (portrait ? .98 : .9), areaH = Math.min(H * (portrait ? .74 : .72), H - top0 - Math.max(44, H * .1));
    const cw = areaW / cols, ch = areaH / rows;
    // Near-fullscreen size used when a print is lifted (element size = focus size → sharp images)
    const maxFW = W * (portrait ? .94 : .86), maxFH = H * (portrait ? .64 : .7);
    headClash = (H - maxFH) / 2 < headBottom + 6;
    const inset = Math.max(6, Math.min(14, Math.min(W, H) * .011));
    cards.forEach(c => {
      const k = c.i, col = k % cols, row = Math.floor(k / cols);
      const lastRowCount = N - (rows - 1) * cols, rowCols = row === rows - 1 ? lastRowCount : cols;
      const offset = (cols - rowCols) * cw / 2;
      const jx = (rnd(k + 41) - .5) * cw * .34, jy = (rnd(k + 47) - .5) * ch * .3;
      c.tx = (W - areaW) / 2 + offset + cw * (col + .5) + jx - W / 2;
      c.ty = top0 + ch * (row + .5) + jy - H / 2;
      let fw, fh;
      if (portrait) { fw = maxFW; fh = Math.min(maxFH, fw * 1.22); }   // tall frame on phones; the wide render pans inside it
      else { fw = Math.min(maxFW, maxFH * c.ar); fh = fw / c.ar; }
      c.fw = fw; c.fh = fh;
      const iw = fw - 2 * inset, ih = fh - 2 * inset;
      c.pan = portrait ? Math.max(0, ih * c.ar - iw) : 0;
      c.img.style.width = c.pan ? ih * c.ar + "px" : ""; c.img.style.maxWidth = c.pan ? "none" : "";
      c.img.style.transform = c.pan ? `translate3d(${-c.pan / 2}px,0,0)` : "";
      // print size on the table: fits its cell with some overlap
      const ear = fw / fh, pw = Math.min(cw * (portrait ? 1.08 : 1.12), ch * (portrait ? 1.06 : 1.18) * ear) * c.depth;
      c.ts = pw / fw;
      c.ps = Math.min(W * (portrait ? .56 : .3), H * .42 * ear) / fw; // size in the pile
      c.el.style.width = fw + "px"; c.el.style.height = fh + "px";
      c.el.style.marginLeft = -fw / 2 + "px"; c.el.style.marginTop = -fh / 2 + "px";
    });
    // section length
    const total = 100 + VH_SCATTER + N * VH_PER_PHOTO + VH_TAIL;
    root.style.height = total + "vh"; root.style.height = total + "svh";
  }

  /* ---------- scroll-driven frame ---------- */
  let active = false, raf = 0, sp = -1;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { loadImgs(); if (!active) { active = true; raf = requestAnimationFrame(frame); } }
    else { active = false; cancelAnimationFrame(raf); }
  }), { rootMargin: "60% 0px 60% 0px" });

  function progress() {
    const r = root.getBoundingClientRect(), span = r.height - H;
    return span > 0 ? clamp(-r.top / span) : 0;
  }

  let last = 0, focusedIdx = -1;
  function frame(now) {
    if (!active) return;
    const dt = Math.min(64, now - (last || now)); last = now;
    const p = progress();
    sp = sp < 0 ? p : lerp(sp, p, 1 - Math.pow(.0006, dt / 1000));
    if (Math.abs(sp - p) < 1e-4) sp = p;

    const span = VH_SCATTER + N * VH_PER_PHOTO + VH_TAIL;
    const P1 = VH_SCATTER / span, L = VH_PER_PHOTO / span, P2 = P1 + N * L;
    const s = clamp(sp / P1);                       // scatter progress
    let maxA = 0, top = -1;
    const t = now / 1000;

    cards.forEach(c => {
      // 1–2: pile → table
      const tt = eo(clamp((s - c.order * (.55 / N)) / .45));
      const flyLift = 1 + .28 * Math.sin(Math.PI * tt);
      const drift = (c.depth - 1) * (sp - .5) * W * .25;
      const fx = Math.sin(t * .35 + c.i * 1.7) * 4, fy = Math.cos(t * .3 + c.i * 2.3) * 4; // gentle float
      let x = lerp(c.pileX, c.tx + drift + fx * tt, tt);
      let y = lerp(c.pileY, c.ty + fy * tt, tt);
      let r = lerp(c.pileRot, c.rot, tt) + (1 - tt) * tt * 40 * (c.rot > 0 ? 1 : -1);
      let sc = lerp(c.ps, c.ts, tt) * flyLift;

      // 3: lift to near-fullscreen
      const u = (sp - P1) / L - c.i;
      const a = reduce ? 0 : eio(clamp((u + .18) / .36)) * (1 - eio(clamp((u - .82) / .36)));
      if (a > 0) {
        x = lerp(x, 0, a); y = lerp(y, 0, a); r = lerp(r, 0, a); sc = lerp(sc, 1, a);
        const k = clamp(u);
        if (c.pan) c.img.style.transform = `translate3d(${(-c.pan * (.5 + (c.i % 2 ? 1 : -1) * (k - .5) * .8)).toFixed(1)}px,0,0)`;
        else c.inner.style.transform = `scale(${1.03 + .09 * k}) translate3d(${(c.i % 2 ? -1 : 1) * (k - .5) * 3}%,${(k - .5) * -2}%,0)`;
        c.kb = true;
      } else if (c.kb) { c.inner.style.transform = ""; if (c.pan) c.img.style.transform = `translate3d(${-c.pan / 2}px,0,0)`; c.kb = false; }
      if (a > maxA) { maxA = a; top = c.i; }

      c.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${r.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      const z = a > 0 ? 200 + Math.round(a * 100) : (tt < 1 ? 100 - c.order : 10 + c.order);
      if (z !== c.z) { c.el.style.zIndex = z; c.z = z; }
      c.el.classList.toggle("lift", a > .5);
    });

    dim.style.opacity = (maxA * .78).toFixed(3);
    headEl.style.opacity = headClash ? (1 - maxA).toFixed(3) : "";
    if (top !== focusedIdx && maxA > .5) { focusedIdx = top; countB.textContent = pad2(top + 1); capP.textContent = cards[top].img.alt; }
    cap.style.opacity = clamp((maxA - .55) / .3).toFixed(3);
    cap.style.transform = `translate3d(0,${(1 - clamp((maxA - .55) / .3)) * 14}px,0)`;
    table.style.transform = `scale(${lerp(1, .95, eio(clamp((sp - P2) / (1 - P2))))})`;
    hint.style.opacity = (clamp((s - .9) / .1) * (1 - maxA)).toFixed(3);
    if (maxA <= .5 && sp < P1 + L * .3) countB.textContent = pad2(Math.max(1, Math.round(s * N)));

    raf = requestAnimationFrame(frame);
  }

  /* ---------- lightbox ---------- */
  let lb, lbImg, lbIdx = 0, lbOpener = null, lbCap, lbCount, lbTrack;
  function buildLightbox() {
    lb = document.createElement("div");
    lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.hidden = true;
    lb.innerHTML = `
      <div class="lb-track"><img class="lb-img" alt="" decoding="async" draggable="false"></div>
      <button class="lb-btn lb-close" type="button"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"/></svg></button>
      <button class="lb-btn lb-prev" type="button"><svg viewBox="0 0 24 24"><path d="M15 4 7 12l8 8"/></svg></button>
      <button class="lb-btn lb-next" type="button"><svg viewBox="0 0 24 24"><path d="m9 4 8 8-8 8"/></svg></button>
      <div class="lb-foot"><span class="lb-count"></span><p class="lb-cap"></p></div>`;
    document.body.appendChild(lb);
    lbImg = lb.querySelector(".lb-img"); lbCap = lb.querySelector(".lb-cap"); lbCount = lb.querySelector(".lb-count"); lbTrack = lb.querySelector(".lb-track");
    lb.querySelector(".lb-close").onclick = closeLightbox;
    lb.querySelector(".lb-prev").onclick = () => go(-1);
    lb.querySelector(".lb-next").onclick = () => go(1);
    lb.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });
    lb.addEventListener("keydown", e => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab") { // focus trap
        const f = [...lb.querySelectorAll("button")]; const i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    // swipe
    let sx = 0, sy = 0, dx = 0, id = null, horiz = null, downOnImg = false;
    lbTrack.addEventListener("pointerdown", e => { downOnImg = e.target === lbImg; id = e.pointerId; sx = e.clientX; sy = e.clientY; dx = 0; horiz = null; lbTrack.setPointerCapture(id); lbImg.style.transition = "none"; });
    lbTrack.addEventListener("pointermove", e => {
      if (e.pointerId !== id) return;
      dx = e.clientX - sx; const dy = e.clientY - sy;
      if (horiz === null && Math.hypot(dx, dy) > 8) horiz = Math.abs(dx) > Math.abs(dy);
      if (horiz) lbImg.style.transform = `translate3d(${dx}px,0,0)`;
      else if (horiz === false) { lbImg.style.transform = `translate3d(0,${Math.max(0, dy)}px,0)`; lb.style.setProperty("--lbo", 1 - clamp(dy / 400)); }
    });
    const end = e => {
      if (e.pointerId !== id) return; id = null;
      const dy = e.clientY - sy;
      lbImg.style.transition = ""; lb.style.setProperty("--lbo", 1);
      if (horiz && Math.abs(dx) > 60) go(dx < 0 ? 1 : -1, dx);
      else if (horiz === false && dy > 120) closeLightbox();
      else { lbImg.style.transform = ""; if (horiz === null && e.type === "pointerup" && !downOnImg) closeLightbox(); }
    };
    lbTrack.addEventListener("pointerup", end); lbTrack.addEventListener("pointercancel", end);
    lbSetTexts();
  }
  function lbSetTexts() {
    if (!lb) return; const L = T[lang()];
    lb.querySelector(".lb-close").setAttribute("aria-label", L.close);
    lb.querySelector(".lb-prev").setAttribute("aria-label", L.prev);
    lb.querySelector(".lb-next").setAttribute("aria-label", L.next);
    if (!lb.hidden) show(lbIdx, 0);
  }
  function show(i, from = 0) {
    lbIdx = (i + N) % N; const p = photos[lbIdx];
    lbImg.sizes = "100vw"; lbImg.srcset = srcsetOf(p); lbImg.src = p.full;
    lbImg.alt = p.alt?.[lang()] || ""; lbCap.textContent = lbImg.alt;
    lbCount.textContent = `${pad2(lbIdx + 1)} ${T[lang()].of} ${pad2(N)}`;
    lb.setAttribute("aria-label", lbImg.alt);
    // slide-in from the swipe direction
    lbImg.style.transition = "none";
    lbImg.style.transform = from ? `translate3d(${from > 0 ? -40 : 40}px,0,0)` : "scale(.97)";
    lbImg.style.opacity = "0";
    requestAnimationFrame(() => requestAnimationFrame(() => { lbImg.style.transition = ""; lbImg.style.transform = ""; lbImg.style.opacity = ""; }));
    [1, -1].forEach(d => { const q = photos[(lbIdx + d + N) % N]; const im = new Image(); im.sizes = "100vw"; im.srcset = srcsetOf(q); });
  }
  const go = (d, from) => show(lbIdx + d, from ?? -d);
  function openLightbox(i, opener) {
    if (!lb) buildLightbox();
    lbOpener = opener; lb.hidden = false; document.documentElement.classList.add("lb-open");
    show(i);
    requestAnimationFrame(() => lb.classList.add("on"));
    lb.querySelector(".lb-close").focus({ preventScroll: true });
  }
  function closeLightbox() {
    lb.classList.remove("on"); document.documentElement.classList.remove("lb-open");
    setTimeout(() => { lb.hidden = true; }, 280);
    lbOpener?.focus({ preventScroll: true });
  }

  /* ---------- boot ---------- */
  if (reduce) {
    root.classList.add("gal-static");
    loadImgs(); setTexts();
    cards.forEach(c => { c.el.style.aspectRatio = `${c.p.w} / ${c.p.h}`; });
  } else {
    layout(); setTexts();
    let rt = 0;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { const pw = W; layout(); if (pw !== W) cards.forEach(c => (c.img.sizes = sizesAttr())); }, 120); });
    io.observe(root);
  }
  addEventListener("coord:lang", setTexts);
  new MutationObserver(setTexts).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
