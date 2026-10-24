# Asset manifest

**Status: no official asset is in the site yet.** The build sandbox could not reach Instagram, Facebook, silkhospitality.com, restaurant.republic.ge or any image CDN (see `RESEARCH.md`), so nothing could be downloaded, inspected or rights-checked. Every image position renders an abstract "light study" (CSS gradients, clearly not a photograph) with a small "Official photograph pending" label. Turn the labels off with `showAssetLabels: false` in `src/content/site.js` once photos are in.

## How to add the real photography (≈10 minutes)

1. Put original, untouched files in `assets-src/originals/` named after the slot (`hero.jpg`, `kitchen-3.jpg`, …). Any of jpg/png/webp/tif/heic.
2. Put the official logo as `assets-src/brand/logo.svg`.
3. Run `npm run images`. It writes AVIF/WebP/JPEG derivatives at 480–2560 px into `public/img/`, never upscales, never touches the originals, and warns about files too small for full-bleed use.
4. `npm run build`.

Slots update automatically (responsive `srcset`, intrinsic size to prevent layout shift, lazy loading below the fold, high fetch priority for the hero). The typographic wordmark is replaced by `logo.svg` everywhere. Add `og:image` in `index.html` from the hero derivative.

## Slots

| Slot / file | Category | Section | Aspect | What the slot needs | Min width |
|---|---|---|---|---|---|
| `hero` | Hero | 01 Hero → window | 16:9 (4:5 crop on phones) | Widest evening shot of dining room or terrace | 2560 |
| `kitchen-1` | Kitchen | 03 Kitchen frame 1 | 3:2 | Kitchen at work: hands, fire, preparation | 1600 |
| `kitchen-2` | Kitchen | 03 Kitchen frame 2 | 3:2 | A dish being finished or plated | 1600 |
| `kitchen-3` | Food | 03 Kitchen frame 3 | 3:2 | A signature dish as served (name it — a dish may only be named on the site if the photo is that dish) | 1600 |
| `room-1` | Interiors | 05 The room | 4:5 | Dining room, evening, wide | 1200 |
| `room-2` | Interiors | 05 The room | 1:1 | Glassware or table detail | 1000 |
| `room-3` | Interiors | 05 The room | 3:2 | Atmosphere with guests (consent required) | 1600 |
| `room-4` | Interiors | 05 The room | 4:5 | Bar, drinks or wine service | 1200 |
| `room-5` | Food | 05 The room | 1:1 | A second dish | 1000 |
| `evenings` | Live events | 06 Evenings | 4:5 | A live evening: piano, vocalist, room listening | 1200 |
| `terrace` | Terrace & location | 07 Terrace | 21:9 (4:5 on phones) | Terrace with city view, dusk/night | 2560 |
| `closing` | Interiors | 09 Closing | 3:4 | Late-evening table, candle or low light | 1000 |
| `logo.svg` | Branding | Nav, closing | vector | Official Republic emblem/wordmark | — |

Source descriptions and alt text (EN/KA) live in `src/content/assets.js`.

## Inventory of candidate sources (not yet accessed)

| Source | Expected content | Access from sandbox | Rights |
|---|---|---|---|
| instagram.com/republic.tbilisi | Food, interiors, live-evening promos, Reels | Blocked | Restaurant-owned; confirm photographer credits |
| facebook.com/RepublicRestaurantGeorgia | Albums, event posters | Blocked | Confirm page is current |
| silkhospitality.com (Republic pages) | Professional interior/terrace photography, possibly logo | Blocked | Operator-owned; ask Silk Hospitality marketing |
| restaurant.republic.ge | Legacy site photography | Blocked | May show an earlier concept — check before use |
| qr.silkhospitality.com menu asset | Menu PDF/images | Blocked | Use for menu text, not imagery |

No stock, AI-generated or third-party photographs were used, and none should be — the brief and this build rely on authentic Republic photography only.

## Other assets

| Asset | Source | Licence |
|---|---|---|
| Noto Serif Georgian (variable, wght + wdth) | npm `@fontsource-variable/noto-serif-georgian@5.3.0` | SIL OFL 1.1 |
| Noto Sans Georgian (variable) | npm `@fontsource-variable/noto-sans-georgian@5.3.0` | SIL OFL 1.1 |
| Cormorant Garamond (variable, roman + italic) | npm `@fontsource-variable/cormorant-garamond@5.3.0` | SIL OFL 1.1 |
| `public/favicon.svg` | Made for this build: a plain serif "R" | Provisional — replace with the official mark |
