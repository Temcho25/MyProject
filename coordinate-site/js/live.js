/* Coordinate — "live" blocks:
   1. Construction progress (#progress): the developer's monthly updates, fetched live from api.coordinate.ge
      (snapshot fallback in data/progress.json), drone photos, video, countdown to completion.
   2. Marquee band of key facts above the partners, speed follows scrolling.
   3. Contact: Tbilisi clock with open/closed status and a lazy dark map. */
const API = (window.COORD && window.COORD.API) || "https://api.coordinate.ge/api/";
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COMPLETION = new Date("2028-12-31T18:00:00+04:00");          // "Q4 2028"
const lang = () => (["ka", "en", "ru"].includes(document.documentElement.lang) ? document.documentElement.lang : "en");

const T = {
  en: { eyebrow: "Construction", title: "Built in real time.", until: "until completion · Q4 2028", upd: "Construction update",
        d: "days", h: "hours", m: "min", s: "sec", live: "Live from coordinate.ge", snap: d => `Updates as of ${d}`,
        video: "Watch the video", more: "Read more", less: "Show less", all: "All updates",
        marquee: ["Ortachala, Old Tbilisi", "3 round towers", "Up to 31 floors", "1 ha park", "11 000 m² of infrastructure", "Completion Q4 2028", "Bank of Georgia", "Coordinate by Keystone"],
        now: "Now in Tbilisi", open: m => `Open · closes in ${m}`, closed: t => `Closed · opens ${t}`, at10: "at 10:00", tmr: "tomorrow at 10:00",
        map: "Open in Google Maps", hm: (h, m) => h ? `${h} h ${m} min` : `${m} min` },
  ru: { eyebrow: "Строительство", title: "Строится прямо сейчас.", until: "до сдачи · IV кв. 2028", upd: "Ход строительства",
        d: "дн.", h: "ч", m: "мин", s: "сек", live: "Онлайн с coordinate.ge", snap: d => `Данные на ${d}`,
        video: "Смотреть видео", more: "Читать дальше", less: "Свернуть", all: "Все отчёты",
        marquee: ["Ортачала, Старый Тбилиси", "3 круглые башни", "До 31 этажа", "Парк 1 га", "11 000 м² инфраструктуры", "Сдача IV кв. 2028", "Банк Грузии", "Coordinate by Keystone"],
        now: "Сейчас в Тбилиси", open: m => `Открыто · закроется через ${m}`, closed: t => `Закрыто · откроется ${t}`, at10: "в 10:00", tmr: "завтра в 10:00",
        map: "Открыть в Google Картах", hm: (h, m) => h ? `${h} ч ${m} мин` : `${m} мин` },
  ka: { eyebrow: "მშენებლობა", title: "შენდება ჩვენს თვალწინ.", until: "დასრულებამდე · 2028 წლის IV კვ.", upd: "მშენებლობის მიმდინარეობა",
        d: "დღე", h: "საათი", m: "წთ", s: "წმ", live: "პირდაპირ coordinate.ge-დან", snap: d => `მონაცემები ${d}-ის მდგომარეობით`,
        video: "ვიდეოს ნახვა", more: "სრულად ნახვა", less: "შეკეცვა", all: "ყველა ანგარიში",
        marquee: ["ორთაჭალა, ძველი თბილისი", "3 მრგვალი კოშკი", "31-მდე სართული", "1 ჰა პარკი", "11 000 მ² ინფრასტრუქტურა", "დასრულება — 2028 წლის IV კვ.", "საქართველოს ბანკი", "Coordinate by Keystone"],
        now: "ახლა თბილისში", open: m => `ღიაა · დახურვამდე ${m}`, closed: t => `დახურულია · გაიხსნება ${t}`, at10: "10:00-ზე", tmr: "ხვალ 10:00-ზე",
        map: "Google Maps-ში გახსნა", hm: (h, m) => h ? `${h} სთ ${m} წთ` : `${m} წთ` },
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ===================== 1. CONSTRUCTION PROGRESS ===================== */
const prog = document.getElementById("progress");
const updates = { en: null, ka: null, ru: null }, isLive = {};
let snapDate = "", snapLoaded = false, sel = 0, slide = 0, slideT = 0;

// The API body is HTML: keep only the text of paragraphs and list items (no markup from outside gets in).
function bodyHTML(html) {
  const doc = new DOMParser().parseFromString(html || "", "text/html"), out = [];
  doc.body.querySelectorAll("p, li").forEach(n => {
    const t = n.textContent.replace(/\s+/g, " ").trim(); if (!t) return;
    out.push(n.tagName === "LI" ? `<li>${esc(t)}</li>` : `<p>${esc(t)}</p>`);
  });
  return out.join("").replace(/(<li>.*?<\/li>)+/g, m => `<ul>${m}</ul>`);
}
/* Titles from the API mix languages ("Сентябрь 2026 | Construction Update") and sometimes disagree between
   languages, so the displayed title is rebuilt: reporting month = majority of the months named in the titles of
   the same update across all loaded languages, falling back to the publish date. */
const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  ruGen: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  ka: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
};
const MONTH_RE = [
  /jan|янв|იანვ/i, /feb|фев|თებ/i, /mar|мар|მარტ/i, /apr|апр|აპრ/i, /\bmay\b|ма[йя]|მაის/i, /jun|июн|ივნ/i,
  /jul|июл|ივლ/i, /aug|авг|აგვ/i, /sep|сен|სექ/i, /oct|окт|ოქტ/i, /nov|ноя|ნოე/i, /dec|дек|დეკ/i,
];
function parseMonth(s) {
  s = String(s || "");
  for (let i = 0; i < 12; i++) if (MONTH_RE[i].test(s)) return i;
  return -1;
}
function parseDate(s) {                                     // "15 September, 2026" / "15 сентября, 2026" / "15 სექტემბერი, 2026"
  const d = (String(s).match(/\b(\d{1,2})\b/) || [])[1], y = (String(s).match(/(20\d\d)/) || [])[1];
  return { d: d ? +d : 0, m: parseMonth(s), y: y ? +y : 0 };
}
function reportMonth(u) {
  const votes = new Array(12).fill(0);
  for (const k of ["ka", "en", "ru"]) {
    const x = (updates[k] || []).find(v => String(v.id) === String(u.id));
    const m = x ? parseMonth(String(x.name).split("|")[0]) : -1;
    if (m >= 0) votes[m] += k === "ka" ? 1.1 : 1;           // ka titles have been the consistent ones
  }
  const best = votes.indexOf(Math.max(...votes));
  const pd = parseDate(u.date);
  const y = (String(u.name).match(/(20\d\d)/) || [])[1] || pd.y;
  return { m: votes[best] > 0 ? best : pd.m, y };
}
function updTitle(u) {
  const l = lang(), { m, y } = reportMonth(u);
  return m >= 0 ? `${MONTHS[l][m]} ${y} · ${T[l].upd}` : u.name;
}
function fmtDate(s) {
  const l = lang(), { d, m, y } = parseDate(s);
  if (m < 0 || !y) return s;
  return l === "ru" ? `${d} ${MONTHS.ruGen[m]} ${y}` : l === "ka" ? `${d} ${MONTHS.ka[m]}, ${y}` : `${d} ${MONTHS.en[m]} ${y}`;
}
function updBody(u) {
  const b = bodyHTML(u.body);
  if (b) return b;
  const en = (updates.en || []).find(v => String(v.id) === String(u.id));
  return en ? bodyHTML(en.body) : "";
}
const ytId = u => (String(u).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/) || [])[1];

async function loadUpdates(l) {
  if (!snapLoaded) {
    snapLoaded = true;
    try {
      const s = await (await fetch("data/progress.json")).json(); snapDate = s.snapshot;
      for (const k of ["en", "ka", "ru"]) if (!updates[k]) updates[k] = s[k];
      render();
    } catch (e) {}
  }
  if (isLive[l]) return;
  try {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 7000);
    const r = await fetch(API + "project/1/progresses", { headers: { Accept: "application/json", "Accept-Language": l }, signal: ctl.signal });
    clearTimeout(to);
    if (!r.ok) return;
    const d = await r.json();
    if (Array.isArray(d) && d.length) {
      updates[l] = d.map(x => ({ id: x.id, name: x.name, body: x.body, video: x.video || "", date: x.created_at,
        gallery: (x.gallery || []).map(g => ({ medium: g.medium, large: g.large, alt: g.alt || "" })) }));
      isLive[l] = true; render();
    }
  } catch (e) {}
}

function countdown() {
  const ms = Math.max(0, COMPLETION - Date.now());
  return [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
}
const pad = n => String(n).padStart(2, "0");

function render() {
  if (!prog) return;
  const L = T[lang()], list = updates[lang()] || [], u = list[sel] || list[0];
  const [d, h, m, s] = countdown(), gal = u ? u.gallery : [], vid = u && ytId(u.video), cur = gal.length ? slide % gal.length : 0;
  prog.innerHTML = `
  <div class="wrap">
    <div class="pg-head">
      <div><div class="eyebrow">${esc(L.eyebrow)}</div><h2 class="h2">${esc(L.title)}</h2></div>
      <div class="pg-count" role="timer" aria-label="${esc(L.until)}">
        <div class="pg-cells">
          <span><b data-c="0">${d}</b><small>${esc(L.d)}</small></span>
          <span><b data-c="1">${pad(h)}</b><small>${esc(L.h)}</small></span>
          <span><b data-c="2">${pad(m)}</b><small>${esc(L.m)}</small></span>
          <span><b data-c="3">${pad(s)}</b><small>${esc(L.s)}</small></span>
        </div>
        <div class="pg-until">${esc(L.until)}</div>
      </div>
    </div>
    ${u ? `
    <article class="pg-card">
      <div class="pg-media" id="pgMedia">
        ${gal.length ? gal.map((g, i) => `<img src="${esc(g.large || g.medium)}" alt="${esc(g.alt || updTitle(u))}" loading="lazy" decoding="async"${i === cur ? ' class="on"' : ""}>`).join("") : `<div class="pg-noimg"></div>`}
        ${gal.length > 1 ? `<div class="pg-dots">${gal.map((_, i) => `<button aria-label="${i + 1}" data-s="${i}"${i === cur ? ' class="on"' : ""}></button>`).join("")}</div>` : ""}
        ${vid ? `<button class="pg-play" data-v="${vid}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>${esc(L.video)}</span></button>` : ""}
      </div>
      <div class="pg-text">
        <div class="pg-meta"><span class="pg-live${isLive[lang()] ? "" : " snap"}"><i></i>${esc(isLive[lang()] ? L.live : L.snap(snapDate.split("-").reverse().join(".")))}</span><span>${esc(fmtDate(u.date))}</span></div>
        <h3>${esc(updTitle(u))}</h3>
        <div class="pg-body" id="pgBody">${updBody(u)}</div>
        <button class="pg-more" id="pgMore">${esc(L.more)}</button>
        ${list.length > 1 ? `<div class="pg-list"><div class="k">${esc(L.all)}</div>${list.map((x, i) =>
          `<button data-u="${i}" aria-pressed="${i === (list[sel] ? sel : 0)}"><span>${esc(fmtDate(x.date))}</span>${esc(updTitle(x))}</button>`).join("")}</div>` : ""}
      </div>
    </article>` : ""}
  </div>`;
  const body = prog.querySelector("#pgBody"), more = prog.querySelector("#pgMore");
  if (body && more) {
    requestAnimationFrame(() => { if (body.scrollHeight <= body.clientHeight + 4) more.hidden = true; });
    more.onclick = () => { const o = body.classList.toggle("open"); more.textContent = o ? L.less : L.more; };
  }
}
function showSlide() {
  const imgs = prog.querySelectorAll(".pg-media img"), dots = prog.querySelectorAll(".pg-dots button");
  if (!imgs.length) return;
  imgs.forEach((im, i) => im.classList.toggle("on", i === slide % imgs.length));
  dots.forEach((d, i) => d.classList.toggle("on", i === slide % imgs.length));
}

if (prog) {
  prog.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.u != null) { sel = +b.dataset.u; slide = 0; render(); }
    else if (b.dataset.s != null) { slide = +b.dataset.s; showSlide(); }
    else if (b.dataset.v) {
      prog.querySelector("#pgMedia").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(b.dataset.v)}?autoplay=1&rel=0&playsinline=1"
        title="video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
      clearInterval(slideT); slideT = 0;
    }
  });
  // countdown and slideshow tick only while the section is on screen
  let tick = 0;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      loadUpdates(lang());
      if (!tick) tick = setInterval(() => {
        const v = countdown();
        prog.querySelectorAll("[data-c]").forEach(b => { const i = +b.dataset.c, t = i ? pad(v[i]) : String(v[0]); if (b.textContent !== t) b.textContent = t; });
      }, 1000);
      if (!slideT && !REDUCE) slideT = setInterval(() => { slide++; showSlide(); }, 4500);
    } else { clearInterval(tick); tick = 0; clearInterval(slideT); slideT = 0; }
  }, { rootMargin: "300px" }).observe(prog);
  render();
}

/* ===================== 2. MARQUEE ===================== */
const mq = document.getElementById("marquee");
let mqX = 0, mqVel = 0, lastY = scrollY, mqOn = false, mqW = 0, mqLast = 0;
function renderMarquee() {
  if (!mq) return;
  const words = T[lang()].marquee.map(w => `<span>${esc(w)}</span><i aria-hidden="true">✦</i>`).join("");
  mq.innerHTML = `<div class="mq-row"><div class="mq-track">${words}${words}</div></div>
                  <div class="mq-row alt" aria-hidden="true"><div class="mq-track">${words}${words}</div></div>`;
  mqW = mq.querySelector(".mq-track").scrollWidth / 2;
}
function mqLoop(now) {
  if (!mqOn) { mqLast = 0; return; }
  const dt = Math.min(50, now - (mqLast || now)); mqLast = now;
  const dy = scrollY - lastY; lastY = scrollY;
  mqVel += (dy * .8 - mqVel) * .12;                              // scrolling pushes the band
  if (!REDUCE) mqX -= .045 * dt + mqVel;
  if (mqW) { mqX %= mqW; if (mqX > 0) mqX -= mqW; }
  const [a, b] = mq.querySelectorAll(".mq-track");
  if (a) a.style.transform = `translate3d(${mqX}px,0,0)`;
  if (b) b.style.transform = `translate3d(${-mqW - mqX}px,0,0)`;
  requestAnimationFrame(mqLoop);
}
if (mq) {
  renderMarquee();
  new IntersectionObserver(([e]) => { const was = mqOn; mqOn = e.isIntersecting; if (mqOn && !was) { lastY = scrollY; requestAnimationFrame(mqLoop); } }, { rootMargin: "100px" }).observe(mq);
  addEventListener("resize", () => { const t = mq.querySelector(".mq-track"); if (t) mqW = t.scrollWidth / 2; });
}

/* ===================== 3. CONTACT: clock + map ===================== */
const openEl = document.getElementById("openState");
function tbilisiNow() { const d = new Date(); return new Date(d.getTime() + d.getTimezoneOffset() * 6e4 + 4 * 36e5); } // UTC+4, no DST
function renderClock() {
  if (!openEl) return;
  const L = T[lang()], t = tbilisiNow(), h = t.getHours() + t.getMinutes() / 60, open = h >= 10 && h < 18;
  let status;
  if (open) { const left = Math.round((18 - h) * 60); status = L.open(L.hm(Math.floor(left / 60), left % 60)); }
  else status = L.closed(h < 10 ? L.at10 : L.tmr);
  openEl.classList.toggle("closed", !open);
  let live = openEl.parentElement.querySelector(".c-now");
  if (!live) { live = document.createElement("div"); live.className = "c-now"; openEl.parentElement.appendChild(live); }
  live.innerHTML = `${esc(L.now)} <b>${pad(t.getHours())}<em>:</em>${pad(t.getMinutes())}</b><br><span>${esc(status)}</span>`;
}
if (openEl) { renderClock(); setInterval(renderClock, 20000); }

const contactWrap = document.querySelector("#contact .wrap");
let mapLink = null;
if (contactWrap) {
  const box = document.createElement("div"); box.className = "c-map";
  box.innerHTML = `<div class="c-map-frame" id="cMap"></div><a class="c-map-link" href="https://www.google.com/maps?q=41.675250,44.827056" target="_blank" rel="noopener"></a>`;
  contactWrap.appendChild(box); mapLink = box.querySelector(".c-map-link");
  new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return; o.disconnect();
    box.querySelector("#cMap").innerHTML = `<iframe title="Coordinate — map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="https://maps.google.com/maps?q=41.675250,44.827056&z=16&hl=${lang()}&output=embed"></iframe><span class="c-pin"><i></i>Coordinate</span>`;
  }, { rootMargin: "400px" }).observe(box);
}

/* ===================== language ===================== */
let lastLang = "";
function relang() {
  const l = lang(); if (l === lastLang) return; lastLang = l;
  render(); renderMarquee(); renderClock();
  if (mapLink) mapLink.textContent = T[l].map + " ↗";
  if (prog && snapLoaded) loadUpdates(l);
}
relang();
addEventListener("coord:lang", relang);
new MutationObserver(relang).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
