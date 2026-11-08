# Motion direction (vizavi-motion applied to a website)

The `vizavi-motion` skill is written for video. For a website we keep its three mechanics:
a single idea driving every scene, a storyboard with alternatives per scene, and a review pass
after the first build. Video-only parts (MP4 export, music, sound design) don't apply to a
sales site and are **not** part of this build. Sound on a travel site would autoplay against
visitors' wishes and hurt conversions.

**Idea:** *the camera of the panda photographer.* The logo is a panda holding a camera inside a red
brush-circle. The site behaves like that camera: it focuses (blur → sharp), pans across layers of
landscape, and frames China inside the red arc.

## Storyboard

| # | Scene | Options considered | Chosen | Camera / layers | Type | Exit |
|---|---|---|---|---|---|---|
| 1 | Hero | ① muted video loop · ② 3-tour split collage · ③ animated route map · ④ layered photo + brand sun-arc | **④** — fastest LCP, works on phones, uses the logo motif; no licensed video available | Slow Ken Burns push on the Zhangjiajie photo; scroll dollies the photo slower than the content (parallax), mist band drifts, red arc draws itself, city chips in front move fastest with blur ∝ scroll speed; desktop pointer tilts layers | Headline words rise out of masks with a slight rotation and tracking that tightens ("focus settling"); "China" in red italic | Content lifts and fades as the photo keeps moving → hand-off to the marquee |
| 2 | Marquee | ① static list · ② scroll-scrubbed text · ③ endless band | **③** | — | Large serif city names, solid/outline alternating, red diamond separators | Black band cuts to paper background |
| 3 | Tours | ① carousel · ② stacked cards · ③ grid with staggered focus-pull | **③** | Cards rise with blur → sharp; photo inside slowly zooms on hover | Underline draws in red | — |
| 4 | Why us | ① icon grid · ② numbered editorial list + sticky photo | **②** | Sticky photo opens with a mask wipe and counter-parallax | Big red numerals | — |
| 5 | Destinations | ① slider · ② bento mosaic | **②** | Tiles open with mask wipes (iris-like), staggered | — | each tile → its guide |
| 6 | Included | ① checklist · ② dark tile grid | **②** | Ring in the background drifts on its own parallax plane | — | — |
| 7 | Booking steps | ① cards · ② timeline line that draws | **②** | Line grows, nodes pop in sequence | — | — |
| 8 | Private tours | ① plain banner · ② parallax photo panel | **②** | Photo moves on its own plane inside a rounded frame | — | — |
| 9 | Gallery strip | ① grid · ② horizontal snap strip | **②** (thumb-friendly on mobile) | — | — | — |
| 10 | Tour page route | ① map · ② vertical timeline that draws while photos wipe in | **②** | Red line scales down the route; city photos alternate left/right | City names large serif | — |

## Review pass (done after the first build)
- Checked: reduced-motion fallback, no content hidden without JS (`.no-js`), no layout shift
  from reveals (only opacity/transform/filter/clip-path are animated), mobile hero height uses `svh`.
- The hero chips are hidden on phones (too busy on small screens); the arc and mist stay.
