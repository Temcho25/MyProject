# Dream Palace — Living Architecture

A motion-driven website for the Dream Palace residential complex (10 Bob Walsh St, Tbilisi).
It is a static site with no build step and no runtime dependencies: plain HTML, CSS, ES
modules and SVG.

- Languages: Georgian (default, source text in `index.html`), English, Russian
  (`?lang=en|ru`, remembered per visitor).
- Concept and motion system: [`docs/MOTION-STORYBOARD.md`](docs/MOTION-STORYBOARD.md)
- Facts, sources and conflicts: [`docs/RESEARCH.md`](docs/RESEARCH.md)

## Run

```bash
npm start          # http://localhost:4173  (node scripts/serve.mjs)
npm run check      # static checks: syntax, translations complete, mixed-script typos, asset paths, secrets
npm test           # Playwright end-to-end checks (needs `playwright` + Chromium installed)
```

Deploy by uploading the folder to any static host. Nothing has to be compiled.

## Still needs configuration

| Item | Where | Status |
|---|---|---|
| **Form backend** | `js/config.js → formEndpoint` | Empty. The form validates input and then tells the visitor plainly that online sending isn't connected, offering a pre-filled email and the phone number. It never shows a fake success. Set this to an endpoint that accepts JSON `{name, phone, email, topic, message, consent, lang, page}`; a 2xx response shows success. |
| **Official logo** | `assets/brand/logo.svg` + `js/config.js → logo` | Missing. A temporary text wordmark "DREAM PALACE" is shown. |
| **Official photos / renders / progress / video** | `assets/media/` + `js/data.js → media` | None yet. The gallery shows only schematic drawings and an honest empty state. See `assets/media/README.md`. |
| **Official floor plans** | `js/data.js → apartments[].plan` | None. A labelled typology scheme is shown instead. |
| **Fact check by the developer** | `docs/RESEARCH.md` | Every fact comes from third-party portals. Confirm with sales: total number of blocks, Block 4 timing, what "green frame" includes, instalment terms, phone number. |
| Canonical URL | `index.html` `<link rel="canonical">`, `og:url` | Assumes `https://www.dreampalace.ge/`. |

## Structure

```
index.html            all sections, Georgian source copy, SEO + JSON-LD
css/tokens.css        colour, type, spacing and motion tokens
css/main.css          layout, components, responsive + reduced-motion rules
css/fonts.css         self-hosted Noto Sans/Serif Georgian (variable wdth+wght) + Manrope
js/motion.js          one rAF loop, damped scroll scenes, reveals, tween
js/svg.js             SVG builders (self-drawing paths, schematic elevation)
js/hero.js            01 opening: self-drawing facade, living windows, scroll/pointer camera
js/build.js           03 pinned construction chronicle (crane, slabs, viewBox camera)
js/apartments.js      04 typology explorer: tabs, area slider, morphing plan, comparison
js/blocks.js          05 block status lineup
js/features.js        06 interactive section drawing
js/location.js        07 relationship diagram
js/gallery.js         08 filmstrip, filters, lightbox
js/purchase.js        09 illustrative calculator, 10 FAQ
js/form.js            inquiry form (validation, honest no-backend state)
js/nav.js             header, active-section datum, mobile drawer
js/data.js            all facts with sources (edit content here)
js/i18n.js            EN/RU dictionaries, number formatting
```

## How motion is built

- **One thread:** a gold *datum line* runs through every scene. It is the ground line, then
  the slabs, the plan walls, the street, and finally the horizon.
- **Scroll scenes** (hero, construction, final) read the native scroll position and apply
  frame-rate-independent damping. That gives camera inertia without scroll-jacking. The
  loop sleeps when nothing moves, and scenes outside the viewport don't update.
- **Construction chronicle:** the SVG `viewBox` is the camera. Keyframes truck from Block 1
  to Block 2 and then pull back. Columns grow per floor, and the crane trolley carries each
  slab, which lands with a settling overshoot. A vertical blur scaled to on-screen speed
  acts as motion blur. Portrait screens get a tighter lens that follows the active block.
- **Typography:** headlines rise out of line masks while the variable `wdth` axis opens from
  70 % to the final width (on Georgian; Latin and Cyrillic use Manrope, which has no width
  axis). Numbers count up. Language switching dips the text out and back in.
- **Micro-interactions:** button fills rise like a slab, the nav indicator slides under the
  active section, tabs draw a gold base line, the plan morphs its walls (not the whole
  picture), FAQ uses `grid-template-rows` 0fr→1fr, and the drawer opens with a clip-path.
- **Reduced motion:** every scene shows its finished state and nothing is pinned. All
  content is visible, and the controls still work. **No JS:** all Georgian content and facts
  are present, and headings are not hidden.
- **Sound:** none. This is deliberate for a property website (see the storyboard).

## QA log (24 Oct 2026)

Checked in headless Chromium 1.63 (Playwright). **Not tested on real iOS Safari or Android
devices**, which should be checked before launch.

- `npm run check`: all static checks pass. That covers 99 translation keys in EN and RU, no
  mixed-script typos, all asset paths, and no secrets in client code.
- `npm test`: all end-to-end checks pass:
  - all three languages (no untranslated text, `lang` and `<title>` update)
  - no console errors
  - every in-page link resolves
  - apartment tabs, arrow keys and the area slider
  - "ask about this type" pre-fills the form
  - blocks, features and location interactions
  - gallery filters, empty state, lightbox (arrows / Esc)
  - calculator maths (65 000 at 10 % over 12 months gives 6 500 down and 4 875 a month)
  - FAQ
  - form validation, the no-backend state, and a mocked backend for both success and failure
  - mobile drawer (focus moves in, Esc closes, link navigates and closes)
  - no horizontal overflow at 360, 375, 390, 768, 1280 and 1920 px
  - reduced motion
  - JS disabled
- Frame timing while scrolling each section at 1280×720: median and p95 are both 16.7 ms
  (60 fps), with no frame over 17 ms.
- Visual review: screenshots at desktop, tablet and mobile in KA, EN and RU, plus a recorded
  scroll-through checked frame by frame.

Issues the review found and fixed:

- the hero headline overlapped the drawing, and the labels were clipped
- glazing and foundation timing were overwritten by elements with the same name
- the construction drawing spilled over the heading
- plates in the gallery never drew
- the staircase in "how to buy" was misaligned
- the final drawing crossed the headline
- Georgian decimals printed as "2.9" instead of "2,9"
- the "147 m²" chart label caused 13 px of horizontal overflow on mobile
- the drawing in the construction scene was tiny in portrait
- the closed mobile drawer stayed focusable because `display: flex` overrode `hidden`
- the Russian headline was too wide
- a layout read happened inside the scroll loop
