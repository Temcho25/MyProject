# Sasperia — scroll storyboard

> Update: the 3D hero, the 3D bottle and the sound were removed after phone testing (scroll lag).
> The hero now uses their photo of the medallion in the arch; see README for the current build.

**Thread.** The Sasperia medallion (two deer guarding a face, spirals of water) rises from the
night river at Mtskheta, the camera follows the water to the confluence of the Aragvi and the
Mtkvari, and the scroll then walks the guest through the kitchen, the bar, the wine, the rooms, the
road there and finally the table. Every line of copy comes from sasperia.ge, the v-card, the
reservation module or the Instagram profile. Russian is a translation of that copy.

**Brief constraints.** Phone first (320–430 px widths, notches, landscape), three languages
(KA / EN / RU), a standalone QR menu, 3D in the hero, motion that reacts to scroll, nothing invented.

Each scene lists the options considered and the one chosen.

## 0 · Preloader
| Option | Idea |
|---|---|
| A | The emblem strokes draw themselves, then fill with gold |
| B | Tiles of the deer pattern assemble into a square |
| C | A 0–100 counter in the wordmark letters |
| D | A single river line flows into a circle |

**Chosen: A + D.** The ring is drawn as a river line, then the inner figures draw on and fill.
It introduces the hero object before it becomes 3D. Exit: the drawn emblem scales into the screen
spot of the 3D emblem (match cut).

## 1 · Hero — "life is beautiful"
| Option | Idea |
|---|---|
| A | Extruded gold medallion above a dark moving river, gold dust with depth of field |
| B | A 3D table set with dishes |
| C | A tunnel of photographs |
| D | Particle deer forming from dust |

**Chosen: A.** Their real vector logo extruded in three.js, lit with an environment map.
Foreground: near motes, large and soft (out of focus). Mid: emblem. Background: river surface with
a moving gold reflection streak. Camera: slow orbit and breathing, pointer parallax; on scroll it
arcs, drops toward the water while the emblem turns and recedes. Type: "SASPERIA" letters rise
from a mask; Georgian wordmark; "Cuisine of ancient Georgia"; hours. Headline skews with scroll
velocity (motion-blur cue). Exit: emblem sinks, canvas fades into the river lines of scene 2.

## 2 · Confluence — About us
| Option | Idea |
|---|---|
| A | Two glowing river lines draw with scroll and merge into one |
| B | Satellite-style map zoom |
| C | Two photographs that slide together |

**Chosen: A.** Labels "Aragvi" and "Mtkvari" on the lines; About-us paragraphs highlight word by
word with scroll. Exit: the merged line becomes the rule of the dishes section.

## 3 · Our specials
| Option | Idea |
|---|---|
| A | Pinned horizontal track of 4 cards turning in 3D as they pass the centre |
| B | Vertical stack with sticky photos |
| C | Rotating plate carousel |

**Chosen: A**, driven by vertical scroll on every screen. Photo moves against its card.

## 4 · Sasperia Digital Menu + QR
| Option | Idea |
|---|---|
| A | A 3D phone turning toward the guest, showing the live menu, beside a QR card |
| B | Flat QR with a category list |
| C | Floating dish photos around a QR |

**Chosen: A.** The phone screen is the real menu, scrolling. The QR opens the standalone menu.

## 5 · Bar — "Our signature cocktails" / "Every moment has a story"
| Option | Idea |
|---|---|
| A | Deck of cocktail photos that fans out in 3D with scroll |
| B | Full-bleed photo per drink |
| C | Liquid fill animation |

**Chosen: A** + signature list with prices + the Sasperia Art cappuccino.

## 6 · Wine — "From our vineyards"
| Option | Idea |
|---|---|
| A | 3D bottle turning with scroll; label changes between the four Sasperia wines |
| B | Grape cluster of particles |
| C | Map of regions |

**Chosen: A** + marquee of the Georgian grapes on the list with their regions.

## 7 · Rooms — "Art in details"
| Option | Idea |
|---|---|
| A | Photos on a 3D cylinder that turns with scroll |
| B | Masonry grid |
| C | Hover list revealing photos |

**Chosen: A**, with the five areas from the booking form. Photos are not labelled with room names:
the site does not say which room each one shows.

## 8 · Route — "All roads lead to Sasperia"
Redrawn version of their Instagram map (river, parking, crossing, Svetitskhoveli, "2 min").
The dotted route draws with scroll. Copy from the reservation module.

## 9 · Reserve a table
Same fields as their booking form. On submit the guest gets a summary to send by phone or e-mail;
in production this posts to their existing reservations plugin.

## Sound
Off by default. When enabled: river noise and a low drone, a soft pluck when a chapter pins.

## Risks checked first
1. Extruding the SVG emblem in three.js (holes, winding) — probe render.
2. Phone performance — quality tiers, pixel-ratio cap, pause when hidden or off-screen.
3. Georgian glyphs in display fonts — fall back to Noto Serif Georgian.
