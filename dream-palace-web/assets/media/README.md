# Official media

Put only material that Dream Palace is authorised to publish here. Do **not** use photos
taken from property portals.

1. Export images as WebP or AVIF in two widths (about 1600 px and 800 px), for example
   `progress-2025-11-1600.webp` and `progress-2025-11-800.webp`.
2. Register each file in `js/data.js → media`:

```js
{ type: 'progress',              // 'photo' | 'render' | 'progress' | 'video'
  src: 'assets/media/progress-2025-11-1600.webp',
  srcset: 'assets/media/progress-2025-11-800.webp 800w, assets/media/progress-2025-11-1600.webp 1600w',
  date: '2025-11-01',            // the date the photo was taken (shown in the caption)
  alt: { ka: '…', en: '…', ru: '…' },
  credit: 'Dream Palace' }
```

The gallery filters and counts update by themselves. Label renders as `render` so they are
never confused with real photos.

- **Construction chronicle:** add `img` (and `alt`) to the matching milestone in
  `js/data.js → milestones` to show a dated photo on that card.
- **Floor plans:** set `apartments[].plan` to an image path. It replaces the schematic.
- **Video:** use `type: 'video'` with a `poster` image. Videos are muted, never autoplay
  and load lazily.
