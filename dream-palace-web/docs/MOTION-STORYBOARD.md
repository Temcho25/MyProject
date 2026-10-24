# Living Architecture — motion system and storyboard

Built with the `vizavi-motion` method: one unifying idea, 3–5 variants per scene with the
strongest chosen, a storyboard card per scene, and a mandatory review pass after the first
build. The skill's default deliverable is an MP4 video; this brief asks for a website, so
the brief wins. The site is the deliverable, and Playwright screen recordings were used
only for the motion review.

**Sound:** the site is silent by design. Audio that plays on its own on a property website
hurts usability and accessibility, and the brief does not ask for sound.

## The thread: the datum line

A single gold **datum line** (in architecture, the reference level that heights are measured
from) runs through the whole page:

ground line in the hero → floor slabs in the construction story → walls in the floor plans →
the street in the location diagram → horizon in the final scene.

Every scene starts by drawing this line, then builds structure on top of it. This is the
"structure becomes space" idea in motion.

## Motion tokens (css/tokens.css)

| Token | Value | Use |
|---|---|---|
| `--ease-out` | cubic-bezier(.16,1,.3,1) | reveals, text lines |
| `--ease-arch` | cubic-bezier(.7,0,.2,1) | masks, wipes, plan morphs (heavy start, precise stop) |
| `--ease-settle` | linear() spring approximation | slabs and cards landing (weight, small overshoot) |
| `--t-micro` | 220ms | hover, focus, chips |
| `--t-move` | 640ms | state changes, morphs |
| `--t-reveal` | 1100ms | scene entrances |
| Stagger | 60–90ms | lines, words, list items |

Scroll scenes use **damped progress**: the raw scroll position never moves anything
directly; each scene eases its own value toward it (λ≈0.12/frame at 60 fps, independent of
frame rate). This gives camera-like inertia without hijacking the scroll. There is one
`requestAnimationFrame` loop, and it sleeps when nothing is moving.

**Mobile (<760 px or coarse pointer):** pinned scenes are shorter (about 220 vh instead of
380 vh), there is no pointer parallax, depth blur is off, and the 3D camera tilts are halved.

**Reduced motion:** every scene renders its final state, scroll scenes become static
annotated drawings, the hero shows its finished drawing, and controls still work. Nothing
is hidden behind an animation.

## Scenes

### 01 Opening scene
Variants: (a) the facade elevation draws itself, then the camera rises up it · (b) a giant
wordmark with windows cut out of the letters · (c) the floor plan extrudes into a building
· (d) muted video under technical callouts · (e) a section cut slicing the block.
**Chosen: (a) with the measurement callouts from (d).** This is the most direct statement of
"structure becomes space", and it needs no unverified media.

- Layers: back (two dimmed, depth-blurred silhouettes marked as further phases) · middle
  (an 8-floor elevation drawn stroke by stroke: datum → columns → slabs → window grid) ·
  front (dimension ticks and leader-line labels "8 floors", "+2.90 m", "monolithic frame").
- Text: the headline lines rise out of a mask, and their width grows from 75 % to 100 %
  (variable `wdth` axis) as they arrive. Both CTAs appear by 1.2 s, so nobody waits.
- Camera: a slow drift from the pointer (desktop only). On scroll the drawing tilts back
  (rotateX up to 18°), scales, and the back layers move at 0.4× and 0.7× for parallax.
- Exit: the datum line stretches to full width and becomes the rule that opens scene 02.

### 02 The project revealed
Variants: a kinetic ribbon of facts · a sentence with live numbers · a grid of stat cards ·
a facts strip on a pinned drawing.
**Chosen: an editorial sentence with live numbers.** Facts arrive as part of a sentence
("two completed eight-floor blocks …") and the numbers count up when they enter the
viewport. A dated source line appears under it. Kept deliberately calmer than scene 03.

### 03 From structure to space (signature scene)
Variants: (a) a pinned frame that builds floor by floor, scrubbed by scroll · (b) a
horizontal photo timeline · (c) a before/after slider · (d) a split screen of drawing and
photo.
**Chosen: (a).** It works without photos. It accepts dated photos later (`js/data.js →
media.progress`), and it shows the real order of the work.

- Scroll 0–0.12: datum and foundation · 0.12–0.55: Block 1 rises; columns grow, then each
  of the 8 slabs drops in with a settling overshoot, the crane jib swings, and a short
  blur sells the movement · 0.55–0.8: Block 2 repeats, faster · 0.8–1: the glazing fills,
  and the further phase appears as a dashed "planned" outline.
- Milestone cards are tied to progress: 12.11.2021 permit (flatmarket.ge) · Q4 2024 Block 1
  completed (Korter) · Q4 2025 Block 2 completed (Korter) · Block 4 planned. Each card names
  its source.
- Camera: a slow truck sideways from Block 1 to Block 2 (translateX), with a slight dolly-in
  at the end.
- Exit: the slab lines of the last floor flatten into the plan walls of scene 04.

### 04 Apartments and floor plans
Variants: a cards grid with filters · one plan that morphs between types · an area slider
that drives the plan · a floor-stack selector.
**Chosen: a morphing plan plus filters plus a comparison bar.** The selected type moves its
walls: the SVG rectangles animate their geometry, never the whole picture, so the line
weight stays constant. The area range is drawn as a dimension line. A range comparison of
all types sits underneath. Keyboard: the arrow keys move between type tabs (ARIA tabs).
"Ask about this type" pre-fills the inquiry form.
Labelled "typology scheme — not an official floor plan". When official plans are supplied
(`apartments[].plan`), the image takes over the plan view.

### 05 The building — block status
Variants: a fictional 3D selector (rejected, since the brief forbids it) · an elevation
lineup with status fills · a status table · photos by block.
**Chosen: an elevation lineup.** Completed blocks are solid, planned ones are dashed, and the
status is written as text too (never colour alone). Selecting a block reveals its facts
and source with a vertical "scan" wipe.

### 06 Features — the section explorer
Variants: icon cards · a pinned section drawing that lights up per feature · a horizontal
scroll of feature panels · an accordion.
**Chosen: the interactive section drawing.** Each verified feature lights the part of the
section it refers to: the ceiling dimension grows to 2.90 m, the elevator car travels its
shaft, the basement level highlights for parking, CCTV cones sweep, the frame columns glow,
and green frame shows bare-wall hatching. It runs on hover or tap, and auto-advances only
while the section is in view and the visitor hasn't interacted.

### 07 Location
Variants: a real map embed (blocked here, and heavy) · a relationship diagram · a list ·
an illustrated panorama.
**Chosen: a relationship diagram that is not to scale**, plus a list and a Google Maps
link. The datum line becomes Bob Walsh Street and the connections draw outward. No
distances are shown.

### 08 Gallery
Variants: a horizontal drag strip · a masonry grid · a full-screen carousel · a filmstrip
with lightbox.
**Chosen: a filmstrip with filters (drawings / photos / renders / progress) and an
accessible lightbox** (Esc, arrows, focus trap). Only the drawings exist today. Empty
filters say so plainly.

### 09 Purchase
Steps drawn as a staircase (a datum line rising in steps) plus an illustrative calculator.
Every output is labelled illustrative. The defaults are 10 % down and 12 months, with no
interest.

### 10 FAQ
Accordions using grid-row 0fr→1fr height animation, so there is no JS measuring and no
layout jump.

### 11 Final scene
The elevation from scene 01 comes back as a gold line drawing on the horizon, and the
headline closes the loop. Then contact details and the inquiry form.

## Review pass (mechanic 3)
The findings of the review pass are logged at the end of `README.md`.
