# Orientiri Lisi — website concept

A bilingual (Georgian / English) landing experience for Orientiri Lisi, the gated community of
24 private-house plots near Lisi Lake, Tbilisi. Research notes, verified facts, the creative
concept and the motion storyboard are in [DESIGN.md](DESIGN.md).

## Run

```bash
cd web
npm install
npm run dev       # http://localhost:5173  (Georgian at /, English at /en/)
npm run build     # static site in dist/
npm run preview   # serve the build
npm run check     # content checks (both languages complete, plot data valid)
```

Stack: Vite + plain HTML/CSS/JS. Pages are rendered at build time from `src/template.js`, so all
content and drawings are in the HTML (fast first paint, works without JavaScript). Fonts are
self-hosted (Noto Serif Georgian, Noto Sans Georgian, Manrope). No animation library is used:
`src/motion.js` is a ~100-line scroll engine (one rAF loop, IntersectionObserver gating,
`position: sticky` pins, native scrolling).

## Before going live

| What | Where | Why |
|---|---|---|
| **Plot data** | `src/content/plots.js` | Areas and sold plots follow the official plan (deck 15.04.2026, confirmed by @orientirilisi on 11.08.2026). The outline is traced by hand. Update `sold` as plots sell. |
| **Official photography** | `src/content/media.js`, `public/media/` | Renders and drone photos from orientiri.ge and the developer deck (15.04.2026) are in place. Ask the developer for full-resolution originals and permission before launch. |
| **Form backend** | `.env` → `VITE_INQUIRY_ENDPOINT` | Without it, the form validates and hands off to the visitor's email app (it never shows a fake "sent" message). |
| **Contacts** | `src/content/site.js` | Taken from the official site via the brief; re-confirm before launch. |
| **Infrastructure timing** | `src/content/copy.js` (`infra.status`, FAQ) | Currently "completion scheduled for the end of 2026 (per the developer)". Update as works progress. |
| **Search indexing** | `index.html`, `en/index.html`, `vercel.json`, `public/robots.txt` | The concept preview is hidden from search engines (noindex). Remove these before the real launch. |
| **Canonical domain** | `src/content/site.js` → `url` | Used for canonical, hreflang and Open Graph URLs. |

## Preview deploy (Vercel)

```bash
cd web
npx vercel --prod   # project name: orientiri-concept
```

## Structure

```
src/content/   copy (ka/en), facts, plot data, photo slots
src/lib/       topography generator, SVG drawings (location, site plan, street section, plates)
src/template.js  page markup
src/motion.js    scroll engine
src/main.js      scenes and interactions
src/styles/main.css
```
