# Thalassa Group — redesign concept

Static site (no build step). Open `index.html` through any static server:

```bash
cd thalassa-site && python3 -m http.server 8765   # → http://localhost:8765
```

Deploy: `npx vercel thalassa-site` (or drag the folder into Netlify). `?lang=ka|en|ru` forces a language.

## What's inside

| Scene | Tech |
|---|---|
| Hero — live sea at dawn, letters rise from the water | Three.js shader (Gerstner waves, sky, sun glitter) |
| Tide reveal — a wave shaped like the logo floods the screen and uncovers the render | clip-path polygon + SVG foam line, scroll-driven |
| 800 m to the sea | drone photo, drawn route, scroll counter |
| About / amenities | scroll-lit manifesto, counters, self-drawing icons |
| Day → night | scroll clock 12:00→22:00, sunset tint, windows switch on floor by floor |
| Choose a floor | interactive 3D maquette (drag to orbit, hover pulls a floor out, click → plan) + live statuses |
| Vision | 3D ring gallery with depth blur + lightbox |
| Reality | horizontal pinned strip of drone photos with parallax and velocity skew |
| VR / contact | Kuula tour in a modal, form → `mailto:sales@thalassagroup.ge` |

Also: GE/EN/RU, Lenis smooth scroll, optional synthesized sea sound (off by default),
`prefers-reduced-motion` support, mobile layout.

All copy, photos, renders, floor plans and apartment statuses come from thalassagroup.ge (Oct 2026).
Statuses live in `js/i18n.js` → `FLOORS`; update them there (or wire them to the client's CRM).

Creative plan: [STORYBOARD.md](STORYBOARD.md).
Recording mode for the showcase video: `index.html?capture=1` exposes `window.__step(scrollY, dtMs)`.

## Showcase video

`tools/record-video.js` renders a frame-exact 1920×1080 / 60 fps walkthrough (Playwright + ffmpeg),
`tools/soundtrack.py` synthesizes the matching 80 bpm score + sound design (numpy). Then mux:

```bash
node tools/record-video.js ru 60 0 60.75 video.mp4      # site must be served on :8765
python3 tools/soundtrack.py                            # → soundtrack.wav
ffmpeg -i video.mp4 -i soundtrack.wav -c:v libx264 -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest showcase.mp4
```
