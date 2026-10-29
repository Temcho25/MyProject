# Sasperia Restaurant — website concept

A redesign proposal for **Sasperia Restaurant, Mtskheta** (sasperia.ge), built as a static site:
a photo hero, light scroll motion, a standalone QR menu and three languages (ქართული / English / Русский).

All copy, prices, dishes, wines, hours, addresses and photos come from Sasperia's own published
material (sasperia.ge, its menu, bar, wine and cocktail pages, the v-card, the reservation module and
the Instagram profile), captured on 2026-10-29. Russian is a translation of that copy. Nothing was invented.

## What is inside

The site is built to stay smooth on phones: no 3D engine, no animation libraries, no sound.
Phones use native scrolling; motion is CSS only (`transform`/`opacity`), started once when a
section appears. On a desktop with a mouse, a few scroll layouts are added by one light scroll
handler (`.rich` mode).

| Chapter | Phone | Desktop |
|---|---|---|
| Hero | Their photo of the gold medallion in the arch, full screen; title rises in | Same photo in an arched frame beside the title, slight parallax |
| About us | Aragvi and Mtkvari lines draw and meet once; their About text | Same, rivers stay beside the text |
| Our specials | Swipe carousel of the 4 dishes from their homepage | Pinned track moved by scroll, cards turn as they pass |
| Digital menu + QR | Phone mockup with the live menu, QR card | Phone turns with scroll |
| Bar | Signature/classic cocktails, fan of their photos, Sasperia Art cappuccino | Fan opens with scroll |
| Wine | The four "Sasperia" wines with prices, their bottle photo, grape names | — |
| Spaces | Swipe gallery of their interior photos; five areas | Photos on a ring that turns with scroll |
| Location | Their Instagram map redrawn; parking and walking texts | — |
| Booking | Same fields as their form; request to call or e-mail | — |
| QR menu (`#menu`) | 64 dishes with photos, bar, 31 wines, 12 cocktails; tabs, chips, search, dish sheet | — |

Scripts loaded: `qrcode-generator` (QR code), `js/data.js`, `js/i18n.js`, `js/app.js`.

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

The promo MP4 sent with the pitch was rendered from the first version of the site (with the 3D
hero and sound), which was later replaced by this lighter build for phone performance.

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
js/app.js           languages, reveals, desktop scroll scenes, QR menu, booking
js/i18n.js          interface text (ka/en/ru) and contacts
js/data.js          generated menu data
assets/             their photos (WebP) and the vector emblem/wordmark
docs/STORYBOARD.md  scene plan with the options considered
tools/              data build
```
