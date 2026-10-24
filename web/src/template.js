// Renders the full page for one language at build time (and on every dev request).
import { copy } from './content/copy.js';
import { site } from './content/site.js';
import { media } from './content/media.js';
import { plan } from './content/plots.js';
import { topography } from './lib/topo.js';
import { locationMap, sitePlan, streetSection, plateSvg, insetPoints } from './lib/drawings.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Words wrapped in masks for editorial line reveals.
const words = (text, cls = 'w') =>
  esc(text)
    .split(' ')
    .map((w, i) => `<span class="${cls}" style="--wi:${i}"><span>${w}</span></span>`)
    .join(' ');

const arrow = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>`;
const arrowDown = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15m-6-6 6 6 6-6"/></svg>`;
const external = `<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`;

function picture(m, lang, cls, eager = false, sizes = '100vw') {
  if (!m) return '';
  return `<img class="${cls}" src="${esc(m.src)}" ${m.srcset ? `srcset="${esc(m.srcset)}" sizes="${sizes}"` : ''} width="${m.width}" height="${m.height}" alt="${esc(m.alt?.[lang] ?? '')}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

let topoCache;
function topoLayers() {
  if (topoCache) return topoCache;
  topoCache = {
    far: topography({ seed: 3, levels: 10, freq: 1.3, basin: 0.6, nx: 64, ny: 40, octaves: 2 }),
    mid: topography({ seed: 7, levels: 18 }),
    contact: topography({ seed: 11, levels: 12, freq: 1.8, basin: 0.8, nx: 72, ny: 45, octaves: 2, lake: [0.72, 0.55] }),
  };
  return topoCache;
}

function heroTopo() {
  const { far, mid } = topoLayers();
  const farSvg = `<svg class="topo topo--far" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    ${far.lines.map((l) => `<path d="${l.d}"/>`).join('')}
  </svg>`;
  const midSvg = `<svg class="topo topo--mid" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <path class="topo__lake" d="${mid.lake}"/>
    ${mid.lines.map((l, i) => `<path class="${l.major ? 'is-major' : ''}" style="--li:${l.level}" pathLength="1" d="${l.d}"/>`).join('')}
  </svg>`;
  // Survey grid and bearing ring: the nearest plane.
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i * 5 * Math.PI) / 180;
    const r1 = 300;
    const r2 = i % 18 === 0 ? 278 : i % 2 === 0 ? 288 : 293;
    return `<line x1="${(Math.sin(a) * r1).toFixed(1)}" y1="${(-Math.cos(a) * r1).toFixed(1)}" x2="${(Math.sin(a) * r2).toFixed(1)}" y2="${(-Math.cos(a) * r2).toFixed(1)}"/>`;
  }).join('');
  const near = `<svg class="topo topo--near" viewBox="-800 -500 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <g class="near__grid">${Array.from({ length: 17 }, (_, i) => `<line x1="${-800 + i * 100}" y1="-500" x2="${-800 + i * 100}" y2="500"/>`).join('')}${Array.from({ length: 11 }, (_, i) => `<line x1="-800" y1="${-500 + i * 100}" x2="800" y2="${-500 + i * 100}"/>`).join('')}</g>
    <g class="near__crosses">${Array.from({ length: 16 * 10 }, (_, k) => {
      const i = k % 16, j = Math.floor(k / 16);
      return (i + j) % 3 === 0 ? `<path d="M${-750 + i * 100} ${-454 + j * 100}h8m-4-4v8"/>` : '';
    }).join('')}</g>
    <g class="near__bearing"><circle r="300"/><circle r="252" class="thin"/>${ticks}
      <text y="-318" text-anchor="middle">N</text><text x="322" y="5" text-anchor="middle">E</text><text y="332" text-anchor="middle">S</text><text x="-322" y="5" text-anchor="middle">W</text>
    </g>
  </svg>`;
  // 24-plot cluster that grows into the neighbourhood plan.
  const [vx, vy, vw, vh] = plan.viewBox;
  const cluster = `<svg class="hero__site" viewBox="${vx} ${vy} ${vw} ${vh}" aria-hidden="true" focusable="false">
    ${plan.roads.map((r) => `<rect class="site__road" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`).join('')}
    ${plan.plots.map((p) => `<polygon class="site__plot" style="--i:${p.id}" points="${insetPoints(p.pts, 1.4)}"/>`).join('')}
  </svg>`;
  const { contact } = topoLayers();
  const contactSvg = `<svg class="topo topo--mid" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <path class="topo__lake" d="${contact.lake}"/>
    ${contact.lines.map((l) => `<path class="${l.major ? 'is-major' : ''}" d="${l.d}"/>`).join('')}
  </svg>`;
  return { farSvg, midSvg, near, cluster, contactSvg };
}

export function renderHead(lang) {
  const t = copy[lang];
  const path = lang === 'ka' ? '/' : '/en/';
  return `
    <title>${esc(t.meta.title)}</title>
    <meta name="description" content="${esc(t.meta.description)}">
    <link rel="canonical" href="${site.url}${path}">
    <link rel="alternate" hreflang="ka" href="${site.url}/">
    <link rel="alternate" hreflang="en" href="${site.url}/en/">
    <link rel="alternate" hreflang="x-default" href="${site.url}/">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${esc(t.meta.title)}">
    <meta property="og:description" content="${esc(t.meta.description)}">
    <meta property="og:locale" content="${t.meta.locale}">
    <meta property="og:url" content="${site.url}${path}">
    <meta property="og:image" content="${site.url}/og.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#16336A">
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: lang === 'ka' ? 'ორიენტირი ლისი' : 'Orientiri Lisi',
      description: t.meta.description,
      address: { '@type': 'PostalAddress', addressLocality: 'Tbilisi', addressCountry: 'GE' },
      telephone: site.phones[0].display,
      url: `${site.url}${path}`,
    })}</script>`;
}

export function renderBody(lang) {
  const t = copy[lang];
  const other = t.nav.lang;
  const topo = heroTopo();
  const L = t.location.labels;
  const brand = `<span class="brand__mark" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18.5"/><path d="M20 4v6M20 30v6M4 20h6M30 20h6"/><path class="brand__needle" d="M20 9l4 11-4 11-4-11z"/></svg></span><span class="brand__name"><span>${lang === 'ka' ? 'ორიენტირი' : 'Orientiri'}</span><span>${lang === 'ka' ? 'ლისი' : 'Lisi'}</span></span>`;

  const navLinks = t.nav.items.map(([h, l]) => `<li><a href="${h}">${esc(l)}</a></li>`).join('');

  const statement = t.intro.statement
    .map((part) =>
      typeof part === 'string'
        ? words(part, 'rw')
        : `<span class="rw rw--num"><span><em class="num">${esc(part.n)}</em> ${esc(part.u)}</span><svg class="num__rule" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M0 4H100M0 0V8M100 0V8"/></svg></span>`,
    )
    .join(' ');

  const plates = t.drawings.plates;
  const P = { ...t.drawings.labels, planCopy: t.plots };
  const pad = (n) => String(n).padStart(2, '0');
  const reel = media.reel
    .map((m, i) => `<figure class="reel__frame" style="--k:${i}">${picture(m, lang, 'reel__img', false)}</figure>`)
    .join('');
  // Grid sizes: wide shots take ~60% of the viewport on desktop, the rest ~40%.
  const shotSizes = ['(min-width: 900px) 60vw, 100vw', '(min-width: 900px) 34vw, 100vw', '(min-width: 900px) 42vw, 100vw', '(min-width: 900px) 42vw, 100vw', '100vw', '(min-width: 900px) 50vw, 100vw'];
  const shots = media.grid
    .map((m, i) => `<figure class="shot shot--${i}" data-reveal>
      <button class="shot__open" type="button" data-lightbox="${i}" aria-label="${esc(t.views.open)}: ${esc(m.alt?.[lang] ?? '')}">
        <span class="shot__frame">${picture(m, lang, 'shot__img', false, shotSizes[i] ?? '100vw')}</span>
      </button>
      <figcaption><span class="shot__n">${pad(media.reel.length + i + 1)}</span>${esc(m.alt?.[lang] ?? '')}</figcaption>
    </figure>`)
    .join('');
  const plateItems = plates.map(
    (p, i) => `<figure class="plate plate--${p.id}" data-reveal style="--d:${i % 3}">
      <button class="plate__open" type="button" data-lightbox="${media.grid.length + i}" aria-label="${esc(t.drawings.open)}: ${esc(p.t)}">
        <span class="plate__art">${plateSvg(p.id, p.t, P)}</span>
      </button>
      <figcaption><span class="plate__n">${String(i + 1).padStart(2, '0')}</span><strong>${esc(p.t)}</strong><span>${esc(p.s)}</span></figcaption>
    </figure>`,
  );

  const plotOptions = plan.plots.map((p) => `<option value="${p.id}">${esc(t.plots.plot)} ${String(p.id).padStart(2, '0')}</option>`).join('');

  return `
<a class="skip" href="#main">${esc(t.skip)}</a>
<div class="progress" aria-hidden="true"><span></span></div>

<header class="nav" data-nav>
  <a class="brand" href="${lang === 'ka' ? '/' : '/en/'}" aria-label="${esc(t.nav.home)}">${brand}</a>
  <nav class="nav__links" aria-label="${esc(t.nav.menu)}"><ul>${navLinks}</ul></nav>
  <div class="nav__actions">
    <a class="nav__lang" href="${other.href}" hreflang="${other.hreflang}" lang="${other.hreflang}" data-lang-switch><span aria-hidden="true">${esc(other.short)}</span><span class="sr">${esc(other.label)}</span></a>
    <a class="btn btn--nav" href="#plots">${esc(t.nav.cta)}</a>
    <button class="nav__burger" type="button" aria-haspopup="dialog" aria-controls="drawer" aria-expanded="false" data-drawer-open>
      <span class="nav__burger-lines" aria-hidden="true"><span></span><span></span></span><span class="sr">${esc(t.nav.menu)}</span>
    </button>
  </div>
</header>

<dialog class="drawer" id="drawer" aria-label="${esc(t.nav.menu)}">
  <div class="drawer__inner">
    <div class="drawer__top">
      <span class="brand brand--drawer">${brand}</span>
      <button class="drawer__close" type="button" data-drawer-close><span class="sr">${esc(t.nav.close)}</span><span aria-hidden="true" class="drawer__x"></span></button>
    </div>
    <nav aria-label="${esc(t.nav.menu)}"><ol class="drawer__links">${t.nav.items.map(([h, l], i) => `<li style="--i:${i}"><a href="${h}" data-drawer-link><span class="drawer__n">${String(i + 1).padStart(2, '0')}</span>${esc(l)}</a></li>`).join('')}<li style="--i:${t.nav.items.length}"><a href="#contact" data-drawer-link><span class="drawer__n">${String(t.nav.items.length + 1).padStart(2, '0')}</span>${esc(t.nav.contact)}</a></li></ol></nav>
    <div class="drawer__foot">
      <a class="btn btn--light" href="#plots" data-drawer-link>${esc(t.nav.cta)} ${arrow}</a>
      <a class="drawer__tel" href="${site.phones[0].href}">${site.phones[0].display}</a>
      <a class="drawer__lang" href="${other.href}" hreflang="${other.hreflang}" lang="${other.hreflang}" data-lang-switch>${esc(other.label)}</a>
    </div>
  </div>
</dialog>

<main id="main">

<!-- 01 HERO -->
<section class="hero" id="top" data-theme="dark" data-scene="hero" aria-labelledby="hero-title">
  <div class="hero__stage">
    ${media.hero ? `<div class="hero__photo">${picture(media.hero, lang, 'hero__img', true)}</div>` : ''}
    <div class="hero__layer hero__layer--far" data-depth="far">${topo.farSvg}</div>
    <div class="hero__layer hero__layer--mid" data-depth="mid">${topo.midSvg}</div>
    <div class="hero__layer hero__layer--near" data-depth="near">${topo.near}</div>
    <div class="hero__layer hero__layer--site" data-depth="site">${topo.cluster}</div>
    <div class="hero__vignette" aria-hidden="true"></div>

    <div class="hero__content">
      <p class="eyebrow hero__eyebrow"><span class="dot" aria-hidden="true"></span>${esc(t.hero.eyebrow)}</p>
      <h1 class="hero__title" id="hero-title">
        ${t.hero.title.map((line, i) => `<span class="hero__line" style="--li:${i}"><span>${esc(line)}</span></span>`).join('')}
      </h1>
      <p class="hero__lead">${esc(t.hero.lead)}</p>
      <div class="hero__ctas">
        <a class="btn btn--primary" href="#plots">${esc(t.hero.primary)} ${arrow}</a>
        <a class="btn btn--ghost" href="#place">${esc(t.hero.secondary)}</a>
      </div>
    </div>

    <dl class="hero__meta" aria-label="${esc(t.hero.bearing)}">
      <div><dt>${esc(t.hero.bearing)}</dt><dd>${site.lake.lat} · ${site.lake.lng}</dd></div>
      <div><dt>${esc(t.hero.families)}</dt><dd class="hero__count">24</dd></div>
    </dl>
    <a class="hero__scroll" href="#place"><span>${esc(t.hero.scroll)}</span><span class="hero__scroll-line" aria-hidden="true"></span></a>
    <div class="hero__wipe" aria-hidden="true"></div>
  </div>
</section>

<!-- 02 INTRO -->
<section class="intro" id="place" data-theme="light" aria-labelledby="intro-title">
  <div class="wrap">
    <p class="kicker" data-reveal>${esc(t.intro.kicker)}</p>
    <h2 class="sr" id="intro-title">${esc(t.nav.items[0][1])}</h2>
    <p class="intro__statement" data-scene="read">${statement}</p>
    <div class="intro__grid">
      <div class="intro__body" data-reveal>${t.intro.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      <dl class="intro__facts">
        ${t.intro.facts
          .map(
            (f, i) => `<div class="fact" data-reveal style="--d:${i}">
          <dt>${esc(f.l)}</dt>
          <dd>${f.pre ? `<span class="fact__pre">${esc(f.pre)}</span>` : ''}<span class="fact__n">${esc(f.n)}</span><span class="fact__u">${esc(f.u)}</span><span class="fact__ruler" aria-hidden="true">${Array.from({ length: 21 }, (_, k) => `<i style="--k:${k}"${k % 5 === 0 ? ' class="major"' : ''}></i>`).join('')}</span></dd>
        </div>`,
          )
          .join('')}
      </dl>
    </div>
  </div>
</section>

<!-- 02 VIEWS -->
<section class="views" id="views" data-theme="dark" data-scene="views" aria-labelledby="views-title">
  <div class="views__reel" data-reel>
    <div class="views__pin">
      ${reel}
      <div class="views__head wrap" data-reel-head>
        <p class="kicker">${esc(t.views.kicker)}</p>
        <h2 class="views__title" id="views-title">${esc(t.views.title)}</h2>
      </div>
      <p class="reel__cap wrap" aria-hidden="true"><span class="reel__count"><span data-reel-n>01</span> / ${pad(media.photos.length)}</span><span class="reel__text" data-reel-cap>${esc(media.reel[0]?.alt?.[lang] ?? '')}</span></p>
    </div>
  </div>
  <div class="wrap views__body">
    <p class="views__lead" data-reveal>${esc(t.views.lead)}</p>
    <div class="views__grid">${shots}</div>
    <p class="views__note" data-reveal>${esc(t.views.note)}</p>
  </div>
</section>

<!-- 03 LOCATION -->
<section class="location" id="location" data-theme="light" data-tone="stone" aria-labelledby="loc-title">
  <div class="wrap location__head">
    <p class="kicker" data-reveal>${esc(t.location.kicker)}</p>
    <h2 class="h2" id="loc-title" data-reveal data-split>${words(t.location.title)}</h2>
  </div>
  <div class="location__grid">
    <div class="location__map" data-locmap data-step="0">
      <div class="location__map-inner">${locationMap(L)}</div>
      <p class="location__note">${esc(t.location.note)} <a href="${site.links.map}" target="_blank" rel="noopener">${esc(t.location.map)} ${external}</a></p>
    </div>
    <ol class="location__steps">
      ${t.location.steps
        .map(
          (s, i) => `<li class="lstep" data-lstep="${i}">
        <span class="lstep__k">${esc(s.k)}</span>
        <h3 class="lstep__t">${esc(s.t)}</h3>
        <p class="lstep__p">${esc(s.p)}</p>
      </li>`,
        )
        .join('')}
    </ol>
  </div>
</section>

<!-- 04 PLOTS -->
<section class="plots" id="plots" data-theme="dark" data-scene="plots" aria-labelledby="plots-title">
  <div class="wrap plots__head">
    <p class="kicker" data-reveal>${esc(t.plots.kicker)}</p>
    <h2 class="h2" id="plots-title" data-reveal data-split>${words(t.plots.title)}</h2>
    <p class="plots__lead" data-reveal>${esc(t.plots.lead)}</p>
  </div>
  <div class="plots__grid wrap">
    <div class="plots__stage">
      <div class="plots__plan" data-plan>${sitePlan(t.plots)}</div>
    </div>
    <aside class="plots__panel" data-plot-panel>
      <p class="sr" aria-live="polite" data-plot-live></p>
      <label class="field field--dark plots__select">
        <span class="field__label">${esc(t.plots.select)}</span>
        <select data-plot-select><option value="">${esc(t.plots.selectNone)}</option>${plotOptions}</select>
      </label>
      <div class="panel__empty" data-panel-empty>
        <p class="panel__empty-t">${esc(t.plots.empty)}</p>
        <p class="panel__empty-s">${esc(t.plots.emptyHint)}</p>
      </div>
      <div class="panel__detail" data-panel-detail hidden>
        <p class="panel__label">${esc(t.plots.plot)}</p>
        <p class="panel__id" data-panel-id>—</p>
        <dl class="panel__rows">
          <div><dt>${esc(t.plots.area)}</dt><dd data-panel-area>${esc(t.plots.areaFrom)}</dd></div>
          <div><dt>${esc(t.plots.status)}</dt><dd data-panel-status><span class="status status--unknown">${esc(t.plots.statuses.unknown)}</span></dd></div>
        </dl>
        <p class="panel__label">${esc(t.plots.included)}</p>
        <ul class="panel__incl">${t.plots.includedList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <a class="btn btn--primary btn--block" href="#contact" data-plot-inquire>${esc(t.plots.inquire)} ${arrow}</a>
      </div>
      <div class="panel__legend">
        <p class="panel__label">${esc(t.plots.legend)}</p>
        <ul>
          <li><span class="sw sw--available" aria-hidden="true"></span>${esc(t.plots.statuses.available)}</li>
          <li><span class="sw sw--sold" aria-hidden="true"></span>${esc(t.plots.statuses.sold)}</li>
          <li><span class="sw sw--selected" aria-hidden="true"></span>${esc(t.plots.plot)} — ✓</li>
          <li><span class="sw sw--road" aria-hidden="true"></span>${esc(t.plots.road)}</li>
        </ul>
      </div>
      <p class="panel__honest">${esc(t.plots.honest)} <a href="${site.links.plots}" target="_blank" rel="noopener">${esc(t.plots.official)} ${external}</a></p>
    </aside>
  </div>
</section>

<!-- 05 INFRASTRUCTURE -->
<section class="infra" id="infrastructure" data-theme="light" aria-labelledby="infra-title">
  <div class="wrap infra__head">
    <p class="kicker" data-reveal>${esc(t.infra.kicker)}</p>
    <h2 class="h2" id="infra-title" data-reveal data-split>${words(t.infra.title)}</h2>
    <p class="infra__lead" data-reveal>${esc(t.infra.lead)}</p>
    <p class="infra__status" data-reveal><span class="status-dot" aria-hidden="true"></span>${esc(t.infra.status)}</p>
  </div>
  <div class="infra__track" data-scene="section">
    <div class="infra__sticky">
      <div class="infra__scroller" tabindex="0" aria-label="${esc(t.infra.section.diagram)}">
        <div class="infra__canvas">${streetSection(t.infra.section)}</div>
      </div>
      <p class="infra__hint" aria-hidden="true">${esc(t.infra.hint)} ${arrow}</p>
      <div class="infra__bar" aria-hidden="true"><span></span></div>
    </div>
  </div>
  <div class="wrap">
    <ul class="spec">
      ${t.infra.items
        .map(
          ([k, h, p], i) => `<li class="spec__row" data-reveal style="--d:${i % 2}">
        <span class="spec__n">${String(i + 1).padStart(2, '0')}</span>
        <span class="spec__icon" aria-hidden="true">${specIcon(k)}</span>
        <h3 class="spec__t">${esc(h)}</h3>
        <p class="spec__p">${esc(p)}</p>
      </li>`,
        )
        .join('')}
    </ul>
  </div>
</section>

<!-- 06 DRAWINGS -->
<section class="drawings" id="drawings" data-theme="dark" data-tone="graphite" aria-labelledby="draw-title">
  <div class="wrap drawings__head">
    <p class="kicker" data-reveal>${esc(t.drawings.kicker)}</p>
    <h2 class="h2" id="draw-title" data-reveal data-split>${words(t.drawings.title)}</h2>
    <p class="drawings__lead" data-reveal>${esc(t.drawings.lead)} <a href="${site.links.gallery}" target="_blank" rel="noopener">${esc(t.drawings.gallery)} ${external}</a></p>
  </div>
  <div class="wrap plates">
    ${plateItems.join('')}
  </div>
</section>

<dialog class="lightbox" data-lightbox-dialog aria-label="${esc(t.drawings.title)}">
  <div class="lightbox__inner">
    <div class="lightbox__stage" data-lightbox-stage></div>
    <div class="lightbox__bar">
      <p class="lightbox__cap" data-lightbox-cap></p>
      <span class="lightbox__count" data-lightbox-count></span>
      <button type="button" class="lb-btn" data-lightbox-prev><span class="sr">${esc(t.drawings.prev)}</span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5m6-6-6 6 6 6"/></svg></button>
      <button type="button" class="lb-btn" data-lightbox-next><span class="sr">${esc(t.drawings.next)}</span>${arrow}</button>
      <button type="button" class="lb-btn" data-lightbox-close><span class="sr">${esc(t.drawings.close)}</span><span class="drawer__x" aria-hidden="true"></span></button>
    </div>
  </div>
</dialog>

<!-- 07 TEAM -->
<section class="team" id="team" data-theme="light" aria-labelledby="team-title">
  <div class="wrap">
    <p class="kicker" data-reveal>${esc(t.team.kicker)}</p>
    <h2 class="h2" id="team-title" data-reveal data-split>${words(t.team.title)}</h2>
    <div class="titleblock">
      ${t.team.rows
        .map(
          (r, i) => `<article class="tb__row" data-reveal style="--d:${i}">
        <p class="tb__role">${esc(r.role)}</p>
        <h3 class="tb__name">${esc(r.name)}</h3>
        <p class="tb__p">${esc(r.p)}</p>
        ${r.link ? `<a class="tb__link" href="${site.links[r.link]}" target="_blank" rel="noopener">${esc(t.team.visit)} ${external}</a>` : '<span></span>'}
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>

<!-- 08 PROCESS + FAQ -->
<section class="process" id="faq" data-theme="light" data-tone="stone" aria-labelledby="process-title">
  <div class="wrap">
    <p class="kicker" data-reveal>${esc(t.process.kicker)}</p>
    <h2 class="h2" id="process-title" data-reveal data-split>${words(t.process.title)}</h2>
    <div class="steps" data-scene="steps">
      <svg class="steps__line" viewBox="0 0 1000 4" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M0 2H1000"/></svg>
      <ol class="steps__list">${t.process.steps.map(([h, p], i) => `<li class="step" data-reveal style="--d:${i}"><span class="step__n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('')}</ol>
    </div>
    <div class="faq">
      <div class="faq__head">
        <p class="kicker" data-reveal>${esc(t.faq.kicker)}</p>
        <h2 class="h3" data-reveal>${esc(t.faq.title)}</h2>
      </div>
      <div class="faq__list">
        ${t.faq.items
          .map(
            ([q, a], i) => `<div class="qa" data-reveal>
          <h3 class="qa__q"><button type="button" aria-expanded="false" aria-controls="qa-${i}" id="qa-b-${i}">${esc(q)}<span class="qa__icon" aria-hidden="true"></span></button></h3>
          <div class="qa__a" id="qa-${i}" role="region" aria-labelledby="qa-b-${i}"><div><p>${esc(a)}</p></div></div>
        </div>`,
          )
          .join('')}
      </div>
    </div>
  </div>
</section>

<!-- 09 CONTACT -->
<section class="contact" id="contact" data-theme="dark" data-scene="contact" aria-labelledby="contact-title">
  ${media.closing ? `<div class="contact__photo">${picture(media.closing, lang, 'contact__img')}</div>` : ''}
  <div class="contact__topo" aria-hidden="true">${topo.contactSvg}</div>
  <div class="wrap contact__grid">
    <div class="contact__intro">
      <p class="kicker" data-reveal>${esc(t.contact.kicker)}</p>
      <h2 class="contact__title" id="contact-title">${t.contact.title.map((l, i) => `<span class="hero__line" style="--li:${i}"><span>${esc(l)}</span></span>`).join('')}</h2>
      <p class="contact__lead" data-reveal>${esc(t.contact.lead)}</p>
      <ul class="contact__direct" data-reveal>
        ${site.phones.map((p) => `<li><span>${esc(p.label[lang])}</span><a href="${p.href}">${esc(p.display)}</a></li>`).join('')}
        <li><span>${esc(t.contact.form.email)}</span><a href="mailto:${site.email}">${site.email}</a></li>
      </ul>
      <ul class="contact__links" data-reveal aria-label="${esc(t.contact.follow)}">
        <li><a href="${site.links.instagram}" target="_blank" rel="noopener">Instagram ${external}</a></li>
        <li><a href="${site.links.official[lang]}" target="_blank" rel="noopener">${esc(t.contact.official)} ${external}</a></li>
        <li><a href="${site.links.grea}" target="_blank" rel="noopener">${esc(t.contact.greaPage)} ${external}</a></li>
        <li><a href="${site.links.map}" target="_blank" rel="noopener">${esc(t.contact.map)} ${external}</a></li>
      </ul>
    </div>
    <form class="form" novalidate data-form aria-labelledby="form-title">
      <h3 class="form__title" id="form-title">${esc(t.contact.form.title)}</h3>
      <div class="form__summary" role="alert" data-form-summary hidden></div>
      <div class="form__row">
        <label class="field" data-field="name">
          <span class="field__label">${esc(t.contact.form.name)}</span>
          <input name="name" type="text" autocomplete="name" required aria-describedby="err-name">
          <span class="field__err" id="err-name" data-err></span>
        </label>
      </div>
      <div class="form__row form__row--2">
        <label class="field" data-field="phone">
          <span class="field__label">${esc(t.contact.form.phone)}</span>
          <input name="phone" type="tel" autocomplete="tel" inputmode="tel" aria-describedby="err-phone">
          <span class="field__err" id="err-phone" data-err></span>
        </label>
        <label class="field" data-field="email">
          <span class="field__label">${esc(t.contact.form.email)}</span>
          <input name="email" type="email" autocomplete="email" aria-describedby="err-email">
          <span class="field__err" id="err-email" data-err></span>
        </label>
      </div>
      <div class="form__row">
        <label class="field" data-field="plot">
          <span class="field__label">${esc(t.contact.form.plot)}</span>
          <select name="plot" data-form-plot><option value="">${esc(t.contact.form.plotAny)}</option>${plotOptions}</select>
        </label>
      </div>
      <div class="form__row">
        <label class="field" data-field="message">
          <span class="field__label">${esc(t.contact.form.message)} <em>(${esc(t.contact.form.optional)})</em></span>
          <textarea name="message" rows="3" placeholder="${esc(t.contact.form.placeholder)}"></textarea>
        </label>
      </div>
      <div class="form__row">
        <label class="check" data-field="consent">
          <input type="checkbox" name="consent" required aria-describedby="err-consent">
          <span class="check__box" aria-hidden="true"></span>
          <span class="check__text">${esc(t.contact.form.consent)}</span>
        </label>
        <span class="field__err" id="err-consent" data-err-consent></span>
      </div>
      <button class="btn btn--primary btn--block form__submit" type="submit" data-form-submit><span data-submit-label>${esc(t.contact.form.submit)}</span> ${arrow}</button>
      <p class="form__status" role="status" data-form-status></p>
    </form>
  </div>
</section>
</main>

<footer class="footer" data-theme="dark">
  <div class="wrap footer__grid">
    <a class="brand brand--footer" href="#top" aria-label="${esc(t.footer.top)}">${brand}</a>
    <p class="footer__line">${esc(t.footer.line)}</p>
    <p class="footer__disc">${esc(t.footer.disclaimer)}</p>
    <div class="footer__meta">
      <a href="${other.href}" hreflang="${other.hreflang}" lang="${other.hreflang}" data-lang-switch>${esc(other.label)}</a>
      <a href="#top">${esc(t.footer.top)} <svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V5m-6 6 6-6 6 6"/></svg></a>
    </div>
  </div>
</footer>

<a class="sticky-cta" href="#plots" data-sticky-cta>${esc(t.sticky)} ${arrowDown}</a>

<script id="page-data" type="application/json">${JSON.stringify({
    lang,
    plots: t.plots,
    form: t.contact.form,
    email: site.email,
    phone: site.phones[0].display,
  }).replace(/</g, '\\u003c')}</script>`;
}

function specIcon(k) {
  const icons = {
    road: '<path d="M8 3 5 21M16 3l3 18M12 5v3m0 4v3m0 4v2"/>',
    walk: '<path d="M4 20h16M4 16h16M8 16v4m8-4v4"/>',
    light: '<path d="M12 21V6m0 0c0-2 1-3 3-3h3M17 3v3m-2 0h4M4 21h16"/>',
    fence: '<path d="M4 21V9l2-3 2 3v12m4 0V9l2-3 2 3v12m4 0V9M2 21h20M2 14h20"/>',
    gate: '<path d="M3 21V5h18v16M3 21h18M8 5v16m4-16v16m4-16v16"/>',
    utilities: '<path d="M3 8h18M3 12h18M3 16h18M7 8v8m10-8v8"/>',
    storm: '<path d="M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10ZM4 21h16"/>',
    access: '<path d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5zM12 15v3"/>',
  };
  return `<svg viewBox="0 0 24 24">${icons[k] || ''}</svg>`;
}
