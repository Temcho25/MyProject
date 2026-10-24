# Orientiri Lisi — design brief, research notes and storyboard

## 1. What was researched and how

The official sites (orientiri.ge, grea.ge, grgroup.ge) and Instagram could **not be opened
in a browser** from the build environment: its network policy blocks those hosts, and the
remote fetch tool could not resolve any `.ge` domain. Research was therefore done through
web-search results that quote the official pages. Nothing below was invented; anything that
could not be confirmed is left for the sales team to answer.

### Verified facts (used on the site)

| Fact | Source (as quoted in search results) |
|---|---|
| Boutique neighbourhood for private houses near Lisi Lake, planned for **24 families** | orientiri.ge, grea.ge/en/project/25 |
| **300 m** from Lisi Lake, **500 m** from Leo Kvachadze Street | orientiri.ge |
| Pedestrian path to the lake | orientiri.ge |
| **Four schools** within a 500 m radius | orientiri.ge |
| Land plots **from 1,000 m²** | orientiri.ge (Georgian) |
| Closed neighbourhood with an **individual access system** | orientiri.ge |
| Each plot: fence **up to 1.8 m** (concrete plinth + deck material), **4 m gate** and an entrance door | orientiri.ge |
| Individually connected per plot: outdoor lighting, electricity, water, gas, sewage, internet, stormwater; paved roads; sidewalks | orientiri.ge, grea.ge/en/news/37 |
| Built by **GRG** (in the market since 2013; Tskneti–Betania road, Batumi overpass) | grea.ge/en/news/37 |
| **GREA** manages the commercial direction exclusively, from October 2025 | grea.ge/en/news/37 |
| Project financed by **TBC Bank** | orientiri.ge |
| Infrastructure works have begun; completion scheduled **by the end of 2026** | orientiri.ge (latest); GREA earlier said spring 2026 |
| Lisi Lake: 41°44′34″N 44°44′08″E, ~0.47 km², ~3 km perimeter path | Wikipedia, georgia.to, greatruns.com |
| Contacts: +995 596 316 316 · 032 2 500 316 · info@grea.ge | Provided in the brief from the official site; not re-confirmed online |

### Deliberately not published

* Plot numbers, individual areas, prices, sold/reserved status — no current official data was reachable.
* Discounts (55,000 GEL offers were advertised in Dec 2025 and Jul 2026; they are time-limited).
* Mortgage rates (a 7.4 % TBC figure appears only on an aggregator).
* Third-party claims that contradict the developer (crypto payments, "apartments", March 2026).

## 2. Audit (from the quoted content, not a visual inspection)

* The strongest content is factual and spatial — distances, scale, fences, gates, utilities — but it
  is presented as a list. The site never *shows* what 1,000 m², a 1.8 m fence or a 300 m walk mean.
* The product is land. The new narrative is explicit about this: you buy a plot, you build your house.
* The plot picker is the conversion point; it must lead straight to an inquiry for a specific plot.
* Time-sensitive claims (dates, discounts) age badly; the new site states dates with their source.

## 3. Concept — "ორიენტირი / a bearing"

*Orientiri* means a landmark, a reference point. The site is art-directed as a **survey of a
place**: contour lines, bearings, measured distances and architectural drawings. Instead of
generic villa photography, every image is either the official photography (slots are ready in
`src/content/media.js`) or a drawing built from verified specifications. This keeps the site
honest while giving it a distinct identity.

Palette: architectural blue `#16336A` (night/plan scenes), emerald `#0A7A61` (bearings,
selection), limestone `#EFECE4`, ivory `#FAF8F3`, graphite `#161A1A`, mineral `#959A94`.
Type: Noto Serif Georgian (display, its width axis is animated), Noto Sans Georgian (UI),
Manrope (figures and technical labels).

## 4. Storyboard (vizavi-motion, mechanic 2)

For each scene, 3–5 options were considered and one was chosen for the whole arc:
*arrive from above → understand the place → choose a plot → understand what is included →
see the details → trust → act.*

| Scene | Options considered | Chosen | Why |
|---|---|---|---|
| 01 Hero | a) slow zoom on a render · b) camera descending through layered contour topography · c) compass rotating to north · d) split photo/text | **b + c** | Depth from three planes moving at different rates; bearing ring turns to north as you arrive. Works without photography. |
| Hero → Intro | a) fade · b) plot-shaped square opening from the site marker · c) horizontal wipe · d) colour cross-fade | **b** | The next scene is literally revealed through "a plot". |
| 02 Intro | a) stats grid · b) sentence with inline measured numerals that read in at scroll pace · c) ruler with ticks | **b** | Facts are read as one sentence, not a dashboard. |
| 03 Location | a) map with pins · b) pinned schematic with distance rings drawn per step · c) photo sequence · d) timeline | **b** | Each distance is drawn when it is read. Schematic, clearly labelled not-to-scale. |
| 04 Plots | a) grid of cards · b) plan tilting from perspective into plan view, plots drawn from the gate outwards · c) zoomable map · d) list | **b** | A spatial arrival into the plan; selecting a plot draws its dimension frame. |
| 05 Infrastructure | a) icon cards · b) pinned horizontal street cross-section drawn as you scroll · c) exploded diagram · d) checklist | **b** | Shows what is underground and at the boundary in one continuous drawing. |
| 06 Drawings | a) masonry gallery · b) asymmetric plate wall + lightbox · c) carousel | **b** | Plates breathe; lightbox for detail. Official renders slot in first. |
| 07 Team | a) logo row · b) typographic credits like a drawing title block · c) cards | **b** | No logos implying endorsement; roles are stated precisely. |
| 08 Process / FAQ | a) stepper · b) numbered path + accordion · c) chat | **b** | Simple and accessible. |
| 09 Closing | a) photo + form · b) return to the night topography, CTA and form · c) map | **b** | Closes the loop opened by the hero. |

Motion system: durations 240 / 480 / 900 / 1400 ms; `--ease-out: cubic-bezier(.16,1,.3,1)`,
`--ease-io: cubic-bezier(.65,0,.35,1)`. Only transform, opacity, clip-path and SVG stroke offsets
are animated. One `requestAnimationFrame` loop runs only while scrolling and only for scenes in
view. No scroll hijacking: pinned scenes use `position: sticky` and native scroll. With
`prefers-reduced-motion`, all scrubbing is replaced by final states.

Skill notes: vizavi-motion is written for rendered video (MP4 export, music, motion blur).
For a website its directing, depth, typography and review mechanics were applied; MP4 export
and a soundtrack were intentionally not produced, since autoplaying sound on a property site would
hurt the experience.
