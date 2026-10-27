/* Coordinate — layout finder.
   Filters (rooms, area, floors, only available, sort) → layout cards → detail sheet
   (2D/3D plan, areas, free apartments, WhatsApp request, "walk through in 3D").
   Mounts into <section class="find" id="find">. Data: window.COORD.LAYOUTS + data/apartments.json,
   refreshed live from api.coordinate.ge when reachable. No prices are shown. */

const PHONE = "995596207474";
const T = {
  en: {
    eyebrow: "Layouts", h: "Find your layout.", rooms: "Rooms", area: "Area", floors: "Floors", onlyFree: "Only available",
    sort: "Sort", byArea: "Area ↑", byAreaDesc: "Area ↓", byFree: "Most available", reset: "Reset",
    found: n => `${n} ${n === 1 ? "layout" : "layouts"}`, none: "Nothing matches — try widening the filters.",
    roomsN: n => `${n} rooms`, ph: "Penthouse", free: n => `${n} available`, sold: "Sold out",
    total: "Total area", living: "Living area", balcony: "Balconies", bedrooms: "Bedrooms", floorsR: (a, b) => `Floors ${a}–${b}`,
    pick: "Available apartments", pickHint: "Choose an apartment to mention it in your request", noneFree: "All apartments of this layout are sold.",
    apt: "Apt.", fl: "fl.", send: "Send request", walk: "Walk through in 3D", close: "Close", m2: "m²",
    live: "Availability: live from coordinate.ge", snap: d => `Availability as of ${d}`,
    msg: (l, a) => `Hello! I'm interested in Coordinate: ${l}${a ? `, apartment ${a.apt} (floor ${a.floor})` : ""}.`,
    plan2d: "2D", plan3d: "3D", block: "Block A",
  },
  ru: {
    eyebrow: "Планировки", h: "Найдите свою планировку.", rooms: "Комнаты", area: "Площадь", floors: "Этажи", onlyFree: "Только свободные",
    sort: "Сортировка", byArea: "Площадь ↑", byAreaDesc: "Площадь ↓", byFree: "Больше свободных", reset: "Сбросить",
    found: n => `${n} ${plRu(n, "планировка", "планировки", "планировок")}`, none: "Ничего не найдено — расширьте фильтры.",
    roomsN: n => `${n} ${+n >= 5 ? "комнат" : "комнаты"}`, ph: "Пентхаус", free: n => `${n} ${plRu(n, "свободна", "свободны", "свободно")}`, sold: "Продано",
    total: "Общая площадь", living: "Жилая площадь", balcony: "Балконы", bedrooms: "Спальни", floorsR: (a, b) => `Этажи ${a}–${b}`,
    pick: "Свободные квартиры", pickHint: "Выберите квартиру, чтобы указать её в запросе", noneFree: "Все квартиры этой планировки проданы.",
    apt: "Кв.", fl: "эт.", send: "Отправить запрос", walk: "Прогулка в 3D", close: "Закрыть", m2: "м²",
    live: "Наличие: в реальном времени с coordinate.ge", snap: d => `Наличие на ${d}`,
    msg: (l, a) => `Здравствуйте! Интересует Coordinate: ${l}${a ? `, квартира ${a.apt} (этаж ${a.floor})` : ""}.`,
    plan2d: "2D", plan3d: "3D", block: "Блок A",
  },
  ka: {
    eyebrow: "გეგმარებები", h: "იპოვეთ თქვენი გეგმარება.", rooms: "ოთახები", area: "ფართი", floors: "სართულები", onlyFree: "მხოლოდ თავისუფალი",
    sort: "დალაგება", byArea: "ფართი ↑", byAreaDesc: "ფართი ↓", byFree: "მეტი თავისუფალი", reset: "გასუფთავება",
    found: n => `${n} გეგმარება`, none: "ვერაფერი მოიძებნა — გააფართოვეთ ფილტრები.",
    roomsN: n => `${n} ოთახი`, ph: "პენტჰაუსი", free: n => `${n} თავისუფალი`, sold: "გაყიდულია",
    total: "საერთო ფართი", living: "საცხოვრებელი ფართი", balcony: "აივნები", bedrooms: "საძინებელი", floorsR: (a, b) => `სართულები ${a}–${b}`,
    pick: "თავისუფალი ბინები", pickHint: "აირჩიეთ ბინა, რომ მოთხოვნაში მიუთითოთ", noneFree: "ამ გეგმარების ყველა ბინა გაყიდულია.",
    apt: "ბინა", fl: "სართ.", send: "მოთხოვნის გაგზავნა", walk: "3D დათვალიერება", close: "დახურვა", m2: "მ²",
    live: "ხელმისაწვდომობა: coordinate.ge-დან რეალურ დროში", snap: d => `ხელმისაწვდომობა ${d}-ის მდგომარეობით`,
    msg: (l, a) => `გამარჯობა! მაინტერესებს Coordinate: ${l}${a ? `, ბინა ${a.apt} (სართული ${a.floor})` : ""}.`,
    plan2d: "2D", plan3d: "3D", block: "ბლოკი A",
  },
};
function plRu(n, one, few, many) { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many; }
const lang = () => (T[document.documentElement.lang] ? document.documentElement.lang : "en");
const fmt = n => (Math.round(n * 10) / 10).toLocaleString(lang() === "en" ? "en-US" : lang() === "ru" ? "ru-RU" : "ka-GE");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const isPH = l => l.id.startsWith("ph");
const ROOM_KEYS = ["2", "3", "4", "5+"];
const roomKey = l => (+l.rooms >= 5 ? "5+" : l.rooms);

async function mount() {
  const root = document.getElementById("find");
  const LAYOUTS = window.COORD?.LAYOUTS;
  if (!root || !LAYOUTS) return;

  let apts = [], snapDate = "", live = false;
  try { const j = await (await fetch("data/apartments.json")).json(); apts = j.apartments; snapDate = j.snapshot; } catch (e) {}

  const AMIN = Math.floor(Math.min(...LAYOUTS.map(l => l.area))), AMAX = Math.ceil(Math.max(...LAYOUTS.map(l => l.area)));
  const FMIN = Math.min(...LAYOUTS.map(l => l.floors[0])), FMAX = Math.max(...LAYOUTS.map(l => l.floors[1]));
  const st = { rooms: new Set(), a0: AMIN, a1: AMAX, f0: FMIN, f1: FMAX, onlyFree: false, sort: "area" };

  root.innerHTML = `
    <div class="wrap">
      <div class="eyebrow" data-f="eyebrow"></div>
      <h2 class="h2 find-h" data-f="h"></h2>
      <form class="find-bar" onsubmit="return false">
        <fieldset class="fgrp f-rooms"><legend data-f="rooms"></legend><div class="chips" id="fRooms"></div></fieldset>
        <fieldset class="fgrp f-range"><legend><span data-f="area"></span><output id="fAreaOut"></output></legend>
          <div class="dual"><input type="range" id="fA0" min="${AMIN}" max="${AMAX}" step="1"><input type="range" id="fA1" min="${AMIN}" max="${AMAX}" step="1"><i class="dual-fill"></i></div></fieldset>
        <fieldset class="fgrp f-range"><legend><span data-f="floors"></span><output id="fFlOut"></output></legend>
          <div class="dual"><input type="range" id="fF0" min="${FMIN}" max="${FMAX}" step="1"><input type="range" id="fF1" min="${FMIN}" max="${FMAX}" step="1"><i class="dual-fill"></i></div></fieldset>
        <div class="fgrp f-opts">
          <label class="sw"><input type="checkbox" id="fFree"><i></i><span data-f="onlyFree"></span></label>
          <label class="sel-sort"><span class="vh" data-f="sort"></span><select id="fSort"><option value="area"></option><option value="areaDesc"></option><option value="free"></option></select></label>
          <button type="button" class="f-reset" id="fReset" data-f="reset"></button>
        </div>
      </form>
      <div class="find-meta"><span id="fCount" aria-live="polite"></span><span id="fSrc"></span></div>
      <div class="find-grid" id="fGrid"></div>
    </div>`;
  const $ = s => root.querySelector(s);
  const a0 = $("#fA0"), a1 = $("#fA1"), f0 = $("#fF0"), f1 = $("#fF1");
  a0.value = st.a0; a1.value = st.a1; f0.value = st.f0; f1.value = st.f1;

  const freeOf = (l, lo = st.f0, hi = st.f1) => apts.filter(a => a.type === l.id && a.status === "free" && a.floor >= lo && a.floor <= hi);

  function dualSync(x0, x1, fill, k0, k1) {
    let v0 = +x0.value, v1 = +x1.value;
    if (v0 > v1) { if (document.activeElement === x0) v0 = v1; else v1 = v0; x0.value = v0; x1.value = v1; }
    st[k0] = v0; st[k1] = v1;
    const mn = +x0.min, mx = +x0.max;
    fill.style.left = (v0 - mn) / (mx - mn) * 100 + "%"; fill.style.right = (mx - v1) / (mx - mn) * 100 + "%";
  }
  const syncA = () => { dualSync(a0, a1, a0.parentNode.querySelector(".dual-fill"), "a0", "a1"); $("#fAreaOut").textContent = `${st.a0}–${st.a1} ${T[lang()].m2}`; };
  const syncF = () => { dualSync(f0, f1, f0.parentNode.querySelector(".dual-fill"), "f0", "f1"); $("#fFlOut").textContent = `${st.f0}–${st.f1}`; };
  [a0, a1].forEach(x => x.addEventListener("input", () => { syncA(); renderList(); }));
  [f0, f1].forEach(x => x.addEventListener("input", () => { syncF(); renderList(); }));
  // keep the thumb that was grabbed on top when both overlap
  [[a0, a1], [f0, f1]].forEach(([x, y]) => [x, y].forEach(el => el.addEventListener("pointerdown", () => { x.style.zIndex = el === x ? 3 : 2; y.style.zIndex = el === y ? 3 : 2; })));
  $("#fFree").addEventListener("change", e => { st.onlyFree = e.target.checked; renderList(); });
  $("#fSort").addEventListener("change", e => { st.sort = e.target.value; renderList(); });
  $("#fRooms").addEventListener("click", e => {
    const b = e.target.closest("[data-r]"); if (!b) return;
    const r = b.dataset.r; st.rooms.has(r) ? st.rooms.delete(r) : st.rooms.add(r); renderBar(); renderList();
  });
  $("#fReset").addEventListener("click", () => {
    st.rooms.clear(); st.onlyFree = false; st.sort = "area";
    a0.value = AMIN; a1.value = AMAX; f0.value = FMIN; f1.value = FMAX; $("#fFree").checked = false; $("#fSort").value = "area";
    syncA(); syncF(); renderBar(); renderList();
  });
  $("#fGrid").addEventListener("click", e => { const c = e.target.closest("[data-l]"); if (c) openSheet(c.dataset.l, c); });

  function layoutName(l) { const L = T[lang()]; return isPH(l) ? `${L.ph} · ${L.roomsN(l.rooms)}` : L.roomsN(l.rooms); }

  function renderBar() {
    const L = T[lang()];
    root.querySelectorAll("[data-f]").forEach(el => { const v = L[el.dataset.f]; if (typeof v === "string") el.textContent = v; });
    $("#fRooms").innerHTML = ROOM_KEYS.map(r => `<button type="button" class="chip" data-r="${r}" aria-pressed="${st.rooms.has(r)}">${r}</button>`).join("");
    const o = $("#fSort").options; o[0].textContent = L.byArea; o[1].textContent = L.byAreaDesc; o[2].textContent = L.byFree;
    a0.setAttribute("aria-label", `${L.area} min`); a1.setAttribute("aria-label", `${L.area} max`);
    f0.setAttribute("aria-label", `${L.floors} min`); f1.setAttribute("aria-label", `${L.floors} max`);
    syncA(); syncF();
    $("#fSrc").textContent = live ? L.live : snapDate ? L.snap(snapDate.split("-").reverse().join(".")) : "";
  }

  function renderList() {
    const L = T[lang()];
    let list = LAYOUTS.filter(l =>
      (!st.rooms.size || st.rooms.has(roomKey(l))) &&
      l.area >= st.a0 - .05 && l.area <= st.a1 + .05 &&
      l.floors[0] <= st.f1 && l.floors[1] >= st.f0 &&
      (!st.onlyFree || freeOf(l).length));
    const cnt = new Map(list.map(l => [l.id, freeOf(l).length]));
    list.sort(st.sort === "free" ? (x, y) => cnt.get(y.id) - cnt.get(x.id) || x.area - y.area
            : st.sort === "areaDesc" ? (x, y) => y.area - x.area : (x, y) => x.area - y.area);
    $("#fCount").textContent = L.found(list.length);
    $("#fGrid").innerHTML = list.length ? list.map((l, i) => {
      const n = cnt.get(l.id);
      return `<button type="button" class="fcard" data-l="${l.id}" style="--i:${i}">
        <span class="fcard-plan"><img src="plans/thumbs/${l.id}.webp" alt="" loading="lazy" decoding="async"></span>
        <span class="fcard-body">
          <span class="fcard-top"><b class="fcard-area">${fmt(l.area)}<small> ${L.m2}</small></b><span class="badge${n ? "" : " out"}">${n ? L.free(n) : L.sold}</span></span>
          <span class="fcard-name">${esc(layoutName(l))}</span>
          <span class="fcard-sub">${L.living} ${fmt(l.living)} · ${L.balcony} ${fmt(l.balcony)} ${L.m2}</span>
          <span class="fcard-fl">${L.floorsR(l.floors[0], l.floors[1])}</span>
        </span></button>`;
    }).join("") : `<p class="find-none">${L.none}</p>`;
  }

  /* ---------- detail sheet ---------- */
  let sheet, cur = null, opener = null, view = "2d", chosen = null;
  function buildSheet() {
    sheet = document.createElement("div");
    sheet.className = "fs"; sheet.hidden = true;
    sheet.innerHTML = `<div class="fs-back"></div>
      <div class="fs-panel" role="dialog" aria-modal="true" aria-labelledby="fsTitle">
        <button type="button" class="fs-x"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"/></svg></button>
        <div class="fs-plan"><div class="fs-tg" role="group"><button type="button" data-v="2d">2D</button><button type="button" data-v="3d">3D</button></div><img alt="" decoding="async"></div>
        <div class="fs-info">
          <div class="eyebrow fs-eb"></div>
          <h3 class="fs-title" id="fsTitle"></h3>
          <dl class="fs-areas"></dl>
          <div class="fs-pick"><h4></h4><p class="fs-hint"></p><div class="fs-apts"></div></div>
          <div class="fs-actions">
            <a class="btn fs-send" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.6 14.1c-.2.7-1.4 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1a16 16 0 0 1-1.6-.6 12.6 12.6 0 0 1-4.9-4.3c-.4-.5-.9-1.4-.9-2.3s.5-1.4.7-1.6c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .5.4l.7 1.7c.1.1.1.3 0 .4l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.7.8c.3.1.4.2.5.3.1.2.1.7-.1 1.4Z"/></svg><span></span></a>
            <button type="button" class="btn ghost fs-walk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/></svg><span></span></button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(sheet);
    sheet.querySelector(".fs-back").onclick = closeSheet;
    sheet.querySelector(".fs-x").onclick = closeSheet;
    sheet.querySelector(".fs-tg").onclick = e => { const b = e.target.closest("[data-v]"); if (b) { view = b.dataset.v; fillSheet(); } };
    sheet.querySelector(".fs-apts").onclick = e => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      chosen = chosen === b.dataset.a ? null : b.dataset.a; fillSheet();
    };
    sheet.querySelector(".fs-walk").onclick = () => {
      const id = cur.id; closeSheet(true);
      window.dispatchEvent(new CustomEvent("coord:walk", { detail: { layout: id } }));
    };
    sheet.addEventListener("keydown", e => {
      if (e.key === "Escape") { e.preventDefault(); closeSheet(); }
      if (e.key === "Tab") {
        const f = [...sheet.querySelectorAll("button,a[href]")].filter(x => x.offsetParent !== null);
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    // swipe down on the grab area (phones) closes the sheet
    const panel = sheet.querySelector(".fs-panel"); let y0 = null, dy = 0;
    panel.addEventListener("touchstart", e => { y0 = panel.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
    panel.addEventListener("touchmove", e => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy > 0) panel.style.transform = `translate3d(0,${dy}px,0)`; }, { passive: true });
    panel.addEventListener("touchend", () => { if (y0 === null) return; panel.style.transform = ""; if (dy > 110) closeSheet(); y0 = null; });
  }
  function fillSheet() {
    if (!cur) return;
    const L = T[lang()], l = cur, free = freeOf(l, 1, 99);
    const img = sheet.querySelector(".fs-plan img"), src = view === "3d" ? l.plan3d : l.plan2d;
    if (img.getAttribute("src") !== src) img.src = src;
    img.alt = `${layoutName(l)}, ${fmt(l.area)} ${L.m2}`;
    sheet.querySelector(".fs-plan").classList.toggle("is3d", view === "3d");
    sheet.querySelectorAll(".fs-tg [data-v]").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === view));
    sheet.querySelector(".fs-eb").textContent = `${L.block} · ${L.floorsR(l.floors[0], l.floors[1])}`;
    sheet.querySelector(".fs-title").textContent = `${layoutName(l)} · ${fmt(l.area)} ${L.m2}`;
    sheet.querySelector(".fs-areas").innerHTML =
      [[L.total, l.area], [L.living, l.living], [L.balcony, l.balcony]].map(([k, v]) => `<div><dt>${k}</dt><dd>${fmt(v)} <small>${L.m2}</small></dd></div>`).join("") +
      `<div><dt>${L.bedrooms}</dt><dd>${l.bedrooms}</dd></div>`;
    sheet.querySelector(".fs-pick h4").textContent = `${L.pick} · ${free.length}`;
    sheet.querySelector(".fs-hint").textContent = free.length ? L.pickHint : L.noneFree;
    if (chosen && !free.some(a => a.apt === chosen)) chosen = null;
    sheet.querySelector(".fs-apts").innerHTML = free.map(a =>
      `<button type="button" class="chip" data-a="${a.apt}" aria-pressed="${a.apt === chosen}">${L.apt} ${a.apt}<small>${a.floor} ${L.fl}</small></button>`).join("");
    const ap = free.find(a => a.apt === chosen);
    const send = sheet.querySelector(".fs-send");
    send.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(L.msg(`${layoutName(l)}, ${fmt(l.area)} ${L.m2}`, ap))}`;
    send.querySelector("span").textContent = L.send;
    sheet.querySelector(".fs-walk span").textContent = L.walk;
    sheet.querySelector(".fs-x").setAttribute("aria-label", L.close);
  }
  function openSheet(id, from) {
    if (!sheet) buildSheet();
    cur = LAYOUTS.find(l => l.id === id); opener = from; view = "2d"; chosen = null;
    fillSheet();
    sheet.hidden = false; document.documentElement.classList.add("fs-open");
    sheet.querySelector(".fs-panel").scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add("on")));
    sheet.querySelector(".fs-x").focus({ preventScroll: true });
    // warm the other plan image
    const im = new Image(); im.src = cur.plan3d;
  }
  function closeSheet(noFocus) {
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove("on"); document.documentElement.classList.remove("fs-open");
    setTimeout(() => { sheet.hidden = true; }, 320);
    if (noFocus !== true) opener?.focus({ preventScroll: true });
  }

  /* ---------- live availability ---------- */
  async function refresh() {
    const api = window.COORD?.API || "https://api.coordinate.ge/api/";
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 7000);
    try {
      const r = await fetch(api + "project/1/plan", { signal: ctl.signal, headers: { Accept: "application/json" } });
      if (!r.ok) return;
      const j = await r.json(), S = { 1: "free", 2: "reserved", 3: "sold" }, out = [];
      j.blocks.forEach(b => {
        const blk = (b.name || "").trim().charAt(0) || "A";
        (b.floors || []).forEach(f => {
          const fl = parseInt(f.name, 10);
          (f.apartments || []).forEach(a => {
            const apt = String(a.apt), type = fl >= 29 ? (apt.endsWith("01") ? "ph1" : "ph2") : apt.slice(-2);
            out.push({ apt, block: blk, floor: fl, type, bedrooms: a.bedrooms, area: a.total_area, status: S[a.status?.id] || "sold" });
          });
        });
      });
      if (out.length) { apts = out; live = true; renderBar(); renderList(); if (sheet && !sheet.hidden) fillSheet(); }
    } catch (e) { /* keep the snapshot */ } finally { clearTimeout(to); }
  }

  const rerender = () => { renderBar(); renderList(); if (sheet && !sheet.hidden) fillSheet(); };
  renderBar(); renderList();
  addEventListener("coord:lang", rerender);
  new MutationObserver(rerender).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  // fetch live data once the section is near
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); refresh(); } }, { rootMargin: "100% 0px" });
  io.observe(root);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
