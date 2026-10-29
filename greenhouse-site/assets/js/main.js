import { EN, getLang, applyLang } from './i18n.js';
import { createSound } from './sound.js';

const { gsap, ScrollTrigger, Lenis } = window;
if (!gsap || !ScrollTrigger) {
  // libraries blocked or failed: show the static page instead of a stuck loader
  document.querySelector('.loader')?.remove();
  document.body.classList.remove('is-loading');
  throw new Error('GSAP unavailable');
}
gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 820px)').matches;

// ---------- language ----------
const lang = getLang();
applyLang(lang);
import('./explorer.js').then(x => x.initExplorer(document.querySelector('#tour'))).catch(e => console.warn('3D tour unavailable', e));
$$('.lang a').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  try { localStorage.setItem('gh-lang', a.dataset.lang); } catch (_) {}
  location.hash = a.dataset.lang;
  location.reload();
}));


// ---------- logo mark (same projection as the 3D camera's first frame) ----------
const MARK = `<svg viewBox="0 0 58.3 100" aria-hidden="true"><g class="slab"><polygon class="fr" points="0.0,94.4 45.5,83.8 44.1,61.6 5.2,72.7"/><polygon class="sd" points="45.5,83.8 58.3,100.0 55.4,78.8 44.1,61.6"/></g><g class="slab"><polygon class="fr" points="6.6,66.7 43.8,55.5 42.8,40.8 10.2,51.7"/><polygon class="sd" points="43.8,55.5 54.6,72.8 52.6,57.9 42.8,40.8"/></g><g class="slab"><polygon class="fr" points="11.2,47.4 42.6,36.6 41.9,26.1 13.8,36.5"/><polygon class="sd" points="42.6,36.6 52.0,53.6 50.5,42.5 41.9,26.1"/></g><g class="slab"><polygon class="fr" points="14.6,33.3 41.7,23.0 41.2,15.2 16.6,25.0"/><polygon class="sd" points="41.7,23.0 50.0,39.2 48.9,30.7 41.2,15.2"/></g><g class="slab"><polygon class="fr" points="17.1,22.5 41.1,12.8 40.7,6.7 18.7,15.9"/><polygon class="sd" points="41.1,12.8 48.5,28.1 47.6,21.3 40.7,6.7"/></g><g class="slab"><polygon class="fr" points="19.2,13.9 40.6,4.9 40.3,0.0 20.5,8.6"/><polygon class="sd" points="40.6,4.9 47.3,19.3 46.6,13.8 40.3,0.0"/></g></svg>`;
$$('.mark').forEach(m => { m.innerHTML = MARK; });

// ---------- text splitting ----------
function splitChars(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.textContent = '';
  text.split(/(\s+)/).forEach(part => {
    if (!part) return;
    if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
    const w = document.createElement('span');
    w.className = 'word';
    w.setAttribute('aria-hidden', 'true');
    [...part].forEach(ch => {
      const c = document.createElement('span');
      c.className = 'char';
      c.textContent = ch;
      w.appendChild(c);
    });
    el.appendChild(w);
  });
  return $$('.char', el);
}
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => {
    const s = document.createElement('span');
    s.className = 'word'; s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return $$('.word', el);
}
$$('[data-split]').forEach(splitChars);
$$('[data-words]').forEach(splitWords);

// ---------- smooth scroll ----------
let lenis = null;
if (!reduced && Lenis) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  window.__lenis = lenis;
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  const el = id === '#top' ? document.body : $(id);
  if (!el) return;
  e.preventDefault();
  lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' });
}));

// ---------- sound ----------
const sound = createSound();
// promo-video capture: record when each sound effect fires, so the offline mix lands on the same frames
if (window.__capture) {
  Object.keys(sound.sfx).forEach(k => {
    const f = sound.sfx[k];
    sound.sfx[k] = (...a) => { window.__capture.events.push({ k, t: performance.now() / 1000, a }); f(...a); };
  });
}
const soundBtn = $('.sound');
soundBtn.addEventListener('click', () => soundBtn.setAttribute('aria-pressed', String(sound.toggle())));

// ---------- 3D ----------
// don't let a slow CDN hold the whole page on the loader
const tower = await Promise.race([
  import('./tower.js').then(m => m.createTower($('.webgl'), { mobile, onLand: () => sound.sfx.thud(1) })),
  new Promise(r => setTimeout(() => r(null), window.__capture ? 60000 : 6000)),
]).catch(err => { console.warn('WebGL scene unavailable', err); return null; });
const TT = tower ? tower.target : {};

// ---------- loader → hero intro ----------
const heroChars = $$('.hero__title .char');
gsap.set(heroChars, { yPercent: 115, rotateX: -80, opacity: 0, '--w': 62.5 });
gsap.set(['.hero__eyebrow', '.hero__sub', '.hero__foot', '.hdr'], { opacity: 0, y: 20 });

const loaderSlabs = $$('.mark--loader .slab').reverse(); // bottom slab first
const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
intro
  .fromTo(loaderSlabs, { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.11, ease: 'back.out(1.6)' })
  .from('.loader__word', { y: 30, opacity: 0, filter: 'blur(10px)', duration: 1 }, 0.35)
  .from('.loader__sub', { y: 14, opacity: 0, duration: 0.8 }, 0.55)
  .to('.loader__inner', { y: -40, opacity: 0, filter: 'blur(8px)', duration: 0.7, ease: 'power3.in' }, 1.55)
  .add(() => sound.sfx.whoosh(1), 1.9)
  .to('.loader__bands i', {
    xPercent: i => (i % 2 ? 101 : -101),
    duration: 1.1, ease: 'expo.inOut', stagger: { each: 0.06, from: 'end' },
  }, 1.9)
  .add(() => {
    $('.loader').remove();
    document.body.classList.remove('is-loading');
    lenis && lenis.start();
  }, 3.1);
if (tower) intro.to(tower.intro, { v: 1, duration: 2.6, ease: 'power2.out' }, 1.75);
intro
  .to(heroChars, {
    yPercent: 0, rotateX: 0, opacity: 1, '--w': 100,
    duration: 1.4, stagger: 0.045, ease: 'expo.out',
  }, 2.25)
  .to(['.hdr', '.hero__eyebrow', '.hero__sub', '.hero__foot'], { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 2.6);
$$('.hero__title .char').forEach(c => { c.style.fontStretch = 'calc(var(--w, 100) * 1%)'; });

// ---------- header behaviour ----------
const hdr = $('.hdr');
let lastY = 0, hdrHidden = false;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: self => {
    const y = self.scroll();
    hdr.classList.toggle('is-solid', y > window.innerHeight * 0.6);
    const hide = y > lastY && y > window.innerHeight;
    if (hide !== hdrHidden) { hdrHidden = hide; gsap.to(hdr, { yPercent: hide ? -110 : 0, duration: 0.45, ease: 'power3.out', overwrite: 'auto' }); }
    lastY = y;
  },
});

// ---------- hero → build (3D camera, explode, restack) ----------
if (tower) {
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: s => {
      TT.camT = s.progress;            // logo angle → pull out
      TT.explode = smoothstep(s.progress) * 0.9;
      TT.spread = 0.32 * (1 - s.progress);
      TT.thin = 1 - smoothstep(s.progress);
    },
  });
}
gsap.to('.hero__title .char', {
  yPercent: i => -40 - (i % 3) * 30,
  rotate: i => (i % 2 ? 8 : -8),
  opacity: 0, filter: mobile ? 'none' : 'blur(6px)',
  stagger: 0.02, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
});
gsap.to(['.hero__sub', '.hero__eyebrow', '.hero__foot'], {
  y: -60, opacity: 0, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: true },
});

// ---------- the build scene ----------
const statNum = $('.stat__num'), statUnit = $('.stat__unit'), statLabel = $('.stat__label');
const statItems = $$('.stat__list li');
let statIdx = -1, countTween = null;
function setStat(i) {
  if (i === statIdx) return;
  const dir = i > statIdx ? 1 : -1;
  statIdx = i;
  const li = statItems[i];
  statItems.forEach((el, k) => el.classList.toggle('is-on', k === i));
  sound.sfx.tick();
  gsap.timeline()
    .to([statNum, statUnit], { yPercent: -60 * dir, opacity: 0, filter: mobile ? 'none' : 'blur(8px)', duration: 0.25, ease: 'power2.in' })
    .add(() => {
      const end = parseFloat(li.dataset.val);
      const dec = li.dataset.val.includes('.') ? 1 : 0;
      const o = { v: end > 100 ? end - 6 : 0 };
      countTween?.kill();
      countTween = gsap.to(o, { v: end, duration: 0.9, ease: 'expo.out', onUpdate: () => { statNum.textContent = o.v.toFixed(dec); } });
      statUnit.textContent = li.dataset.unit || '';
      statLabel.textContent = li.textContent;
    })
    .fromTo([statNum, statUnit], { yPercent: 60 * dir, opacity: 0, filter: mobile ? 'none' : 'blur(8px)' }, { yPercent: 0, opacity: 1, filter: mobile ? 'none' : 'blur(0px)', duration: 0.6, ease: 'expo.out' });
  gsap.fromTo(statLabel, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out', delay: 0.2 });
}
gsap.set(['.build__head', '.stat', '.stat__list'], { opacity: 0, y: 40 });
ScrollTrigger.create({
  trigger: '.build', start: 'top 70%', end: 'bottom bottom',
  onEnter: () => gsap.to(['.build__head', '.stat', '.stat__list'], { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out' }),
  onLeaveBack: () => gsap.to(['.build__head', '.stat', '.stat__list'], { opacity: 0, y: 40, duration: 0.5 }),
});
gsap.from('.build__title .char', {
  yPercent: 100, opacity: 0, stagger: 0.03, duration: 1, ease: 'expo.out',
  scrollTrigger: { trigger: '.build', start: 'top 60%', toggleActions: 'play none none reverse' },
});
ScrollTrigger.create({
  trigger: '.build', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: s => {
    const p = s.progress;
    if (tower) {
      TT.camT = 1 + clamp(p / 0.18) + clamp((p - 0.25) / 0.75); // 1 → 2 → 3
      TT.explode = 0.9 * (1 - smoothstep(clamp(p / 0.16)));
      TT.spread = 0; TT.thin = 0;
      TT.core = smoothstep(clamp((p - 0.06) / 0.2));
      TT.drop = clamp((p - 0.1) / 0.16);
      TT.strips = clamp((p - 0.22) / 0.6) * 7;
    }
    $('.build__rail i').style.transform = `scaleY(${p})`;
    setStat(Math.min(statItems.length - 1, Math.floor(clamp((p - 0.02) / 0.9) * statItems.length)));
  },
});
setStat(0);

// 3D canvas visibility: hidden while the content sections cover it
if (tower) {
  ScrollTrigger.create({
    trigger: '.projects', start: 'top 35%', endTrigger: '.contact', end: 'top 85%',
    onToggle: s => { TT.vis = s.isActive ? 0 : 1; tower.setActive(!s.isActive); },
  });
}

// ---------- project cards: pointer tilt + entrance ----------
$$('.pcard').forEach(card => {
  const rx = gsap.quickTo(card, 'rotationX', { duration: 0.8, ease: 'power3.out' });
  const ry = gsap.quickTo(card, 'rotationY', { duration: 0.8, ease: 'power3.out' });
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    rx((0.5 - y) * 10); ry((x - 0.5) * 12);
    card.style.setProperty('--mx', `${x * 100}%`); card.style.setProperty('--my', `${y * 100}%`);
  });
  card.addEventListener('pointerleave', () => { rx(0); ry(0); });
});
gsap.from('.pcard', {
  y: 120, rotationX: 18, opacity: 0, stagger: 0.12, duration: 1.4, ease: 'expo.out', transformOrigin: '50% 100%',
  scrollTrigger: { trigger: '.projects__grid', start: 'top 85%', toggleActions: 'play none none reverse' },
});
gsap.fromTo('.pcard__img img', { yPercent: -6 }, {
  yPercent: 6, ease: 'none',
  scrollTrigger: { trigger: '.projects__grid', start: 'top bottom', end: 'bottom top', scrub: true },
});

// ---------- word-by-word paragraphs ----------
$$('[data-words]').forEach(p => {
  gsap.to($$('.word', p), {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 45%', scrub: true },
  });
});

// ---------- section titles ----------
$$('.sec-title, .vaz__title').forEach(t => {
  gsap.from($$('.char', t), {
    yPercent: 110, rotateX: -70, opacity: 0, '--w': 62.5,
    stagger: 0.025, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: t, start: 'top 85%', toggleActions: 'play none none reverse' },
  });
  $$('.char', t).forEach(c => { c.style.fontStretch = 'calc(var(--w, 100) * 1%)'; });
});

// ---------- 3D gallery rail ----------
const track = $('.rail__track'), cards = $$('.card'), railWord = $('.rail__word');
let railP = 0;
ScrollTrigger.create({
  trigger: '.rail', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: s => { railP = s.progress; },
});

// ---------- marquees ----------
const marquees = $$('.marquee').map(m => {
  const row = $('.marquee__row', m);
  row.innerHTML += row.innerHTML; // seamless loop
  return { row, dir: +m.dataset.dir, x: 0, w: 0 };
});
const measure = () => marquees.forEach(m => { m.w = m.row.scrollWidth / 2; });
measure();
window.addEventListener('resize', measure);

// ---------- spec hover light ----------
$$('.spec').forEach(el => el.addEventListener('pointermove', e => {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
}));
gsap.from('.spec', {
  y: 60, opacity: 0, stagger: 0.07, duration: 1.1, ease: 'expo.out',
  scrollTrigger: { trigger: '.specs', start: 'top 85%', toggleActions: 'play none none reverse' },
});

// ---------- green frame: exploded layers ----------
const layers = $$('.axo__layer'), frameItems = $$('.frame__list li');
ScrollTrigger.create({
  trigger: '.frame', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: s => {
    const p = s.progress;
    const sep = smoothstep(clamp(p / 0.55)) * (mobile ? 46 : 80);
    layers.forEach((l, i) => {
      const local = smoothstep(clamp((p - i * 0.12) / 0.3));
      l.style.transform = `translateZ(${i * sep + (1 - local) * 260}px)`;
      l.style.opacity = i === 0 ? 1 : local;
    });
    $('.axo__stack').style.transform = `rotateX(${58 - p * 6}deg) rotateZ(${-40 + p * 26}deg)`;
    const on = Math.min(3, Math.floor(clamp((p - 0.04) / 0.8) * 4));
    frameItems.forEach((li, k) => li.classList.toggle('is-on', k <= on));
  },
});

// ---------- location ----------
$$('.radar__ring').forEach((c, i) => {
  const len = 2 * Math.PI * c.r.baseVal.value;
  gsap.fromTo(c, { strokeDasharray: len, strokeDashoffset: len }, {
    strokeDashoffset: 0, duration: 1.8, delay: i * 0.15, ease: 'expo.out',
    scrollTrigger: { trigger: '.radar', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
});
gsap.from('.radar__tag', {
  scale: 0.6, opacity: 0, stagger: 0.15, duration: 0.9, delay: 0.5, ease: 'back.out(1.8)',
  scrollTrigger: { trigger: '.radar', start: 'top 80%', toggleActions: 'play none none reverse' },
});

// ---------- counters ----------
$$('[data-count]').forEach(el => {
  const end = +el.dataset.count;
  const fmt = v => (end >= 1000 ? Math.round(v).toLocaleString('en-US').replace(/,/g, ' ') : Math.round(v));
  const o = { v: 0 };
  el.textContent = fmt(0);
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'expo.out', onUpdate: () => { el.textContent = fmt(o.v); } }),
  });
});
gsap.from(['.buy__usd', '.buy__ways > *'], {
  y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out',
  scrollTrigger: { trigger: '.buy', start: 'top 70%', toggleActions: 'play none none reverse' },
});

// ---------- Vazisubani ----------
gsap.fromTo('.vaz__mask', { clipPath: 'inset(18% 22% 18% 22% round 30px)' }, {
  clipPath: 'inset(0% 0% 0% 0% round 30px)', ease: 'none',
  scrollTrigger: { trigger: '.vaz__hero', start: 'top 90%', end: 'top 20%', scrub: true },
});
gsap.fromTo('.vaz__mask img', { yPercent: -12, scale: 1.25 }, {
  yPercent: 0, scale: 1, ease: 'none',
  scrollTrigger: { trigger: '.vaz__hero', start: 'top bottom', end: 'bottom top', scrub: true },
});
gsap.from('.stamp', {
  scale: 0, rotate: -120, duration: 1.4, ease: 'back.out(1.5)',
  scrollTrigger: { trigger: '.vaz__hero', start: 'top 50%', toggleActions: 'play none none reverse' },
});
gsap.from(['.vaz__addr', '.vaz__facts > div', '.vaz__sold'], {
  y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out',
  scrollTrigger: { trigger: '.vaz__copy', start: 'top 75%', toggleActions: 'play none none reverse' },
});
$$('.collage__i').forEach(el => {
  const sp = +el.dataset.speed;
  gsap.fromTo(el, { y: () => -sp * window.innerHeight, rotate: sp * 6 }, {
    y: () => sp * window.innerHeight, rotate: -sp * 6, ease: 'none',
    scrollTrigger: { trigger: '.collage', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
  });
  gsap.from($('img', el), {
    scale: 1.35, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom 40%', scrub: true },
  });
});

// ---------- progress strips ----------
$$('.prog__row').forEach(row => {
  gsap.from($$('img', row), {
    x: 120, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: row, start: 'top 85%', toggleActions: 'play none none reverse' },
  });
});

// ---------- about: 2021 ----------
gsap.from('.about__year span', {
  rotateX: -95, yPercent: 30, opacity: 0, stagger: 0.12, ease: 'none',
  scrollTrigger: { trigger: '.about', start: 'top 85%', end: 'center 60%', scrub: true },
});
gsap.to('.about__year span', {
  color: '#ffffff', stagger: 0.1, ease: 'none',
  scrollTrigger: { trigger: '.about', start: 'center 65%', end: 'bottom 50%', scrub: true },
});

// ---------- contact: the tower at night ----------
if (tower) {
  ScrollTrigger.create({
    trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: true,
    onUpdate: s => {
      const p = s.progress;
      TT.camT = 3 + smoothstep(p);
      TT.night = smoothstep(clamp(p * 1.4));
      TT.explode = 0; TT.spread = 0; TT.thin = 0; TT.core = 1; TT.drop = 1; TT.strips = 7;
    },
  });
}
gsap.fromTo(document.body, { backgroundColor: '#16774C' }, {
  backgroundColor: '#04170F', ease: 'none',
  scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 20%', scrub: true },
});
gsap.from('.contact__phone .char', {
  yPercent: 110, opacity: 0, stagger: 0.035, duration: 1.2, ease: 'expo.out',
  scrollTrigger: { trigger: '.contact', start: 'top 55%', toggleActions: 'play none none reverse' },
});
gsap.from(['.contact__addr > div', '.contact__btns .btn'], {
  y: 30, opacity: 0, stagger: 0.07, duration: 1, ease: 'expo.out',
  scrollTrigger: { trigger: '.contact', start: 'top 45%', toggleActions: 'play none none reverse' },
});

// magnetic buttons
$$('.magnetic').forEach(b => {
  const xTo = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  const yTo = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  b.addEventListener('pointermove', e => {
    const r = b.getBoundingClientRect();
    xTo((e.clientX - r.left - r.width / 2) * 0.3);
    yTo((e.clientY - r.top - r.height / 2) * 0.4);
  });
  b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
});

// ---------- per-frame: velocity-driven motion ----------
const railPin = $('.rail__pin');
let vel = 0, railX = 0;
gsap.ticker.add((time, dt) => {
  const v = lenis ? lenis.velocity : 0;
  vel += (v - vel) * 0.12;
  const av = Math.abs(vel);

  // gallery rail: perspective cards, depth-of-field blur off-centre, motion blur on speed
  const pr = railPin.getBoundingClientRect();
  if (pr.bottom > 0 && pr.top < window.innerHeight) {
    const vw = window.innerWidth;
    const maxX = track.scrollWidth - vw;
    railX += (-maxX * railP - railX) * 0.14;
    track.style.transform = `translate3d(${railX}px,0,0)`;
    railWord.style.transform = `translate3d(${railX * 0.35}px,0,0)`;
    const rects = cards.map(c => c.getBoundingClientRect());
    cards.forEach((c, i) => {
      const r = rects[i];
      const n = clamp(((r.left + r.width / 2) - vw / 2) / vw, -1.2, 1.2);
      const blur = mobile ? 0 : Math.min(10, Math.abs(n) * 5 + av * 0.12);
      c.style.transform = `rotateY(${n * -26}deg) translateZ(${-Math.abs(n) * 280}px) skewX(${clamp(vel * -0.08, -6, 6)}deg)`;
      c.style.filter = blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : 'none';
      c.firstElementChild.firstElementChild.style.transform = `translate3d(${n * -7}%,0,0) scale(1.05)`;
    });
  }

  // marquees speed up and flip with scroll direction
  const boost = 1 + av * 0.09;
  const sgn = vel < -0.2 ? -1 : 1;
  marquees.forEach(m => {
    m.x -= m.dir * sgn * boost * dt * 0.06;
    if (m.w) m.x = ((m.x % m.w) - m.w) % m.w;
    m.row.style.transform = `translate3d(${m.x}px,0,0) skewX(${clamp(-vel * 0.25, -10, 10)}deg)`;
  });
});

function smoothstep(t) { t = clamp(t); return t * t * (3 - 2 * t); }

window.addEventListener('load', () => { measure(); ScrollTrigger.refresh(); });
