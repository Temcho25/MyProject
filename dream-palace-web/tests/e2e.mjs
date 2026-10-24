// End-to-end checks with Playwright. Run: npm start (in another shell), then npm test.
// Requires the `playwright` package and a Chromium build (see README).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const root = fileURLToPath(new URL('..', import.meta.url));

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failures++; };
const GEORGIAN = /[Ⴀ-ჿ]/;

const server = spawn(process.execPath, ['scripts/serve.mjs', String(PORT)], { cwd: root, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

const browser = await chromium.launch();
async function page(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.errors = errors;
  return p;
}

try {
  // ---------- Languages ----------
  for (const lang of ['ka', 'en', 'ru']) {
    const p = await page();
    await p.goto(`${BASE}?lang=${lang}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    ok(await p.evaluate(() => document.documentElement.lang) === lang, `[${lang}] html lang attribute`);
    if (lang !== 'ka') {
      const leftovers = await p.evaluate((src) => {
        const re = new RegExp(src);
        return [...document.querySelectorAll('[data-i18n], [data-apt-detail], [data-block-detail], [data-faq], [data-feature-list], [data-places], [data-milestones], [data-gallery-filters]')]
          .filter((el) => re.test(el.textContent)).map((el) => el.dataset.i18n || el.className).slice(0, 5);
      }, GEORGIAN.source);
      ok(leftovers.length === 0, `[${lang}] no untranslated Georgian text ${leftovers.join(', ')}`);
      ok(!GEORGIAN.test(await p.title()), `[${lang}] translated <title>`);
    }
    ok(p.errors.length === 0, `[${lang}] no console errors ${p.errors.join(' | ')}`);
    await p.context().close();
  }

  // ---------- Desktop interactions ----------
  {
    const p = await page();
    await p.goto(BASE, { waitUntil: 'networkidle' });

    // Language switch round trip.
    await p.click('[data-lang="en"]');
    await p.waitForTimeout(400);
    ok((await p.textContent('#hero-title')).includes('From structure'), 'language switch to EN updates hero');
    ok(new URL(p.url()).searchParams.get('lang') === 'en', 'language is reflected in the URL');
    await p.click('[data-lang="ka"]');
    await p.waitForTimeout(400);
    ok(GEORGIAN.test(await p.textContent('#hero-title')), 'language switch back to KA restores source text');

    // Nav links point at real sections.
    const missing = await p.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.querySelector(h)));
    ok(missing.length === 0, `all in-page links resolve ${missing.join(', ')}`);

    // Apartments: tabs, keyboard, slider.
    await p.click('[data-apt-tabs] [data-id="r3"]');
    ok(await p.getAttribute('[data-apt-tabs] [data-id="r3"]', 'aria-selected') === 'true', 'apartment tab click selects type');
    ok((await p.textContent('[data-apt-detail]')).includes('96'), 'apartment detail shows the selected range');
    await p.focus('[data-apt-tabs] [data-id="r3"]');
    await p.keyboard.press('ArrowRight');
    ok(await p.getAttribute('[data-apt-tabs] [data-id="r4"]', 'aria-selected') === 'true', 'arrow key moves to next apartment tab');
    await p.$eval('[data-area-input]', (el) => { el.value = '33'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    ok(await p.getAttribute('[data-apt-tabs] [data-id="r1"]', 'aria-selected') === 'true', 'area slider selects the matching type');
    await p.$eval('[data-area-input]', (el) => { el.value = '45'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    ok((await p.textContent('.apt-detail__match')).length > 0, 'slider outside every range reports the nearest type');

    // Ask about type → pre-fills the form.
    await p.click('[data-apt-detail] [data-ask]');
    await p.waitForTimeout(900);
    ok((await p.inputValue('#f-msg')).includes('მ²'), '"ask about this type" pre-fills the inquiry message');

    // Blocks.
    await p.click('[data-block-tabs] [data-id="b4"]');
    ok((await p.textContent('[data-block-detail]')).includes('დაგეგმილი'), 'block tab shows planned status text');

    // Features.
    await p.click('.feat[data-id="parking"]');
    ok(await p.getAttribute('[data-section-svg] svg', 'data-active') === 'parking', 'feature click highlights the section drawing');

    // Location.
    await p.click('.place__btn[data-id="olympic"]');
    ok(await p.$eval('.loc-node[data-id="olympic"]', (n) => n.classList.contains('is-active')), 'location list item highlights the diagram node');

    // Gallery filters + lightbox.
    await p.click('[data-gallery-filters] .chip:nth-child(3)');
    ok(await p.isVisible('.plate--empty'), 'empty gallery filter shows an honest empty state');
    await p.click('[data-gallery-filters] .chip:nth-child(1)');
    await p.click('.plate >> nth=0');
    ok(await p.isVisible('[data-lightbox]'), 'lightbox opens');
    await p.keyboard.press('ArrowRight');
    ok((await p.textContent('[data-lb-cap]')).includes('2 / 5'), 'lightbox arrow key navigation');
    await p.keyboard.press('Escape');
    ok(await p.isHidden('[data-lightbox]'), 'Escape closes the lightbox');

    // Calculator math.
    await p.fill('#calc-price', '65000');
    await p.$eval('#calc-down', (el) => { el.value = '10'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.$eval('#calc-months', (el) => { el.value = '12'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    const monthly = (await p.textContent('[data-calc-o="monthly"]')).replace(/\D/g, '');
    const down = (await p.textContent('[data-calc-o="down"]')).replace(/\D/g, '');
    ok(monthly === '4875' && down === '6500', `calculator: 65 000, 10%, 12 mo → 6 500 down, 4 875 / month (got ${down}, ${monthly})`);
    await p.$eval('#calc-months', (el) => { el.value = '7'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    ok((await p.textContent('[data-calc-o="monthly"]')).includes('≈'), 'non-integer monthly result is marked approximate');

    // FAQ.
    await p.click('.qa__q >> nth=0');
    ok(await p.getAttribute('.qa__q >> nth=0', 'aria-expanded') === 'true', 'FAQ opens');
    await p.click('.qa__q >> nth=0');
    ok(await p.getAttribute('.qa__q >> nth=0', 'aria-expanded') === 'false', 'FAQ closes');

    // Form: validation, no-backend path, then mocked backend success + failure.
    await p.fill('#f-msg', '');
    await p.click('[data-submit]');
    ok((await p.textContent('[data-err="name"]')).length > 0 && (await p.textContent('[data-err="phone"]')).length > 0, 'empty form shows field errors');
    ok(await p.getAttribute('#f-name', 'aria-invalid') === 'true', 'invalid field gets aria-invalid');
    await p.fill('#f-name', 'ნინო');
    await p.fill('#f-phone', '+995 555 12 34 56');
    await p.fill('#f-email', 'bad@');
    await p.check('#f-consent');
    await p.click('[data-submit]');
    ok((await p.textContent('[data-err="email"]')).length > 0, 'malformed optional email is rejected');
    await p.fill('#f-email', '');
    await p.click('[data-submit]');
    const st = await p.textContent('[data-form-status]');
    ok(await p.$eval('[data-form-status]', (n) => n.classList.contains('inquiry__status--warn')) && (await p.$('[data-form-status] a[href^="mailto:"]')) !== null, 'without a backend the form says so and offers email (no fake success)');
    ok(!/მადლობა/.test(st), 'no success message without a backend');

    await p.context().close();
  }

  // ---------- Form with a configured backend ----------
  for (const [status, expectOk] of [[200, true], [500, false]]) {
    const p = await page();
    await p.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.DP_CONFIG = { formEndpoint: '/api/inquiry', salesEmail: 'info@dreampalace.ge', logo: '' };" }));
    let payload = null;
    await p.route('**/api/inquiry', async (r) => { payload = r.request().postDataJSON(); await r.fulfill({ status, body: '{}' }); });
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.fill('#f-name', 'Nino');
    await p.fill('#f-phone', '555123456');
    await p.check('#f-consent');
    await p.click('[data-submit]');
    await p.waitForTimeout(300);
    const cls = await p.$eval('[data-form-status]', (n) => n.className);
    if (expectOk) ok(payload?.name === 'Nino' && !cls.includes('err') && !cls.includes('warn'), 'configured backend: 2xx shows success and sends JSON');
    else ok(cls.includes('err'), 'configured backend: 5xx shows an error, not success');
    await p.context().close();
  }

  // ---------- Mobile: drawer + overflow at several widths ----------
  for (const [w, h] of [[360, 740], [375, 812], [390, 844], [768, 1024], [1280, 800], [1920, 1080]]) {
    const p = await page({ viewport: { width: w, height: h } });
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } });
    const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(over <= 0, `${w}px: no horizontal overflow (${over}px)`);
    if (w < 1081) {
      await p.evaluate(() => scrollTo(0, 0));
      await p.click('[data-burger]');
      await p.waitForTimeout(800);
      ok(await p.isVisible('[data-drawer]'), `${w}px: drawer opens`);
      ok(await p.evaluate(() => document.activeElement?.closest('[data-drawer]') !== null), `${w}px: focus moves into the drawer`);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(800);
      ok(await p.isHidden('[data-drawer]'), `${w}px: Escape closes the drawer`);
      await p.click('[data-burger]');
      await p.waitForTimeout(800);
      await p.click('.drawer__list a[href="#apartments"]');
      await p.waitForTimeout(1200);
      ok(await p.isHidden('[data-drawer]') && (await p.evaluate(() => Math.abs(document.getElementById('apartments').getBoundingClientRect().top) < 120)), `${w}px: drawer link navigates and closes`);
    }
    ok(p.errors.length === 0, `${w}px: no console errors ${p.errors.join(' | ')}`);
    await p.context().close();
  }

  // ---------- Reduced motion ----------
  {
    const p = await page({ reducedMotion: 'reduce' });
    await p.goto(BASE, { waitUntil: 'networkidle' });
    ok(await p.$eval('.hero__title .line > span', (n) => getComputedStyle(n).transform === 'none'), 'reduced motion: hero headline visible immediately');
    await p.evaluate(() => document.getElementById('construction').scrollIntoView());
    await p.waitForTimeout(300);
    ok((await p.textContent('[data-build-floor]')) === '08', 'reduced motion: construction shows the finished state');
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.build__sticky')).position) === 'relative', 'reduced motion: no pinned scroll section');
    const hidden = await p.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((n) => getComputedStyle(n).opacity === '0').length);
    ok(hidden === 0, 'reduced motion: no content left hidden behind reveals');
    ok(p.errors.length === 0, 'reduced motion: no console errors');
    await p.context().close();
  }

  // ---------- No JavaScript: content is still there ----------
  {
    const p = await page({ javaScriptEnabled: false });
    await p.goto(BASE);
    const text = await p.textContent('main');
    ok(text.includes('ბობ უოლშის') && text.includes('მწვანე კარკას'), 'without JS the Georgian content and facts are present');
    ok(await p.$eval('#project-title .line > span', (n) => getComputedStyle(n).transform === 'none'), 'without JS headings are not hidden');
    await p.context().close();
  }
} finally {
  await browser.close();
  server.kill();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
