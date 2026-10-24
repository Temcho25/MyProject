# A Night at Republic

Website for **Republic Georgian Restaurant**, First Republic Square, Tbilisi ([@republic.tbilisi](https://www.instagram.com/republic.tbilisi/)). Bilingual (ქართული / English), scroll-choreographed, no animation library.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/ (static, deploy anywhere)
npm run images     # originals in assets-src/ → responsive derivatives
npm run qa         # functional + responsive checks (needs dev server running)
```

## Before launch — needs the restaurant

The build could not reach the restaurant's own channels (see `docs/RESEARCH.md`). Until these arrive, the site shows no photos, no dishes and no hours rather than inventing them:

1. **Photography + logo** → `assets-src/`, then `npm run images` (`docs/ASSETS.md`).
2. **Status**: one operator page says "temporarily closed for renovations". Confirm.
3. **Opening hours** → `site.hours` in `src/content/site.js`.
4. **Street number** (6 vs 1 First Republic Square) → `site.address`.
5. **Menu** with prices/allergens → `src/content/menu.js` (signature dishes appear automatically).
6. **Live evenings** dates → `site.events` (past dates never show).
7. **Booking platform**, if any → `site.bookingUrl` (all Reserve buttons switch to it).

## Map

| Path | What |
|---|---|
| `index.html` | Semantic page, English fallback copy, structured data (verified facts only) |
| `src/content/` | Facts (`site.js`), copy (`i18n.js`), image slots (`assets.js`), menu |
| `src/motion/engine.js` | One rAF loop: cached offsets, damped scroll progress, sleeps when settled |
| `src/motion/scenes.js` | The storyboard: hero window, kitchen curtain, room track, staff lines, terrace width, candle glow |
| `src/motion/text.js` | Word masks grouped into rendered lines for editorial reveals |
| `src/ui/` | Language, image slots, menu tabs, reservation request, drawer |
| `docs/` | Research log, creative direction & storyboard, asset manifest, QA log |
