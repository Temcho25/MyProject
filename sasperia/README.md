# Sasperia Restaurant — website concept

A redesign proposal for **Sasperia Restaurant, Mtskheta** (sasperia.ge), built as a static site:
3D hero, scroll-driven chapters, a standalone QR menu and three languages (ქართული / English / Русский).

All copy, prices, dishes, wines, hours, addresses and photos come from Sasperia's own published
material (sasperia.ge, its menu, bar, wine and cocktail pages, the v-card, the reservation module and
the Instagram profile), captured on 2026-10-29. Russian is a translation of that copy. Nothing was invented.

## What is inside

| Chapter | What happens |
|---|---|
| Preloader | The emblem's lines draw like a river, then fill with gold |
| Hero | Their vector emblem extruded in gold (three.js), floating over a moving night river; gold dust with depth of field; the camera arcs and dives on scroll |
| About us | Two river lines (Aragvi, Mtkvari) draw and meet; their About text lights up word by word |
| Our specials | The 4 dishes from their homepage on a pinned horizontal track; cards turn in 3D as they pass |
| Digital menu + QR | A 3D phone showing the live menu, and a QR that opens the menu view |
| Bar | Signature and classic cocktails with prices; a fan of their cocktail photos; the Sasperia Art cappuccino |
| Wine | A 3D bottle that turns with scroll; its label changes between the four "Sasperia" wines on their list |
| Spaces | Their interior photos on a 3D ring; the five areas from the booking form |
| Location | Their Instagram map, redrawn: parking, crossing, Svetitskhoveli, 2 min; parking and walking texts from the booking module |
| Booking | Same fields as their form; produces a request to call or e-mail |
| QR menu (`#menu`) | 64 dishes with photos, bar, 31 wines, 12 cocktails; tabs, category chips, search, dish sheet with drag-to-close, language switch |

Sound is off by default; the button in the top bar turns on a quiet river ambience with soft plucks
at chapter changes (Web Audio, no files). The scene plan is in [docs/STORYBOARD.md](docs/STORYBOARD.md).

## Live preview

https://sasperia-concept.vercel.app — QR menu: https://sasperia-concept.vercel.app/#menu  
The preview is marked `noindex` (meta tag + `X-Robots-Tag` in `vercel.json`) so search engines do not list it as Sasperia's site. Remove both when it goes live on sasperia.ge.

## Run locally

```bash
cd sasperia
python3 -m http.server 8080
# open http://localhost:8080          (site)
# open http://localhost:8080/#menu    (QR menu, what the table QR should point to)
```

Any static host works (Netlify, Vercel, GitHub Pages, the existing server). Set the final address in
one place so the printed QR points to it:

```html
<script>window.SASPERIA_SITE_URL = 'https://sasperia.ge/';</script>  <!-- before js/app.js -->
```

Deep links: `#menu`, `#menu-bar`, `#menu-wine`, `#menu-cocktails`. Add `?lang=ka|en|ru` to force a language.

## Updating content

- Menu, bar, wine, cocktails: `tools/build_data.py` (+ `tools/ru_menu.py` for Russian) → `python3 tools/build_data.py` regenerates `js/data.js`.
- Interface text in three languages: `js/i18n.js`.
- Phone, e-mail, map links, social links: bottom of `js/i18n.js` (`SASPERIA_CONTACT`).

## Booking

The current form builds the request and offers Call / E-mail / Copy. In production it should post to
their existing reservations plugin (`sasperia-reservations`) — the fields are the same
(time 12:00–00:00 every 30 min, 1–10+ guests, five areas, comment).

## Promo video

`tools/capture.js` renders the site frame by frame into an MP4 with the same ambient sound:

```bash
node tools/capture.js http://localhost:8080/index.html out 60 540 960 2 ka   # 1080×1920, 60 fps
```

## Notes for the pitch: issues on the current sasperia.ge

Found while collecting the content (2026-10-29):

- `sasperia.ge/en/menu/` shows "No posts were found" — the English food menu is empty; English only works via the toggle on the Georgian page.
- `/en/bar`, `/en/wine`, `/en/coctails`, `/en/presentation` return 404.
- 19 of 64 dishes show a grey placeholder instead of a photo (e.g. Pkhali plate, Soup Kharcho, Elarji, Lava cake, most sauces).
- The English description of the Cheese Cake repeats the Walnut Cake ingredients (Georgian is correct: cream, cream cheese, eggs, sugar, flour).
- Typos in English names: "Souces", "Norvegian", "Betroot", "Potatos"; "Khinkali" loses "5 pcs".
- The homepage "Chicken Salad" (chicken liver, jonjoli…) differs from the menu's "Chicken Salad With Nadughi" (chicken fillet…) at the same price.
- The English About page still ends with "We are preparing to welcome you soon".
- The footer contains leftover theme demo text: "35903 Gasser BorgoCity, Orianaveneto State, Savona 79939, Italy, +48 69 3495939".
- No Russian version.

This concept fixes the English typos and the cheesecake line; everything else is shown as published.

## Files

```
index.html          page
css/style.css       design tokens and layout (mobile first)
js/app.js           languages, scroll scenes, QR menu, booking
js/hero3d.js        3D emblem + river + dust (three.js)
js/bottle3d.js      3D wine bottle
js/audio.js         ambient sound (Web Audio)
js/i18n.js          interface text (ka/en/ru) and contacts
js/data.js          generated menu data
assets/             their photos (WebP) and the vector emblem/wordmark
docs/STORYBOARD.md  scene plan with the options considered
tools/              data build, video capture
```
