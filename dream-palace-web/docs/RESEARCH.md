# Dream Palace — research dossier

Compiled 24 October 2026. Working notes that the website copy is based on.

## How the research was done (and its limits)

The build sandbox's network policy **blocked direct access** to every primary source:
`dreampalace.ge`, `instagram.com`, `korter.ge`, `ss.ge`, `estatehub.ge`, `avezor.ge`,
`madloba.info`, `08.ge`, and also map tiles and image CDNs. Each was tried by browser fetch
and HTTP; all were refused by the proxy or failed DNS.

So:

- **Instagram (`@dream_palace_geo`) was not inspected.** No posts, Reels, logo, colours
  or photos were seen. Nothing on the site claims otherwise.
- **The official website was not inspected.** Its languages, logo and media are unknown.
- Facts below come from **search-engine excerpts** of the listed pages (English, Georgian
  and Russian queries). An excerpt is weaker evidence than the page itself, so every fact
  on the site is attributed and marked "confirm with sales" where it matters.
- **No real photos, renders, floor plans or logo are in this build.** The site uses
  drawings made in code, and each one is labelled as a schematic. The `assets/` README
  explains how to drop in official media.

## Identity

| Item | Finding | Source | Confidence |
|---|---|---|---|
| Name | Dream Palace / დრიმ პალასი | Facebook page title, Korter | High |
| Business | Residential developer, Tbilisi | Facebook ("Real Estate"), Korter | High |
| Address | Bob Walsh Street 10, Tbilisi | Korter project page | Medium |
| Area label | Korter says "Saburtalo", Avezor says "Digomi"; one excerpt even says "Isani" | Korter / Avezor | **Conflict** — site uses "Bob Walsh St 10, Dighomi area, Tbilisi"; Facebook places it near the US Embassy (Didi Dighomi) |
| Phone | +995 598 52 22 22 | Facebook page (official channel) | Medium |
| Phone (alt.) | +995 555 39 56 03 | Avezor listing | Low — not used |
| Email | info@dreampalace.ge | Facebook page | Medium |
| Social | facebook.com/DreamPalace.Georgia · instagram.com/dream_palace_geo | Facebook / brief | High |
| Contact person | "David Sarkisyan" | Korter | Not published on the site |
| Same-name business | hotsale.ge "Dream Palace" at 49 Tina Iosebidze St is a **restaurant / karaoke venue** | hotsale.ge | Different business — ignored |
| Developer name | Avezor once names "Monolith Group" | Avezor | Conflict — not used |

## Project facts

| Fact | Value | Source | Used on site |
|---|---|---|---|
| Construction permit | 12.11.2021 | flatmarket.ge excerpt | Yes, attributed |
| Block 1 | 8 floors, 60 apartments, completed (Q4 2024) | Korter | Yes, attributed |
| Block 2 | 8 floors, 60 apartments, completed (Q4 2025) | Korter | Yes, attributed |
| Developer post | "First block finished, interior work can begin; second block nearing completion" | Facebook (undated) | Supports the above |
| Block 4 | Planned / "coming soon" | Korter | Yes, "planned" |
| Total blocks | Korter says 3 houses in one place, 5 in another; Avezor says 1 | — | **Conflict** — shown as "confirm with sales" |
| Full completion | Q4 2028 | Korter developer page | Yes, as "third-party estimate" |
| Latest construction photos on Korter | November 2025 | Korter | Mentioned in FAQ only |
| Structure | Monolithic frame | Korter | Yes |
| Ceilings | 2.9 m | Korter | Yes |
| Finish | Green frame (unfinished interior) | Korter | Yes |
| Elevators | Yes | Korter | Yes |
| Parking | Underground and surface | Korter | Yes |
| Security | CCTV | Korter | Yes |
| Courtyard | Recreation area, children's playground | Korter | Yes |
| Cadastral code | 01.72.14.009.523 | Korter | FAQ only |
| Land 11,600 m² | — | Brief / unverified | **Not used** |
| Large windows, central utilities | — | Unverified | **Not used** |

## Apartments

The two portals disagree on how they label types:

| Source | Types and areas |
|---|---|
| Avezor (page dated 10.07.2026) | 1-room 32.4–34.7 m² · 2-room 56.9–85.1 · 3-room 96.8–145.2 · 4-room 147 |
| Korter (prices dated 12.05.2026) | studio 32.4 · 1-room 62.4–74.6 · 2-room 56.9–145.2 (looks wrong) · 3-room 85.1–114.1 |

The site uses Avezor's set because it is newer and internally consistent. It uses the
Georgian room-count convention (a "2-room" flat is a living room plus one bedroom). Every
range is labelled "indicative, per avezor.ge, 10.07.2026". No apartment numbers, floors or
availability are shown.

**Prices are not published.** Korter's May 2026 prices (studio from about $32,400, about
$1,000–1,300/m²) and Avezor's 3,419 GEL/m² are old and conflict with each other.

## Purchase

- Down payment of 10% at both portals; internal instalments of up to 15 months (Korter) or
  18 months (Avezor) — **the terms conflict**.
- Korter mentions a TBC Bank mortgage — not confirmed by the developer.
- On the site: no official terms; an illustrative calculator the user sets, plus "the sales
  team confirms current conditions".

## Location (only what could be checked)

- US Embassy: 29 Georgian-American Friendship Ave, Didi Dighomi (Wikipedia). The developer's
  Facebook page says the project is "near the American Embassy".
- Olympic Park in Dighomi with the Olympic Water Sports Complex (50 m pool, training pool,
  children's pool), built for the 2015 European Youth Olympic Festival (In Your Pocket;
  Wikipedia EYOF 2015).
- Nikora supermarket, 30b Bob Walsh St (yell.ge).
- State kindergarten No. 212, Didi Dighomi 3rd micro-district (madloba.info excerpt).
- **No distances or travel times could be measured** (map services were blocked). The
  location diagram is a relationship diagram labelled "not to scale" and links to Google
  Maps.

## Brand notes

Per the brief: a green logo with building silhouettes, white type, gold promotional
accents. This could not be seen first-hand. The palette starts from the brief's
suggestions. The logo slot (`assets/brand/logo.svg`) currently shows a temporary text
wordmark, so the real logo has not been redrawn.

## Communication gaps → site opportunities

1. Facts are scattered and contradictory across portals → one clear, dated "verified
   facts" layer with sources.
2. Real construction progress is the strongest proof → a construction story that shows
   the milestones and the status of each block.
3. Portals show prices without dates → the site shows dates on everything, and no prices.
4. Floor-plan browsing on portals is static → a typology explorer and an area comparison.

## Design references studied (from knowledge; not fetched)

Award-style residential and architecture sites that use scroll-scrubbed construction or
section drawings, sticky "spec" diagrams, kinetic variable-font headlines and plan
explorers. Shared lessons: one strong visual idea carried through the page, typography as
structure, controlled motion on mobile, and fast paths to floor plans and contact. No
layout was copied.
