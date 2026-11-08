# Insta Tour — website

Trilingual (RU · EN · KA) marketing site for **Insta Tour**, small-group and private tours to China.
Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**, fully static except the
enquiry endpoint, ready for **Vercel**.

```
/ru/  /en/  /ka/                      home (Russian is the default; "/" redirects to /ru/)
/<lang>/tours/                         all tours
/<lang>/tours/china-grand-tour-13-days/
/<lang>/tours/winter-china-harbin-12-days/
/<lang>/tours/china-nature-zhangjiajie-guilin-7-days/
/<lang>/custom-tours/                  private tours + quote form
/<lang>/about/  /gallery/  /blog/  /blog/<slug>/  /faq/  /contacts/  /privacy/  /booking-terms/
/sitemap.xml  /robots.txt  /manifest.webmanifest  /api/lead (POST, form endpoint)
```

## Run locally

```bash
cd website
npm install
cp .env.example .env.local   # fill in what you have; empty values are fine
npm run dev                  # http://localhost:3000
```

Production check: `npm run build && npm start`.

## Deploy to Vercel

1. Import the GitHub repo in Vercel.
2. **Root Directory: `website`** (the repo root also holds an unrelated Xcode project).
3. Add the environment variables from `.env.example` (Project → Settings → Environment Variables).
   At minimum set `NEXT_PUBLIC_SITE_URL` to your real domain (e.g. `https://instatour.ge`) once the domain is connected.
4. Deploy. Preview deployments are automatically `noindex` (see `src/app/robots.ts`).

## What you need to provide (placeholders today)

| What | Where | Status |
|---|---|---|
| WhatsApp number | `NEXT_PUBLIC_WHATSAPP_NUMBER` | **missing** — until set, chat buttons open Instagram DMs |
| Phone, email | `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_EMAIL` | missing (shown as "coming soon") |
| Instagram | `NEXT_PUBLIC_INSTAGRAM_URL` | set to instagram.com/instatour_china |
| TikTok / Telegram / Facebook | `NEXT_PUBLIC_*_URL` | missing (icons hidden until set) |
| Where enquiries go | Telegram bot, Resend email or webhook (see `.env.example`) | **missing** — forms fall back to WhatsApp/Instagram with the text prefilled |
| Domain | `NEXT_PUBLIC_SITE_URL` | missing |
| GA4 / GTM / Meta Pixel / Search Console | `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GSC_VERIFICATION` | missing |
| Departure dates, day-by-day programmes | `src/data/tours.ts` | not published until confirmed |
| Guide-interpreter languages | FAQ text in `src/i18n/dictionaries/*.ts` | currently "confirm when booking" |
| Team photos, real reviews, company legal details | About page, privacy & booking terms | placeholders, nothing invented |
| Payment / cancellation / refund terms | `legal.terms` in dictionaries | to be written with a lawyer |
| Own photos from trips | `public/images/photos/` + `src/data/photo-manifest.json` | currently Wikimedia Commons (licensed, credited) |

## Where things live

| You want to change… | Edit |
|---|---|
| Tour price, days, route, included / not included, tour FAQ | `src/data/tours.ts` (single source of truth) |
| Menu, buttons, page texts, general FAQ, privacy, booking terms | `src/i18n/dictionaries/ru.ts`, `en.ts`, `ka.ts` (TypeScript flags any key missing in a language) |
| Contacts, social links, analytics IDs | environment variables (`src/config/site.ts` reads them) |
| Home-page destination tiles | `src/data/destinations.ts` |
| Photos (file, alt texts, author, licence) | `public/images/photos/` + `src/data/photo-manifest.json` |
| Blog articles | `content/blog/<slug>/{ru,en,ka}.md` — format in `content/README.md` |
| Colours, fonts, animations | `src/app/globals.css`, fonts in `src/app/[lang]/layout.tsx` |

### Add a blog article
Create `content/blog/my-new-slug/ru.md` (+ `en.md`, `ka.md`) following `content/README.md`.
It appears automatically in the blog list, sitemap and hreflang tags — no code changes.
Unknown photo keys fall back to a default photo, and missing required frontmatter fails the build with a clear message.

### Add departure dates later
Add a field such as `departures: ["2027-01-10", …]` to a tour in `src/data/tours.ts` and render it
in `src/app/[lang]/tours/[slug]/page.tsx` (the "Dates" block). Only then consider adding
`availability`/`startDate` to the TouristTrip structured data.

### Moving to a CMS later
All content is read through three small modules: `src/data/tours.ts`, `src/lib/blog.ts`, `src/lib/photos.ts`.
Swap their implementations for CMS fetches (Sanity, Contentful, Strapi, Notion…) and the pages stay unchanged.

## Enquiry forms
Three forms (tour, private tour, contact) post to `/api/lead`, which forwards each enquiry to every
configured channel (Telegram, email via Resend, generic webhook).
- Spam protection: hidden honeypot field + minimum fill time + per-IP rate limit.
- Drafts are kept in the visitor's browser, so nothing is lost on an error.
- If no channel is configured (or delivery fails) the form shows a one-tap **Send via WhatsApp**
  (or Instagram + copy text) button with the enquiry already written.

## Analytics events
Sent to GA4 / GTM / Meta Pixel when configured (`src/lib/analytics.ts`):
`view_tour`, `whatsapp_click`, `contact_click`, `social_click`, `custom_tour_click`,
`form_cta_click`, `form_start`, `generate_lead` (Meta: `Lead`).
Mark `generate_lead` and `whatsapp_click` as conversions in GA4.

## SEO
- Per-page title / description / canonical / hreflang (ru, en, ka, x-default → ru) — `src/lib/seo.ts`.
- Schema.org: Organization, WebSite, BreadcrumbList, TouristTrip (tours), Article (blog), FAQPage (FAQ page only) — `src/lib/jsonld.ts`. No ratings, reviews or availability are claimed.
- `sitemap.xml` with language alternates, `robots.txt`, Open Graph + Twitter cards.
- Keyword map and 3-month plan: `docs/SEO-KEYWORDS.md`, `docs/CONTENT-PLAN.md`.

## Motion
Custom, dependency-free motion system (`src/components/MotionController.tsx` + `globals.css`):
layered hero "camera" (photo / mist + brand sun-arc / foreground chips moving at different speeds,
motion blur tied to scroll speed), kinetic headline, focus-pull reveals, mask wipes, drawing route
lines and a kinetic type marquee. Respects `prefers-reduced-motion`. Storyboard: `docs/MOTION.md`.
