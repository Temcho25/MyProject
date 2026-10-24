# QA log

Per the vizavi-motion skill, the first build was treated as a draft and reviewed in the browser before anything was called finished. Format: **where → observation → cause → fix → re-check**.

## Iteration 1 → 2 (first full build, 1440 × 900 and 390 × 844)

| Where | Observation | Cause | Fix | Re-check |
|---|---|---|---|---|
| Hero, phase 2 | Grey haze over the ivory surround while the plate contracts | Veil gradient sat outside the clip | Veil moved into the plate (`::after`), fades with `--e` | Screens d3 ✔ |
| Hero, phase 2 | White headline ghosting over ivory | Content faded too slowly (×2.2) | Fade ×3.4, travel shortened | Screens d3, video ✔ |
| Kitchen | Step artefact at frame edges during the curtain | Outgoing frame scaled to 0.955 from the top | No frame scaling; outgoing image drifts up inside its own frame, dimmed | Screens d3, video ✔ |
| Section boundaries | Light text briefly on ivory (Room, Terrace → Reserve) | Fixed backdrop changed colour on a 900 ms timer, not with position | Removed backdrop; each section owns its colour with a soft gradient band that scrolls with the content | Screens d3, m1 ✔ |
| Section bands | Muddy grey mid-tones | sRGB interpolation ivory↔espresso | `in oklab` interpolation plus a warm brass mid-stop | Screens m1 ✔ |
| Reservation | "Reserve a table" platform button visible although no platform exists | `.btn {display:inline-flex}` beat `[hidden]` | Global `[hidden]{display:none!important}` | QA test ✔ |
| Room track | Cards overlapping at depth extremes | Depth parallax factor 900 px | 380 px and wider gaps | Video ✔ |
| Evenings | Staff lines stopped short of the edge | Dash length in screen px vs path length | `pathLength="1"` | Screen ev ✔ |
| Mobile | Ivory "Reserve" bar invisible over ivory sections | Same colour as surface | Burgundy action bar, SVG phone icon | Screens k1 ✔ |
| Mobile, Georgian | Hero title touching the right edge at 375 px | Clamp minimum too large for Georgian word length | 10.6 vw below 520 px, no indent | QA "title fits" at 360/390 ✔ |
| Reduced motion | Intro headline missing | It lives in the hero's phase 2, which is off | Moved into the intro section when motion is reduced | QA reduced-motion ✔ |
| Performance (hero) | Heavy frames in software rendering | Clip-path re-rasterising its content | Image and content promoted to their own layers; nav blur removed | Hero median 116 → 66 ms in headless software mode |

## Automated checks (`npm run qa`)

- Dev server (with menu fixture hook): **85 / 85 pass**.
- Production build (`vite preview`): **81 / 81 pass** (the 4 fixture checks need the dev-only hook).

Covered: no horizontal scroll and hero title fit at 360, 390, 768, 1440, 1920 px in EN and KA; hero CTAs; `html lang`; zero console/page errors and failed requests; every in-page anchor has a target; tel/mailto/Instagram/menu/maps links; nav scroll; language toggle, persistence and Georgian-browser default; drawer open/focus/trap/Escape/link; mobile action bar; honest menu empty state; menu tabs, arrow keys, expandable details and GEL prices (fixture); form validation (required, past date, phone, email), focus to first error, live error summary, mailto request content, "not confirmed until the restaurant replies"; reduced-motion layout with all copy visible; skip link and focus ring; structured data without hours/menu; no unverified events shown.

## Performance (headless Chromium, software rendering — pessimistic)

| Run | Median frame | p90 | CLS |
|---|---|---|---|
| 390 × 844, CPU ×4 | 33 ms | 67 ms | 0.001 |
| 1440 × 900, CPU ×1 | 33 ms | 100 ms | 0.002 |

Bundle: JS 16 KB gz, CSS 13 KB gz, no animation library. Fonts load per script via `unicode-range`.

## Not verified

- **Real devices, including iOS Safari** — none were available. The sticky/clip-path scenes are standard CSS, but smoothness on a real iPhone must be checked before launch.
- **GPU-accelerated frame rate** — measurements above are software-rendered.
- **Real photography** — composition, crops and colour were reviewed with placeholders only. Re-review every slot after `npm run images`.
- **Screen readers** — semantics and ARIA were tested programmatically, not with VoiceOver/NVDA.
- **The official menu URL** opens the operator's QR asset; its content could not be opened from the sandbox.
- **Sound** — the site has none by design (see `DIRECTION.md`); nothing to listen to.

## Iteration 3 — real content (after the owner's review: "there's nothing on the site")

The first build shipped placeholders because no official source was reachable. With silkhospitality.com open, the site was rebuilt around real material: official photos in every slot, the real emblem (animated rings), the full 57-dish menu with allergen filter, official hours, EatApp booking, the square's history. Fixes found in review:

| Where | Observation | Fix | Re-check |
|---|---|---|---|
| Building track | Cards covered the heading | Lower, shorter cards; heading on a fading band | Screens r3 ✔ |
| Late, mobile | Clock overflowed the right edge | Single column on phones, smaller clock | QA overflow 360/390 ✔ |
| Logo trace | R came out inverted | Inverted bitmap threshold; compared with original | Screens ✔ |

`npm run qa` on the production build: **80 / 80 pass** (adds: 7 official categories, starters match the PDF, allergen filter, every Book button → EatApp, official hours shown, ≥13 official photos rendered, structured data with hours/menu/booking).
