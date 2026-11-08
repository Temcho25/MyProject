# Content format (Insta Tour blog)

Each article lives in its own folder, one Markdown file per language:

```
content/blog/<slug>/ru.md
content/blog/<slug>/en.md
content/blog/<slug>/ka.md
```

The `<slug>` is shared by all three languages (Latin, kebab-case). That is how the
language switcher and hreflang tags connect the versions. A language file that is
missing simply is not published for that language.

## Frontmatter (all fields required unless marked optional)

```yaml
---
title: "SEO title, 50–60 characters, primary keyword near the start"
description: "Meta description, 140–160 characters, natural sentence with a reason to click"
h1: "Visible page headline (can be longer / warmer than the SEO title)"
excerpt: "1–2 sentences for the blog card"
category: cities        # cities | attractions | guides
cover: zhangjiajie-pillars   # a photo key from src/data/photo-manifest.json
keyword: "primary search phrase in this language"
relatedTours:           # tour slugs, only when genuinely relevant (may be [])
  - china-grand-tour-13-days
published: 2026-11-08
updated: 2026-11-08
---
```

Tour slugs:

- `china-grand-tour-13-days` — 13 days, $1,800: Changsha, Zhangjiajie (Avatar mountains), Chengdu, Chongqing, Xi'an
- `winter-china-harbin-12-days` — 12 days, $2,200: Harbin, Beijing, Luoyang, Shaolin, Xi'an
- `china-nature-zhangjiajie-guilin-7-days` — 7 days, $1,450: Changsha, Zhangjiajie, Guilin, Yangshuo

Other internal pages: `/<lang>/tours/`, `/<lang>/custom-tours/`, `/<lang>/faq/`,
`/<lang>/contacts/`, `/<lang>/blog/<slug>/`.

## Body rules

- Do **not** write an H1 in the body (the page renders `h1` from frontmatter). Start with an intro paragraph, then `##` / `###`.
- Internal links are root-relative and include the language and a trailing slash: `[13-day tour](/en/tours/china-grand-tour-13-days/)`.
- Optional image inside the body: `![alt text](photo:great-wall)` — `photo:<key>` is resolved from the photo manifest.
- Optional callout: a blockquote starting with `**Важно:**` / `**Important:**` / `**მნიშვნელოვანია:**`.
- No invented facts: no made-up prices, opening hours, statistics, reviews, or visa guarantees. Anything that changes (entry rules, ticket prices, schedules, festival dates) is described as something to check before the trip, with the reason.
- No keyword stuffing. Each language version is written natively for its reader, not translated word-for-word.
