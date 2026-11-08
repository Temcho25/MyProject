import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/locales";
import { tours } from "@/data/tours";
import { allSlugs, getPost, postLocales } from "@/lib/blog";
import { href, paths } from "@/lib/routes";
import { absoluteUrl, languageAlternates } from "@/lib/seo";

/** Date the static pages were last meaningfully edited. Bump when you change them. */
const PAGES_UPDATED = "2026-11-08";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, priority: number, lastModified = PAGES_UPDATED, available: readonly Locale[] = locales) => {
    for (const l of available) {
      entries.push({
        url: absoluteUrl(href(l, path)),
        lastModified,
        changeFrequency: "monthly",
        priority,
        alternates: { languages: languageAlternates(path, available) },
      });
    }
  };

  add(paths.home, 1);
  add(paths.tours, 0.9);
  tours.forEach((t) => add(paths.tour(t.slug), 0.9));
  add(paths.custom, 0.8);
  add(paths.blog, 0.7);
  add(paths.about, 0.5);
  add(paths.gallery, 0.5);
  add(paths.faq, 0.6);
  add(paths.contacts, 0.6);
  add(paths.privacy, 0.2);
  add(paths.terms, 0.3);

  for (const slug of allSlugs()) {
    const available = postLocales(slug);
    const updated = available.map((l) => getPost(slug, l)!.updated).sort().at(-1) ?? PAGES_UPDATED;
    add(paths.post(slug), 0.7, updated, available);
  }
  return entries;
}
