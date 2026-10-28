# Thalassa Group — redesign storyboard

**Idea.** *Thalassa* is Greek for "sea". The site is one continuous journey: from the open sea,
up the slope of Green Cape, into the building, onto a floor, into an apartment — and back to people (contact).
The S-shaped wave from the logo is the recurring motion signature (preloader, reveal edge, dividers, footer).

Palette: deep sea `#06141c`, brand blue `#2E8CB7` (from the logo), foam `#eef3f2`, sand `#e9dfcf`,
facade wood `#b57a4f`, botanical green `#5d8a5a`. Type: Cormorant Garamond (display) + Jost (UI) + Noto Georgian.

| # | Scene | Options considered | Chosen |
|---|-------|--------------------|--------|
| 1 | Hero | a) video loop of a render b) static render + big title c) **live WebGL sea (Gerstner waves, dawn sun) with the camera rising** d) particle logo | **c** — the camera skims the water, letters of THALASSA rise out of the sea with motion blur, scroll lifts the camera. |
| 2 | Sea → building | a) fade b) zoom into the horizon c) **a tide shaped like the logo wave rises and floods the screen, revealing the render** d) split curtains | **c** — clip-path wave edge + foam line, render settles from 1.25× scale (depth). |
| 3 | 800 m | a) map b) **counter 0→800 on a drone photo with a path drawn from the site to the sea** c) timeline | **b** |
| 4 | About | a) two columns b) **scroll-lit manifesto (words light up as you read) + stats + 8 drawn icons** c) cards | **b** |
| 5 | Day / night | a) toggle b) slider c) **scroll scrubs the clock 12:00→22:00, sunset tint, windows switch on floor by floor (mask rising from the ground)** | **c** + manual toggle |
| 6 | Choose a floor | a) image hotspots (old site) b) list c) **3D maquette: drag to orbit, hover pulls a floor out like a drawer, click opens the plan with live statuses** | **c** + accessible floor list |
| 7 | Vision | a) grid b) slider c) **3D ring of renders rotating with scroll, depth blur on far cards, lightbox** | **c** |
| 8 | Reality | a) grid b) **horizontal pinned strip of drone photos with inner parallax and velocity skew** c) before/after | **b** |
| 9 | VR + contact | **VR card → Kuula tour in a modal; contact with the animated wave footer, form → sales@** | — |

Rhythm: slow, breathing camera in scenes 1–2; tighter, informative in 3–6; playful in 7–8; calm close.
Sound (optional, off by default due to autoplay rules): synthesized surf + soft pad, swelling with scroll velocity.
Reduced motion: all scroll scenes collapse to static, readable layouts.
