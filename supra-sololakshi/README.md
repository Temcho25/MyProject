# Supra Sololakshi — website concept

Three self-contained pages (vanilla HTML/CSS/JS, no build step):

| File | Purpose |
|---|---|
| `index.html` | Main website: hero, the supra story, "the table is set" dishes sequence, our space, gallery, visit/contact |
| `menu.html` | Mobile-first digital menu: search, category chips, Georgian/English, call-to-reserve bar |
| `qr.html` | QR-menu presentation + print studio: real QR code, SVG/PNG download, A6 table card or QR-only print |

Open any page directly in a browser, or serve the folder (e.g. `python3 -m http.server`) so the QR page can detect its own address.

## Where to edit facts

- `index.html` → `SITE_CONFIG` (phones, hours, address, links, image slots, gallery)
- `menu.html` → `MENU_CONFIG` and `MENU` (categories, dishes, prices; set `verified: true` to hide the demo notice)
- `qr.html` → `RESTAURANT_CONFIG` (`publicBaseUrl`, `menuPath`, card phone/address)

The three config blocks are separate because each page is self-contained — keep phones/hours in sync.

## Needs confirmation from the owners

- **Menu:** the dishes in `menu.html` are standard Georgian dishes used as *demonstration data*; prices are intentionally empty. Replace with the official menu (linked from linktr.ee/Supra.Sololakshi).
- **Phones:** reservations `+995 511 55 87 29` (Linktree), general `+995 579 794 794` (Instagram profile). Confirm which to publish.
- **Hours:** `11:00 – 00:00` (Instagram profile); public listings differ.
- **Photos:** two reference images from hotsale.ge are wired in but were not visually verified; all other image slots show the ornamental fallback. Replace with restaurant-owned photography (food, interior, terrace).
- **Instagram / Facebook URLs** and the production **domain** (`publicBaseUrl`).

## QR behaviour

- `file://` → no QR is generated; the page asks for the public website address.
- `http://localhost` / private IP → QR is generated but flagged "for testing only".
- Deployed on http(s) → QR encodes `<site>/menu.html` automatically (or `publicBaseUrl + menuPath` when set).

QR library: qrcode-generator by Kazuhiko Arase (MIT), embedded inline in `qr.html`.
