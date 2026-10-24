// Functional and responsive QA. Usage: node tests/qa.mjs [baseUrl]
// Runs against the dev server by default (menu fixture checks need the DEV hook).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fixture from './menu.fixture.js';

const base = process.argv[2] || 'http://127.0.0.1:5173/';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); };
const browser = await chromium.launch();

async function open(w, h, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 600, hasTouch: w < 600, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', locale: opts.locale || 'en-GB' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('requestfailed', (r) => { if (!r.url().startsWith('mailto:')) errors.push('failed: ' + r.url()); });
  await page.goto(base + (opts.query || ''), { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  return { ctx, page, errors };
}

// 1. Responsive: no horizontal overflow, key elements present, at five widths.
for (const [w, h] of [[360, 740], [390, 844], [768, 1024], [1440, 900], [1920, 1080]]) {
  for (const lang of ['en', 'ka']) {
    const { ctx, page, errors } = await open(w, h, { query: `?lang=${lang}` });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    let maxOverflow = 0;
    for (let y = 0; y < total; y += h * 0.7) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
      await page.waitForTimeout(60);
      maxOverflow = Math.max(maxOverflow, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    }
    check(`${w}px ${lang}: no horizontal page scroll`, maxOverflow <= 0, `overflow ${maxOverflow}px`);
    const heroCta = await page.evaluate(() => { scrollTo({ top: 0, behavior: 'instant' }); return [...document.querySelectorAll('.hero__ctas a')].map((a) => a.getAttribute('href')); });
    check(`${w}px ${lang}: hero has booking + menu CTAs`, heroCta.some((h) => h.startsWith('https://eatapp.co/reserve/')) && heroCta.includes('#menu'), heroCta.join(' '));
    const fitsTitle = await page.evaluate(() => { const t = document.querySelector('.hero__title'); return [...t.querySelectorAll('.w')].every((w) => w.getBoundingClientRect().right <= innerWidth + 1); });
    check(`${w}px ${lang}: hero title fits the viewport`, fitsTitle);
    const lang2 = await page.evaluate(() => document.documentElement.lang);
    check(`${w}px ${lang}: html lang set`, lang2 === lang, lang2);
    check(`${w}px ${lang}: no console/page errors`, !errors.length, errors.join(' | '));
    await ctx.close();
  }
}

// 2. Navigation links resolve to sections; external links are correct.
{
  const { ctx, page } = await open(1440, 900);
  const anchors = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1));
  const missing = await page.evaluate((as) => as.filter((h) => !document.querySelector(h)), [...new Set(anchors)]);
  check('all in-page anchors have targets', !missing.length, missing.join(','));
  const ext = await page.evaluate(() => ({
    tel: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.href),
    ig: document.querySelector('[data-instagram-link]').href,
    menu: document.querySelector('[data-menu-link]').href,
    google: document.querySelector('[data-maps="google"]').href,
    apple: document.querySelector('[data-maps="apple"]').href,
    book: [...document.querySelectorAll('[data-book-link], [data-booking-link]')].map((a) => a.href),
  }));
  check('phone links are tel:+995591087172', ext.tel.length >= 3 && ext.tel.every((t) => t === 'tel:+995591087172'), ext.tel.length + ' links');
  check('Instagram link', ext.ig === 'https://www.instagram.com/republic.tbilisi/', ext.ig);
  check('official menu link set', ext.menu.startsWith('https://qr.silkhospitality.com/'), ext.menu);
  check('every Book button opens the official EatApp page', ext.book.length >= 5 && ext.book.every((h) => h === 'https://eatapp.co/reserve/republic-roof-top-7a34d6'), ext.book.length + ' links');
  check('maps links', ext.google.startsWith('https://www.google.com/maps/place/Republic+Restaurant') && ext.apple.startsWith('https://maps.apple.com/'));
  await page.click('.nav__links a[href="#menu"]');
  await page.waitForTimeout(1400);
  const menuTop = await page.evaluate(() => document.querySelector('#menu').getBoundingClientRect().top);
  check('nav link scrolls to Menu', Math.abs(menuTop) < 40, `top ${menuTop.toFixed(0)}`);
  const hrs = await page.evaluate(() => document.querySelector('#reserve [data-hours]').textContent);
  check('official opening hours shown', /12:00–01:00/.test(hrs) && /11:00–06:00/.test(hrs) && /05:00/.test(hrs), hrs.slice(0, 80));
  const imgs = await page.evaluate(() => [...document.querySelectorAll('.slot--photo img')].length);
  check('official photographs rendered in every slot', imgs >= 13, imgs + ' photos');
  const events = await page.evaluate(() => document.querySelector('[data-events]').hidden);
  check('no unverified events displayed', events === true);
  const ld = await page.evaluate(() => JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent));
  check('structured data carries official hours, menu and booking', ld.openingHoursSpecification?.length === 4 && ld.hasMenu && ld.acceptsReservations?.includes('eatapp') && ld.telephone === '+995591087172');
  await ctx.close();
}

// 3. Language toggle.
{
  const { ctx, page } = await open(1440, 900);
  await page.click('.nav [data-lang-toggle]');
  await page.waitForTimeout(300);
  const s = await page.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, h1: document.querySelector('.hero__title').textContent.replace(/\s+/g, ' ').trim(), btn: document.querySelector('.nav [data-lang-toggle]').textContent.trim() }));
  check('language toggle switches to Georgian', s.lang === 'ka' && s.h1.includes('რესპუბლიკაში') && s.btn === 'English', JSON.stringify(s));
  await page.reload({ waitUntil: 'networkidle' });
  check('language choice persists', (await page.evaluate(() => document.documentElement.lang)) === 'ka');
  await ctx.close();
}
{
  const { ctx, page } = await open(1440, 900, { locale: 'ka-GE' });
  check('Georgian browsers get Georgian by default', (await page.evaluate(() => document.documentElement.lang)) === 'ka');
  await ctx.close();
}

// 4. Mobile drawer: open, focus, Escape, link navigation.
{
  const { ctx, page } = await open(390, 844);
  await page.click('[data-burger]');
  await page.waitForTimeout(700);
  const st = await page.evaluate(() => ({ exp: document.querySelector('[data-burger]').getAttribute('aria-expanded'), vis: !document.querySelector('[data-drawer]').hidden, focus: document.activeElement.closest('[data-drawer]') !== null }));
  check('drawer opens with focus inside', st.exp === 'true' && st.vis && st.focus, JSON.stringify(st));
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  const trapped = await page.evaluate(() => !!(document.activeElement.closest('[data-drawer]') || document.activeElement.matches('[data-burger]')));
  check('drawer traps focus', trapped);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  check('Escape closes drawer', await page.evaluate(() => document.querySelector('[data-drawer]').hidden && document.activeElement.matches('[data-burger]')));
  await page.click('[data-burger]');
  await page.waitForTimeout(700);
  await page.click('.drawer__links a[href="#evenings"]');
  await page.waitForTimeout(1600);
  const top = await page.evaluate(() => document.querySelector('#evenings').getBoundingClientRect().top);
  check('drawer link navigates and closes', Math.abs(top) < 40 && (await page.evaluate(() => document.querySelector('[data-drawer]').hidden)), `top ${top.toFixed(0)}`);
  const bar = await page.evaluate(() => document.querySelector('[data-actionbar]').classList.contains('is-on'));
  check('mobile action bar visible mid-page', bar);
  await ctx.close();
}

// 5. Menu: official data, tabs, keyboard, allergen filter.
{
  const { ctx, page } = await open(1440, 900);
  await page.evaluate(() => document.querySelector('#menu').scrollIntoView());
  await page.waitForTimeout(500);
  check('menu renders 7 official categories', (await page.locator('[role="tab"]').count()) === 7);
  const first = await page.evaluate(() => [...document.querySelectorAll('.dish__name')].map((n) => n.firstChild.textContent.trim()));
  check('starters list matches the official menu', first.length === 10 && first[0] === 'Ekala with walnuts & tkemali', first.slice(0, 2).join(' | '));
  await page.focus('[role="tab"][aria-selected="true"]');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);
  const sel = await page.evaluate(() => ({ t: document.querySelector('[role="tab"][aria-selected="true"] span').textContent, items: [...document.querySelectorAll('.dish__name')].map((n) => n.firstChild.textContent.trim()) }));
  check('arrow key switches category and list', sel.t === 'Soups' && sel.items[0] === 'Chicken soup chikhirtma', JSON.stringify(sel).slice(0, 120));
  check('prices shown in lari', await page.evaluate(() => document.querySelector('.dish__price').textContent.includes('₾')));
  await page.click('.chip-a[data-n="1"]');
  const dim = await page.evaluate(() => ({ dimmed: document.querySelectorAll('.dish.is-avoided').length, total: document.querySelectorAll('.dish').length }));
  check('allergen filter dims dishes containing gluten', dim.dimmed > 0 && dim.dimmed < dim.total, JSON.stringify(dim));
  check('featured dishes come from the menu', (await page.locator('.feat').count()) === 4);
  await ctx.close();
}

// 7. Reduced motion: no pinned stages, content readable, all sections visible.
{
  const { ctx, page, errors } = await open(1440, 900, { reduced: true });
  const st = await page.evaluate(() => ({
    motion: document.documentElement.classList.contains('motion'),
    heroH: document.querySelector('.hero').offsetHeight,
    kitchenH: document.querySelector('.kitchen').offsetHeight,
    roomPinned: document.querySelector('.room').classList.contains('is-pinned'),
    hidden: [...document.querySelectorAll('[data-reveal], .is-split .wi')].filter((e) => getComputedStyle(e).opacity === '0' || getComputedStyle(e).transform !== 'none' && getComputedStyle(e).transform !== 'matrix(1, 0, 0, 1, 0, 0)').length,
  }));
  check('reduced motion: no motion class, no pinned scenes', !st.motion && st.heroH <= 900 && st.kitchenH < 2000 && !st.roomPinned, JSON.stringify(st));
  check('reduced motion: all copy visible without animation', st.hidden === 0, `${st.hidden} hidden`);
  check('reduced motion: no errors', !errors.length, errors.join('|'));
  await ctx.close();
}

// 8. Keyboard: skip link and visible focus.
{
  const { ctx, page } = await open(1440, 900);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(450);
  const skip = await page.evaluate(() => ({ cls: document.activeElement.className, top: document.activeElement.getBoundingClientRect().top }));
  check('first Tab focuses visible skip link', skip.cls === 'skip' && skip.top >= 0, JSON.stringify(skip));
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check('focus ring visible on nav', ring !== 'none', ring);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  → ' + r.info}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
