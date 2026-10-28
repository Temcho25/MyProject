# Atskoba — portfolio site

Portfolio of Atskoba (აწყობა), a Tbilisi studio for 3D and motion websites.
Made to show clients and Upwork leads live work: every project links to a live site,
and every preview video is recorded from that site.

Languages: English (default), Georgian, Russian — switch in the header or open `?lang=ka` / `?lang=ru`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

## Where things live

- `src/data.js` — projects, contact e-mail, Upwork link and all text in three languages.
  Paste your Upwork profile URL into `CONTACT.upwork` to show the "Hire on Upwork" button.
- `src/scene.js` — the WebGL scene: the 3D logo, floating parts and particles.
- `src/main.js` — loader, scroll choreography, cursor, language switch.
- `src/sound.js` — generated ambient sound and UI sounds (off until the visitor turns it on).
- `public/media/` — preview loops (`<id>.mp4`) and posters (`<id>.jpg`) for featured projects.
- `public/work/` — screenshots for the "Also built" list.
- `docs/storyboard.md` — the motion storyboard the site follows.

## Adding a project

1. Add an entry to `FEATURED`, `RAIL` or `INDEX` in `src/data.js`.
2. Put `<id>.mp4` and `<id>.jpg` in `public/media/` (or `<id>.jpg` in `public/work/` for the list).
