# Asset manifest

All photography, the emblem and the menu come from Republic's own channels on silkhospitality.com (the operator's site for the venue), fetched 24 Oct 2026. Originals are downloaded by `npm run originals` into `assets-src/originals/` (git-ignored, never modified); `npm run images` writes AVIF + JPEG derivatives at 640/1080/1600/2400 px into `public/img/` (never upscaled).

**Rights:** these are the restaurant's published marketing images, used here for a concept site. Written permission from Republic / Silk Hospitality is still needed before any public launch.

| Slot | Source (silkhospitality.com/media/…) | Original | Used in | Notes |
|---|---|---|---|---|
| `hero` | zdrcuzp0/republic-terrace-3.jpg | 3840×2560 | Hero, phase-two window | Rooftop terrace, Radisson Blu Iveria behind |
| `intro` | szyhepfs/republic-restaurant.jpg | 4000×6000 | Intro | Dining room, Republic emblem on the window |
| `seq-1` | imuluzce/republic-restaurant-4.jpg | 6000×4000 | Noon to six, frame 1 | Glazed room, afternoon |
| `seq-2` | xmsfvhgi/republic-restaurant-3.jpg | 4000×6000 | Noon to six, frame 2 | Evening service, candle |
| `seq-3` | zjdpkd4d/republic-gallery-7.jpg | 1200×801 | Noon to six, frame 3 | Dessert being served; from the Republic gallery — dish not named because the venue/dish is not captioned. Low resolution: max 1200 px |
| `terrace` | t3mdcgmr/resp-rest-new-4.jpg | 8192×5464 | Terrace | Terrace with planters, city view |
| `room-1` | atmbdc2t/republic.jpg | 3000×4500 | The building | Building on the square, TV tower above |
| `room-2` | dsilkshi/republic-gallery-1.jpg | 1920×1280 | The building | Facade |
| `room-3` | lyzblr04/republic-history-3.jpg | 1280×720 | The building | "Restaurant & Terrace" sign at night |
| `evenings` | gvnnx5xz/respu-coming-soon.jpeg | 1600×1200 → crop 1600×520 | Late | Night interior. **Derived:** cropped above the overlaid "Coming soon" text; no other change |
| `square-1..3` | aeppqoz4/republic-history-2.jpg, 2vnke5fl/republic-history-1.jpg, ixneq1q2/republic-history.jpg | ≤1344 px | The square | Archive photos from Republic's History page; small, used at card size only |

Not used, on purpose: Republic 24 and Event Hall photos (different venues), concert posters (past Event Hall events), catering photos, other Silk venues' images, and georgia.travel images (another restaurant).

## Brand

| File | How it was made |
|---|---|
| `assets-src/brand/logo.svg` | From the official `republic-logo.jpg` (756×726): the four red rings re-drawn as exact circles from measured radii (299/269/239/209, stroke 9, colour #DF5446); the "R" vector-traced (potrace). Side-by-side check matched the original. |
| `assets-src/brand/wordmark.svg` | Traced from the official `republic-logo-2.png` (313 px wide). Clean at nav size only; ask the restaurant for the vector wordmark before using it large. |

## Menu

`src/content/menu.js` is a transcription of `Republic_Menu_Food_and_Drinks.pdf` served by the restaurant's QR menu (57 dishes, prices in GEL incl. 18% VAT, allergen codes as printed). Cocktail and drinks menus link to the official PDFs.

## Missing — needs the restaurant

- Kitchen and named-dish photography (Instagram has it, but it requires a login and its CDN was blocked).
- Vector wordmark.
- Video footage, if any.
