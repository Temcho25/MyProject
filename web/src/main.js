import { scene, onScroll, reveal, request, refresh, reduceMotion, clamp, lerp, range, ease } from './motion.js';
import { data as plotData, plan } from './content/plots.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const page = JSON.parse($('#page-data').textContent);
const reduced = () => reduceMotion.matches;
const mobile = () => window.innerWidth < 900;
const heroState = { light: false };

/* ---------------------------------------------------------------- load */
const ready = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
ready.then(() => {
  requestAnimationFrame(() => {
    document.body.classList.add('is-loaded');
    refresh();
  });
});

reveal('[data-reveal]');

/* ---------------------------------------------------------------- hero: descending through the terrain */
{
  const hero = $('.hero');
  const far = $('.hero__layer--far', hero);
  const mid = $('.hero__layer--mid', hero);
  const near = $('.hero__layer--near', hero);
  const site = $('.hero__site', hero);
  const bearing = $('.near__bearing', hero);
  const content = $('.hero__content', hero);
  const stage = $('.hero__stage', hero);
  const wipe = $('.hero__wipe', hero);
  const keyPlot = $$('.site__plot', site)[9];

  // Gentle idle drift from the pointer (desktop only): relative motion between planes.
  let mx = 0, my = 0, tx = 0, ty = 0, raf = 0;
  const drift = () => {
    tx += (mx - tx) * 0.06;
    ty += (my - ty) * 0.06;
    hero.style.setProperty('--dx', tx.toFixed(3));
    hero.style.setProperty('--dy', ty.toFixed(3));
    apply(lastP);
    raf = Math.abs(mx - tx) + Math.abs(my - ty) > 0.001 ? requestAnimationFrame(drift) : 0;
  };
  if (window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      if (reduced()) return;
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(drift);
    });
  }

  let lastP = 0;
  function apply(p) {
    lastP = p;
    if (reduced()) return;
    const k = mobile() ? 0.7 : 1;
    const e = ease.inOut(range(p, 0, 0.7));
    // Planes move at different rates: far barely, mid more, near the most (it passes the camera).
    far.style.transform = `translate3d(${tx * -8}px, ${ty * -6 - e * 30}px, 0) scale(${1 + 0.06 * e}) rotate(${-3 + 3 * e}deg)`;
    mid.style.transform = `translate3d(${tx * -18}px, ${ty * -14}px, 0) scale(${1 + 0.6 * e * k}) rotate(${-7 + 7 * e}deg)`;
    near.style.transform = `translate3d(${tx * -34}px, ${ty * -26}px, 0) scale(${1 + 1.5 * e * k})`;
    near.style.opacity = String(clamp(1 - e * 1.4));
    bearing.style.setProperty('--bearing', `${lerp(-24, 0, e)}deg`);
    // The 24-plot cluster comes to the centre and grows towards the camera.
    const se = ease.inOut(range(p, 0.04, 0.66));
    site.style.setProperty('--sx', `${lerp(mobile() ? 0 : 8, 0, se)}vw`);
    const short = window.innerHeight < 780;
    site.style.setProperty('--sy', `${lerp(mobile() ? (short ? -27 : -20) : 2, 0, se)}vh`);
    site.style.setProperty('--ss', String((mobile() && short ? 0.8 : 1) + se * (mobile() ? 1.4 : 2.2)));
    // Copy lifts away first so the terrain becomes the subject.
    const c = range(p, 0.02, 0.32);
    stage.style.setProperty('--cy', `${-c * 14}vh`);
    stage.style.setProperty('--co', String(1 - ease.out(c)));
    // One plot is singled out, then opens up to become the next (ivory) page.
    keyPlot.classList.toggle('is-key', p > 0.3);
    const w = ease.inOut(range(p, 0.44, 0.76));
    const vw = window.innerWidth, vh = window.innerHeight;
    if (w > 0) {
      const r = keyPlot.getBoundingClientRect();
      const t = lerp(r.top, 0, w), l = lerp(r.left, 0, w);
      const rr = lerp(vw - r.right, 0, w), bb = lerp(vh - r.bottom, 0, w);
      wipe.style.clipPath = `inset(${t}px ${rr}px ${bb}px ${l}px)`;
      wipe.style.visibility = 'visible';
      heroState.light = t <= 40;
    } else {
      wipe.style.visibility = 'hidden';
      heroState.light = false;
    }
  }
  scene(hero, apply);
}

/* ---------------------------------------------------------------- intro: the statement reads in at scroll pace */
{
  const el = $('[data-scene="read"]');
  const ws = $$('.rw', el);
  let lit = -1;
  const set = (n) => {
    if (n === lit) return;
    lit = n;
    ws.forEach((w, i) => w.classList.toggle('is-lit', i < n));
  };
  if (reduced()) set(ws.length);
  else
    scene(el, (p) => set(Math.round(p * ws.length)), {
      start: (r, vh) => -vh * 0.82,
      end: (r, vh) => r.height - vh * 0.42,
    });
}

/* ---------------------------------------------------------------- location: steps drive the diagram */
{
  const map = $('[data-locmap]');
  const steps = $$('[data-lstep]');
  const layers = $$('[data-step]', map).filter((n) => n !== map);
  const setStep = (n) => {
    map.dataset.step = n;
    layers.forEach((l) => l.classList.toggle('on', Number(l.dataset.step) <= n));
    steps.forEach((s, i) => s.classList.toggle('is-active', i === n));
  };
  setStep(0);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => e.isIntersecting && setStep(Number(e.target.dataset.lstep)));
    },
    { rootMargin: '-48% 0px -48% 0px' },
  );
  steps.forEach((s) => io.observe(s));
  // On narrow screens the map sits on top, so trigger a little lower.
  const io2 = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && mobile()) setStep(Number(e.target.dataset.lstep));
      });
    },
    { rootMargin: '-70% 0px -20% 0px' },
  );
  steps.forEach((s) => io2.observe(s));
}

/* ---------------------------------------------------------------- plots: perspective plan flattens into plan view */
const planEl = $('[data-plan]');
{
  const svg = $('svg', planEl);
  let drawn = false;
  const draw = () => {
    if (drawn) return;
    drawn = true;
    svg.classList.add('is-drawn');
  };
  if (reduced()) draw();
  else
    scene(
      $('.plots__stage'),
      (p) => {
        const e = ease.out(p);
        planEl.style.setProperty('--tilt', `${lerp(54, 0, e)}deg`);
        planEl.style.setProperty('--twist', `${lerp(-9, 0, e)}deg`);
        planEl.style.setProperty('--ps', String(lerp(0.84, 1, e)));
        if (p > 0.2) draw();
      },
      { start: (r, vh) => -vh, end: (r, vh) => -vh * 0.28 },
    );
}

/* ---------------------------------------------------------------- plots: selection */
{
  const plots = $$('.plot', planEl);
  const panelEmpty = $('[data-panel-empty]');
  const panelDetail = $('[data-panel-detail]');
  const pid = $('[data-panel-id]');
  const parea = $('[data-panel-area]');
  const pstatus = $('[data-panel-status]');
  const select = $('[data-plot-select]');
  const formPlot = $('[data-form-plot]');
  const measure = $('.siteplan__measure', planEl);
  const live = $('[data-plot-live]');
  const T = page.plots;
  let current = null;

  // Apply official statuses when they are provided in content/plots.js.
  plots.forEach((g) => {
    const d = plotData[g.dataset.plot];
    if (d?.status) g.dataset.status = d.status;
    g.setAttribute('tabindex', '-1');
  });
  plots[0].setAttribute('tabindex', '0');

  const geom = Object.fromEntries(plan.plots.map((p) => [p.id, p]));

  function frameFor(p) {
    const o = 2.4, l = 4.5;
    const x0 = p.x - o, y0 = p.y - o, x1 = p.x + p.w + o, y1 = p.y + p.h + o;
    const c = (x, y, dx, dy) => `<path class="m-corner" pathLength="1" d="M${x + dx * l} ${y}H${x}V${y + dy * l}"/>`;
    return c(x0, y0, 1, 1) + c(x1, y0, -1, 1) + c(x0, y1, 1, -1) + c(x1, y1, -1, -1);
  }

  function selectPlot(id, { focus = false } = {}) {
    id = Number(id) || null;
    current = id;
    plots.forEach((g) => {
      const on = Number(g.dataset.plot) === id;
      g.classList.toggle('is-selected', on);
      g.setAttribute('aria-pressed', String(on));
      g.setAttribute('tabindex', on || (!id && g === plots[0]) ? '0' : '-1');
      if (on && focus) g.focus();
    });
    select.value = id ? String(id) : '';
    if (!id) {
      panelEmpty.hidden = false;
      panelDetail.hidden = true;
      measure.innerHTML = '';
      return;
    }
    const d = plotData[id] || {};
    pid.textContent = String(id).padStart(2, '0');
    parea.textContent = d.area ? `${d.area.toLocaleString(page.lang === 'ka' ? 'ka-GE' : 'en-GB')} ${page.lang === 'ka' ? 'მ²' : 'm²'}` : T.areaFrom;
    const st = d.status || 'unknown';
    pstatus.innerHTML = `<span class="status status--${st}">${T.statuses[st]}</span>`;
    panelEmpty.hidden = true;
    panelDetail.hidden = false;
    // Re-trigger the panel entrance.
    panelDetail.style.animation = 'none';
    void panelDetail.offsetWidth;
    panelDetail.style.animation = '';
    measure.innerHTML = frameFor(geom[id]);
    live.textContent = `${T.plot} ${id}. ${T.area}: ${parea.textContent}. ${T.status}: ${T.statuses[st]}.`;
  }

  plots.forEach((g) => {
    g.addEventListener('click', () => selectPlot(g.dataset.plot));
    g.addEventListener('keydown', (e) => {
      const id = Number(g.dataset.plot);
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPlot(id);
        return;
      }
      const dirs = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
      const d = dirs[e.key];
      if (!d) return;
      e.preventDefault();
      const a = geom[id];
      const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
      let best = null, bestScore = Infinity;
      for (const b of plan.plots) {
        if (b.id === id) continue;
        const dx = b.x + b.w / 2 - ax, dy = b.y + b.h / 2 - ay;
        const along = dx * d[0] + dy * d[1];
        if (along <= 1) continue;
        const across = Math.abs(dx * d[1]) + Math.abs(dy * d[0]);
        const score = along + across * 2.5;
        if (score < bestScore) (bestScore = score), (best = b);
      }
      if (best) {
        const next = plots.find((p) => Number(p.dataset.plot) === best.id);
        plots.forEach((p) => p.setAttribute('tabindex', '-1'));
        next.setAttribute('tabindex', '0');
        next.focus();
      }
    });
  });
  select.addEventListener('change', () => selectPlot(select.value));
  $('[data-plot-inquire]').addEventListener('click', () => {
    if (current) formPlot.value = String(current);
  });
}

/* ---------------------------------------------------------------- infrastructure: the street section */
{
  const track = $('[data-scene="section"]');
  const canvas = $('.infra__canvas', track);
  const scroller = $('.infra__scroller', track);
  const svg = $('svg.sec', track);
  const callouts = $$('[data-callout]', svg);
  const bar = $('.infra__bar', track);

  const check = (limit) => {
    for (const c of callouts) {
      if (c.classList.contains('on')) continue;
      if (c.getBoundingClientRect().left < limit) c.classList.add('on');
    }
  };

  if (reduced()) {
    callouts.forEach((c) => c.classList.add('on'));
    svg.classList.add('service-on');
  } else {
    scene(
      track,
      (p, { vw }) => {
        if (mobile()) return;
        const pad = parseFloat(getComputedStyle(canvas).paddingLeft) || 0;
        const dist = Math.max(0, canvas.scrollWidth + pad - vw);
        const e = ease.inOut(p);
        canvas.style.setProperty('--sx', `${-e * dist}px`);
        bar.style.setProperty('--ip', p.toFixed(4));
        check(vw * 0.86);
        svg.classList.toggle('service-on', p > 0.5);
      },
      { start: () => 0 },
    );
    // Mobile: native horizontal swipe inside the scroller.
    const onSwipe = () => {
      if (!mobile()) return;
      const max = scroller.scrollWidth - scroller.clientWidth;
      const p = max > 0 ? scroller.scrollLeft / max : 0;
      bar.style.setProperty('--ip', p.toFixed(4));
      check(window.innerWidth * 0.95);
      if (p > 0.45) svg.classList.add('service-on');
    };
    scroller.addEventListener('scroll', onSwipe, { passive: true });
    new IntersectionObserver(([e]) => e.isIntersecting && onSwipe(), { threshold: 0.3 }).observe(scroller);
    window.addEventListener('resize', () => {
      if (mobile()) canvas.style.removeProperty('--sx');
    });
  }
}

/* ---------------------------------------------------------------- process line + contact parallax */
{
  const steps = $('[data-scene="steps"]');
  if (reduced()) steps.style.setProperty('--sl', 0);
  else scene(steps, (p) => steps.style.setProperty('--sl', String(1 - ease.out(p))), { start: (r, vh) => -vh * 0.9, end: (r, vh) => -vh * 0.35 });

  const contact = $('.contact');
  const topo = $('.contact__topo', contact);
  if (!reduced()) scene(contact, (p) => topo.style.setProperty('--ty', `${(p - 0.5) * -80}px`), { start: (r, vh) => -vh, end: (r) => r.height });
  const title = $('.contact__title');
  new IntersectionObserver(([e], o) => {
    if (e.isIntersecting) {
      title.classList.add('is-in');
      o.disconnect();
    }
  }, { rootMargin: '0px 0px -15% 0px' }).observe(title);
}

/* ---------------------------------------------------------------- nav: theme, current section, progress */
{
  const nav = $('[data-nav]');
  const sections = $$('main > section, footer');
  const links = $$('.nav__links a');
  const bar = $('.progress span');
  const hero = $('.hero');
  onScroll((y, vh) => {
    const probe = 36;
    let theme = 'dark', id = '', tone = '';
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) {
        theme = s.dataset.theme || 'light';
        tone = s.dataset.tone || '';
        id = s.id;
        break;
      }
    }
    // The hero's ivory opening counts as light once it covers the top of the screen.
    const heroRect = hero.getBoundingClientRect();
    const inHero = heroRect.bottom > probe;
    if (inHero && heroState.light) theme = 'light';
    nav.dataset.on = theme;
    nav.dataset.tone = tone;
    nav.classList.toggle('is-solid', !inHero);
    links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${id}`)));
    const max = document.documentElement.scrollHeight - vh;
    bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
  });
  request();
}

/* ---------------------------------------------------------------- sticky CTA (mobile) */
{
  const cta = $('[data-sticky-cta]');
  const hide = new Set();
  const update = () => cta.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.9 && hide.size === 0);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? hide.add(e.target) : hide.delete(e.target)));
    update();
  });
  ['#plots', '#contact', '.footer'].forEach((s) => io.observe($(s)));
  onScroll(update);
}

/* ---------------------------------------------------------------- drawer */
{
  const dlg = $('#drawer');
  const openBtn = $('[data-drawer-open]');
  let closing = 0;
  const open = () => {
    clearTimeout(closing);
    dlg.showModal();
    document.documentElement.style.overflow = 'hidden';
    openBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => dlg.classList.add('is-open'));
  };
  const close = (then) => {
    dlg.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    closing = setTimeout(() => {
      dlg.close();
      document.documentElement.style.overflow = '';
      then?.();
    }, reduced() ? 0 : 520);
  };
  openBtn.addEventListener('click', open);
  $('[data-drawer-close]').addEventListener('click', () => close());
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  $$('[data-drawer-link]', dlg).forEach((a) =>
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href.startsWith('#')) return;
      e.preventDefault();
      close(() => {
        const target = $(href);
        target?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
        history.replaceState(null, '', href);
      });
    }),
  );
  window.addEventListener('resize', () => {
    if (dlg.open && window.innerWidth > 1080) close();
  });
}

/* ---------------------------------------------------------------- language switch keeps the section */
$$('[data-lang-switch]').forEach((a) =>
  a.addEventListener('click', () => {
    if (location.hash) a.href = a.getAttribute('href').split('#')[0] + location.hash;
  }),
);

/* ---------------------------------------------------------------- FAQ */
$$('.qa').forEach((qa) => {
  const btn = $('button', qa);
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    qa.classList.toggle('is-open', open);
  });
});

/* ---------------------------------------------------------------- views: a plot-shaped window opens onto the renders */
{
  const reel = $('[data-reel]');
  if (reel && !reduced()) {
    const frames = $$('.reel__frame', reel);
    const imgs = frames.map((f) => $('img', f));
    const head = $('[data-reel-head]', reel);
    const nEl = $('[data-reel-n]', reel);
    const capEl = $('[data-reel-cap]', reel);
    const caps = imgs.map((i) => i.alt);
    const n = frames.length;
    const OPEN = 0.24; // share of the scroll spent opening the first window
    let cur = 0;
    let swap = 0;

    scene(reel, (p) => {
      const m = mobile();
      // 1. The first photo grows from a plot-shaped window to full bleed.
      const o = ease.inOut(range(p, 0, OPEN));
      const iy = lerp(m ? 30 : 26, 0, o);
      const ix = lerp(m ? 10 : 34, 0, o);
      frames[0].style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}%)`;
      // 2. Each next photo rises over the previous one; the covered photo drifts up.
      const seg = (1 - OPEN - 0.06) / (n - 1);
      const t = [o];
      for (let k = 1; k < n; k++) {
        const a = OPEN + 0.04 + (k - 1) * seg;
        t[k] = ease.inOut(range(p, a, a + seg * 0.72));
        frames[k].style.clipPath = `inset(${((1 - t[k]) * 100).toFixed(2)}% 0 0 0)`;
      }
      imgs.forEach((img, k) => {
        const inT = t[k];
        const outT = k + 1 < n ? t[k + 1] : 0;
        const scale = k === 0 ? lerp(1.32, 1.06, inT) : lerp(1.16, 1.04, inT);
        img.style.transform = `translate3d(0, ${(outT * -7).toFixed(2)}%, 0) scale(${scale.toFixed(4)})`;
      });
      // Title rests over the small window, then steps aside.
      const h = range(p, OPEN * 0.7, OPEN + 0.06);
      head.style.opacity = String(1 - h);
      head.style.transform = `translate3d(0, ${(-h * 40).toFixed(1)}px, 0)`;
      // Caption follows the photo that covers most of the screen.
      let idx = 0;
      for (let k = 1; k < n; k++) if (t[k] > 0.5) idx = k;
      if (idx !== cur) {
        cur = idx;
        clearTimeout(swap);
        capEl.classList.add('is-swap');
        nEl.textContent = String(idx + 1).padStart(2, '0');
        swap = setTimeout(() => {
          capEl.textContent = caps[cur];
          capEl.classList.remove('is-swap');
        }, 180);
      }
    });
  }

  // Grid: each photo moves slower than the page inside its frame.
  if (!reduced()) {
    $$('.shot').forEach((shot) => {
      const img = $('.shot__img', shot);
      scene(
        shot,
        (p) => {
          img.style.transform = `translate3d(0, ${lerp(-6, 6, p).toFixed(2)}%, 0)`;
        },
        { start: (r, vh) => -vh, end: (r) => r.height },
      );
    });
  }
}

/* ---------------------------------------------------------------- lightbox */
{
  const dlg = $('[data-lightbox-dialog]');
  const stage = $('[data-lightbox-stage]', dlg);
  const cap = $('[data-lightbox-cap]', dlg);
  const count = $('[data-lightbox-count]', dlg);
  // Lightbox items are built from the plates already on the page.
  const items = $$('.shot, .plate').map((fig) => {
    const f = document.createElement('figure');
    const art = $('.plate__art, .plate__img, .shot__img', fig);
    f.innerHTML = art.classList.contains('plate__art') ? art.innerHTML : art.outerHTML;
    $$('[id]', f).forEach((n) => n.removeAttribute('id'));
    $$('[style]', f).forEach((n) => n.removeAttribute('style'));
    $$('img', f).forEach((n) => (n.className = 'lightbox__img', n.removeAttribute('loading'), n.setAttribute('sizes', '100vw')));
    const cap = $('figcaption', fig);
    const strong = cap && $('strong', cap);
    f.dataset.cap = strong ? `${strong.textContent} — ${cap.lastElementChild.textContent}` : art.getAttribute('alt') || '';
    return f;
  });
  let i = 0;
  const show = (n) => {
    i = (n + items.length) % items.length;
    stage.replaceChildren(items[i].cloneNode(true));
    cap.textContent = items[i].dataset.cap;
    count.textContent = `${i + 1} / ${items.length}`;
  };
  const close = () => {
    dlg.classList.remove('is-open');
    setTimeout(() => dlg.close(), reduced() ? 0 : 300);
  };
  $$('[data-lightbox]').forEach((b) =>
    b.addEventListener('click', () => {
      show(Number(b.dataset.lightbox));
      dlg.showModal();
      requestAnimationFrame(() => dlg.classList.add('is-open'));
    }),
  );
  $('[data-lightbox-prev]', dlg).addEventListener('click', () => show(i - 1));
  $('[data-lightbox-next]', dlg).addEventListener('click', () => show(i + 1));
  $('[data-lightbox-close]', dlg).addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target === stage) close();
  });
  let sx = null;
  stage.addEventListener('pointerdown', (e) => (sx = e.clientX));
  stage.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
  });
}

/* ---------------------------------------------------------------- inquiry form */
{
  const form = $('[data-form]');
  const T = page.form;
  const summary = $('[data-form-summary]', form);
  const status = $('[data-form-status]', form);
  const submit = $('[data-form-submit]', form);
  const label = $('[data-submit-label]', form);
  const endpoint = import.meta.env.VITE_INQUIRY_ENDPOINT;

  const field = (n) => form.elements[n];
  const setErr = (name, msg) => {
    const wrap = $(`[data-field="${name}"]`, form);
    const err = name === 'consent' ? $('[data-err-consent]', form) : $('[data-err]', wrap);
    wrap.classList.toggle('is-invalid', !!msg);
    field(name).setAttribute('aria-invalid', msg ? 'true' : 'false');
    err.textContent = msg || '';
  };
  const digits = (s) => s.replace(/\D/g, '');
  const validators = {
    name: () => (field('name').value.trim().length < 2 ? T.errors.name : ''),
    phone: () => {
      const v = field('phone').value.trim();
      if (!v) return !field('email').value.trim() ? T.errors.contact : '';
      return /^[+\d\s()-]+$/.test(v) && digits(v).length >= 9 && digits(v).length <= 15 ? '' : T.errors.phone;
    },
    email: () => {
      const v = field('email').value.trim();
      if (!v) return '';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : T.errors.email;
    },
    consent: () => (field('consent').checked ? '' : T.errors.consent),
  };
  const touched = new Set();
  const validate = (names = Object.keys(validators)) => {
    let ok = true;
    for (const n of names) {
      const msg = validators[n]();
      setErr(n, msg);
      if (msg) ok = false;
    }
    return ok;
  };
  Object.keys(validators).forEach((n) => {
    const el = field(n);
    el.addEventListener('blur', () => {
      touched.add(n);
      validate([n]);
    });
    el.addEventListener(n === 'consent' ? 'change' : 'input', () => {
      if (!touched.has(n)) return;
      // Phone and email satisfy each other's requirement.
      validate(n === 'phone' || n === 'email' ? ['phone', 'email'].filter((x) => touched.has(x)) : [n]);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    Object.keys(validators).forEach((n) => touched.add(n));
    status.textContent = '';
    status.className = 'form__status';
    if (!validate()) {
      summary.hidden = false;
      summary.textContent = T.errors.summary;
      const first = $('[aria-invalid="true"]', form);
      first?.focus();
      return;
    }
    summary.hidden = true;
    const payload = {
      name: field('name').value.trim(),
      phone: field('phone').value.trim(),
      email: field('email').value.trim(),
      plot: field('plot').value || null,
      message: field('message').value.trim(),
      lang: page.lang,
      source: location.href,
    };

    if (endpoint) {
      submit.disabled = true;
      label.textContent = T.sending;
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(String(res.status));
        status.textContent = T.sent;
        status.classList.add('is-ok');
        form.reset();
        touched.clear();
      } catch {
        status.textContent = `${T.failed} ${page.phone} · ${page.email}`;
        status.classList.add('is-err');
      } finally {
        submit.disabled = false;
        label.textContent = T.submit;
      }
      return;
    }

    // No submission backend is configured: hand the inquiry to the visitor's email app.
    const plotLine = payload.plot ? `${page.plots.plot}: ${payload.plot}` : `${page.plots.plot}: —`;
    const body = [`${T.name}: ${payload.name}`, `${T.phone}: ${payload.phone || '—'}`, `${T.email}: ${payload.email || '—'}`, plotLine, '', payload.message].join('\n');
    window.location.href = `mailto:${page.email}?subject=${encodeURIComponent(T.mailSubject)}&body=${encodeURIComponent(body)}`;
    status.textContent = T.mailto;
    status.classList.add('is-info');
  });
}
