# A Night at Republic — creative direction and motion storyboard

## The thread

One evening, told by scrolling. The page starts at dusk over First Republic Square and ends at the last candle. Scroll position is the passage of the evening: the backdrop cools from espresso to night ink as the visitor moves from the square, to the table, the kitchen, the room, the music and the terrace — and the closing scene asks for the reservation.

The single recurring carrier is **light on a surface**: a warm glow that is a window on the square in the hero, a plate under a lamp in the kitchen, a brass hairline in the menu, a candle in the closing scene. Abstract placeholder "light studies" use the same grammar, so the site holds together before and after the official photographs arrive.

Brand: the real Republic emblem is described as a circular mark with a central letterform and fine red rings. Until the official SVG is supplied the site uses a typographic wordmark (the restaurant's name set in type), never a redrawn emblem. Fine burgundy hairlines nod to the rings without imitating the mark.

## How the vizavi-motion skill was applied to a website

The skill is written for rendered video (camera, MP4 export, score). Its three core mechanics were translated, not copied:

| Skill mechanic | Web translation |
|---|---|
| 1. Quality: continuous camera, depth layers, typography in action, weight/inertia | Scroll acts as the camera. Every scroll-linked value runs through a damped spring (weight, no jitter). Foreground type, mid-ground image and background tone move at different rates. Headlines act: width axis of Noto Serif Georgian opens on entrance, Latin letter-spacing settles. Motion blur only on type ghosts (never on photographs — brief has priority). |
| 2. Direction before build: 3–5 variants per scene, storyboard cards | Below. |
| 3. Mandatory iteration after the first build | First build treated as a draft; browser review at 5 widths, fixes logged in `QA.md`. |
| Default MP4 + music/SFX | Not the deliverable — the brief asks for a website. No autoplay sound (hostile on a restaurant site). A silent walkthrough recording was made for review only and is labelled as such. |
| Prefer vanilla HTML/CSS/JS + own timeline | No animation library. ~1 small scroll engine (`src/motion/`), IntersectionObserver reveals, CSS for timing. |

## Motion language

| Token | Value | Use |
|---|---|---|
| `--ease-pour` | `cubic-bezier(.22,1,.36,1)` | Entrances. Fast start, long settle — like wine settling in a glass. |
| `--ease-lift` | `cubic-bezier(.65,0,.35,1)` | Symmetric transitions (tabs, drawer). |
| `--ease-press` | `cubic-bezier(.3,0,.2,1)` | Hover/press feedback. |
| Durations | 180 ms press · 320 ms UI · 700 ms text line · 1200 ms image unveil | |
| Stagger | 60–90 ms per line/word group, never per letter for body text | |
| Scroll spring | stiffness 0.12/frame lerp, settles < 400 ms | All scroll-linked transforms |
| Image scale budget | 1.00–1.08 max | Protects food photography |
| Reduced motion | No scroll-linked transforms, no pinned sequences, opacity-only reveals at 200 ms | |

## Storyboard

Each scene: variants considered → chosen → card.

### 01 Hero — "Dusk over the square"

Variants: (a) full-bleed still with slow drift; (b) split layout, image right, type left; (c) circular aperture opening on black; (d) video loop of the dining room; (e) full-bleed plate that **contracts into a framed window** as you scroll, handing the image to the next scene.
**Chosen: (e)** — it creates a causal link into the intro (the city becomes a table view) and works with a still. (c) was rejected as too close to the emblem rings; (d) because no verified footage exists.

| Field | Plan |
|---|---|
| Action | On load: title lines rise from masks, Georgian title width opens 72%→100%, Latin tracking 0.18em→0.02em. On scroll: plate clip-path insets to a window, image counter-scales 1.08→1.0, headline drifts up faster than the image (depth). |
| Layers | Fore: type + CTAs. Mid: image plate. Back: tone field. |
| Exit | The framed window settles beside the intro text. |
| Risk | Clip-path cost on mobile → tested; GPU-friendly inset only. |

### 02 Introduction — "The table is set"

Variants: (a) centred manifesto paragraph; (b) asymmetrical editorial spread with a pull quote; (c) giant numeral "I" with text wrapped around; (d) sentence that builds word by word on scroll.
**Chosen: (b)** with a single scroll-linked hairline that draws under the headline. Warm ivory surface — first tone change, dark to light, feels like a cloth laid on the table.

### 03 Kitchen sequence — "The art of the plate"

Variants: (a) carousel; (b) pinned stage where frames rise like a lit curtain; (c) horizontal filmstrip; (d) split screen with sticky text and scrolling images; (e) zoom-through.
**Chosen: (b)** pinned stage (sticky, no hijacking). Each new frame is uncovered bottom-up by a clip; the outgoing frame recedes (scale 0.96, dims) for depth. A numeral counter rolls 01→03. (e) rejected — aggressive zoom distorts food.

### 04 Menu — "Tonight's table"

Variants: (a) PDF link only; (b) tabs with crossfading lists; (c) accordion categories; (d) two-column printed-menu typography with category rail.
**Chosen: (b)+(d)** — ARIA tablist rail, brass indicator slides between tabs, lists leave up/arrive up in staggered rows, dish rows expand for details. Ships with an honest empty state (no verified menu) linking to the official menu and phone.

### 05 Atmosphere — "The room"

Variants: (a) masonry grid; (b) vertical-scroll-driven horizontal track; (c) full-screen slideshow; (d) stacked cards.
**Chosen: (b)** on desktop: pinned track, cards at three depths moving at different speeds, oversized ghost title with velocity blur. Mobile: native swipe track with snap and buttons — deliberate, not shrunk.

### 06 Live evenings — "When the piano starts"

Variants: (a) event cards with dates; (b) typographic poster; (c) five staff lines that react to scroll velocity; (d) waveform visual.
**Chosen: (b)+(c)** — no verified dates exist, so no cards. Staff lines draw in, then ripple with the visitor's scroll speed — the music answers movement. Points to Instagram for the schedule.

### 07 Terrace & location — "Above First Republic Square"

Variants: (a) embedded map; (b) huge address typography that widens on scroll; (c) photo with pinned annotations; (d) drawn skyline.
**Chosen: (b)** with direction buttons (Google/Apple Maps). (d) rejected — would invent geography; (a) avoided to keep third-party weight off the page.

### 08 Reservation — "Your table"

Variants: (a) third-party widget; (b) phone-first card; (c) request form composing an email; (d) WhatsApp.
**Chosen: (b)+(c)**. No booking platform was found and no backend exists, so the form validates, then opens the guest's email app with a prepared request to reservations@republic.ge, and says plainly that the restaurant confirms by reply. `bookingUrl` in config switches every CTA to an official platform when one exists.

### 09 Closing — "Until tonight"

Variants: (a) plain footer; (b) candle glow following the pointer over the contact details; (c) giant wordmark; (d) closing line + CTA.
**Chosen: (b)+(d)**. The glow lags the pointer (inertia); on touch it breathes slowly. Footer carries address, phone, email, socials, hours-status.

## Tone progression (backdrop)

dusk `#1d1a17` → ivory `#f5f0e8` (intro, menu, reservation) → espresso `#171411` (kitchen, room) → night ink `#11131a` (evenings, terrace) → candle `#171411`. Each section owns its colour; the boundary is a soft oklab gradient band (with a warm brass mid-stop between light and dark) that travels with the scroll. A timed fixed backdrop was tried first and dropped in QA — it let light text sit on ivory for a moment.
