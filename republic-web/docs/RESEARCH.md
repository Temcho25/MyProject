# Research log — Republic, Tbilisi (@republic.tbilisi)

Research date: 24 Oct 2026. Method and limits are stated first, because they shape everything below.

## What could and could not be inspected

The build sandbox's network policy blocked direct access to every restaurant host. Each of these failed at DNS/proxy level (curl → `CONNECT 403`, WebFetch → `ENOTFOUND`):

| Host | Purpose | Result |
|---|---|---|
| silkhospitality.com | Operator pages, images | blocked |
| restaurant.republic.ge, republic.ge | Restaurant website | blocked |
| www.instagram.com, scontent.cdninstagram.com | Instagram posts, Reels, images | blocked |
| www.facebook.com | Facebook page | blocked |
| tripadvisor.com, places.georgia.travel, ge.gaultmillau.com, kompas.ge | Listings | blocked |
| upload.wikimedia.org, web.archive.org | Fallback image sources | blocked |

Reachable: npm registry, Google Fonts, GitHub. The only research channel that worked was a web-search tool that returns search-engine summaries of pages. **No page was opened in a browser, no Instagram post or Reel was viewed, and no image, logo or menu file was downloaded.** The Instagram screenshot mentioned in the brief was not attached to the session, so it was not seen either.

Consequences:

- The site ships **no restaurant photography and no logo file**. Every image position is an asset slot (see `ASSETS.md`) showing an abstract light study until the official files are dropped in.
- No dishes, prices, categories or allergens are published. The menu component is complete and data-driven but ships empty.
- Facts below are graded. Only grade A facts appear as plain statements on the site.

## Venue identity — keep these apart

The First Republic Square building holds several businesses. Search summaries describe:

| Venue | Notes from sources | Used on this site? |
|---|---|---|
| **Republic** (Restaurant & Terrace), @republic.tbilisi | Restaurant with rooftop/open-air terrace; menu by Brand Chef Irakli Asatiani | **Yes — the subject** |
| Republic 24 | Ground floor, "glass box", Georgian classics, 24-hour on some days, Tone bakery | No |
| Republic Event Hall / Multifunctional Event Space | Concert venue (e.g. a 24 Oct 2026 concert listing) | No |

Concerts listed for the Event Hall are **not** restaurant events and are not shown.

## Facts and grades

A = consistent across several sources including operator material → stated on site.
B = single or third-party source → shown with a "please confirm" framing, or kept in config only.
C = conflicting → not published; needs the restaurant's answer.

| Fact | Value | Sources (via search summaries) | Grade |
|---|---|---|---|
| Location | First Republic Square, Tbilisi (Vera district, by the Radisson Blu Iveria) | Silk Hospitality, Tripadvisor, Gault&Millau, yell.ge | A |
| Street number | "6 First Republic Square" vs "1 First Republic Square, 0108" | Tripadvisor / Gault&Millau / yell.ge vs a Silk venue page | B — site uses 6 (brief + majority); confirm |
| Phone | +995 591 08 71 72 | Brief, yell.ge, Gault&Millau, Tripadvisor | A |
| Email | reservations@republic.ge | yell.ge, georgia.travel | B — used for the reservation request |
| Brand Chef | Irakli Asatiani — terrace menu "created by" him; "modern Georgian flavours and signature dishes" | Silk Hospitality restaurant page | A (name + role only; no biography) |
| Positioning | Modern Georgian dining | Silk Hospitality, brief | A |
| Older positioning | "Upscale casual… homemade pasta… European fusion", "Georgian and European", "dry-aged fish and meat on open-fire grill" | restaurant.republic.ge / Tripadvisor summaries (date unknown) | C — not used (may predate the current concept) |
| Terrace | Rooftop / open-air terrace, panoramic views incl. the Telegraph building and Radisson Blu Iveria | Silk Hospitality | A |
| Terrace season | "Seasonal, open-air project during the warm period of the year" | kompas.ge | B — site says "seasonal, confirm when booking" |
| Status | One Silk Hospitality page: **"Temporarily closed for renovations"** (undated) | silkhospitality.com/.../republic-restaurant/ | C — **must be confirmed before launch** |
| Opening hours | "11:00–00:00 daily" (third-party); brief reports weekday-varying hours with later Fri/Sat on the official page | Gault&Millau, Tripadvisor, madloba vs brief | C — not published; config slot ready |
| Brunch | "11:00–15:00" vs "12:00–15:00" | restaurant site vs listing | C — not used |
| Live music | Piano evenings Thu–Sun (one summary gives 21:00–23:00); brief cites Instagram promo of Georgian live evenings, piano and vocals | restaurant site summary, kompas.ge, brief | B — site mentions live evenings exist, **no dates or days**; points to Instagram |
| Menu destination | `https://qr.silkhospitality.com/assets/68e8c389c9210866b7fc41cb` (embedded as `hasMenu` for "Republic Restaurant" on Tripadvisor) | Tripadvisor structured data | B — used as the "Full menu" link; confirm it is current |
| Booking platform | None found. Silk's Republic 24 page has a "BOOK NOW" button (different venue) | Silk Hospitality | — reservation = phone + email request |
| Instagram | https://www.instagram.com/republic.tbilisi/ | Brief | A |
| Facebook | https://www.facebook.com/RepublicRestaurantGeorgia/ ("Republic • რესპუბლიკა") | search result title | B — linked; confirm it is the current page |
| Other phones seen | +995 577 15 71 00, +995 322 907 777, +995 322 402 222 (hotel) | listings | not used |

## Audit of the existing presence (from summaries only)

- The restaurant depends on the operator's corporate site (Silk Hospitality), where it is one card among hotel venues, alongside a separate legacy site (restaurant.republic.ge) whose descriptions appear to describe an earlier concept.
- Information is fragmented and contradictory (status, hours, address number, brunch time, cuisine), which is itself the biggest opportunity: one clear, current, bilingual source of truth with a direct path to reserving.
- No direct online booking was found; reservations run through phone/email.
- Menu lives behind a QR asset link, not as readable text — bad for mobile reading and search.

## Questions for the restaurant before launch

1. Is the restaurant open now, or closed for renovation? Reopening date?
2. Current opening hours per weekday and kitchen closing times.
3. Street number: 6 or 1 First Republic Square?
4. Current menu (text, with categories, prices in GEL, allergens) and which dishes are signatures.
5. Is there an online booking platform to link?
6. Live evenings: days, times, programme for upcoming weeks.
7. Logo files (SVG) and the photography / video library with usage rights.

---

## Update — second research pass (24 Oct 2026, wider network access)

silkhospitality.com and the QR menu became reachable. Instagram still answers 401 without a login, and its image CDN, Facebook, EatApp, Linktree, TripAdvisor and Wolt stayed blocked. Facts now **confirmed on official pages** and used on the site:

| Fact | Value | Source |
|---|---|---|
| Name / positioning | Republic Georgian Restaurant — "Modern Georgian flavors and signature dishes curated exclusively for Republic Terrace by Brand Chef Irakli Asatiani"; "rich traditions of Georgian cuisine meet unique dishes crafted exclusively for Republic" | silkhospitality.com/radisson-blu-tbilisi/restaurants-bars/republic-georgian-restaurant/ |
| Status | Open: the old `republic-restaurant` URL (where "closed for renovations" appeared) now redirects to this page, which lists hours, menus and booking | same |
| Location | 3rd floor of the Republic building; four-level building; across from the Radisson Blu Iveria; open-air rooftop terrace with panoramic views | restaurant page; silkhospitality.com/republic/ |
| Address | 6, First Republic Square, 0108 Tbilisi (formerly 6 Rose Revolution Square) | /republic/ footer and contact page |
| Phone | +995 591 08 71 72 | /republic/ |
| Hours | Mon–Thu 12:00–01:00 (kitchen & bar to 00:00); Fri 12:00–06:00 (to 05:00); Sat 11:00–06:00 (to 05:00); Sun 11:00–01:00 (to 00:00) | restaurant page |
| Booking | https://eatapp.co/reserve/republic-roof-top-7a34d6 | QR menu page |
| Delivery | https://linktr.ee/RepublicRestaurant ("Order Delivery") | restaurant page |
| Menus | Food (QR → PDF), Cocktails PDF, Drinks PDF | restaurant page |
| Map | Google Maps place "Republic Restaurant", 41.7036675, 44.7916982 | QR menu page |
| Social | instagram.com/republic.tbilisi, facebook.com/RepublicRestaurantGeorgia | /republic/ |
| Interiors | "interior designed by contemporary Georgian architects" | /republic/about/ |
| Square history | 1983 Kalandarishvili arches ("Andropov's Ears"), 2005 dismantled → Rose Revolution Square, 2018 → First Republic Square | /republic/about/history/ |
| Entertainment | "live music and DJ nights to curated events" (Republic generally); listed concerts are Event Hall, all past | /republic/entertainment/ |

Still unconfirmed, so not on the site: signature dish names (none are marked on the menu), live-evening dates, terrace seasonality.
