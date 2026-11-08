import type { Metadata } from "next";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getPhoto, photoAlt, photos } from "@/lib/photos";
import Gallery from "@/components/Gallery";
import { Breadcrumbs, PageHero } from "@/components/ui";

type Props = PageProps<"/[lang]/gallery">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const p = getPhoto("harbin-ice-festival");
  return pageMetadata({ locale, path: paths.gallery, title: t.gallery.seoTitle, description: t.gallery.seoDescription, image: { url: p.file, width: p.width, height: p.height, alt: p.alt[locale] } });
}

export default async function GalleryPage({ params }: Props) {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const g = t.gallery;
  const order = Object.keys(g.categories) as (keyof typeof g.categories)[];
  const present = new Set(photos.map((p) => p.category));
  const categories = order.filter((c) => present.has(c)).map((c) => ({ id: c, label: g.categories[c] }));
  const items = [...photos]
    .sort((a, b) => order.indexOf(a.category as never) - order.indexOf(b.category as never))
    .map((p) => ({
      key: p.key, file: p.file, width: p.width, height: p.height, category: p.category,
      alt: photoAlt(p, locale), place: p.place, author: p.author, license: p.license, source: p.source,
    }));

  return (
    <>
      <PageHero locale={locale} eyebrow={t.nav.gallery} title={g.title} lead={g.lead} crumbs={<Breadcrumbs locale={locale} t={t} items={[{ name: t.nav.gallery, path: paths.gallery }]} />} />
      <section className="container-x pb-20">
        <Gallery
          items={items}
          categories={categories}
          labels={{ all: g.all, prev: g.prev, next: g.next, close: t.nav.close, open: g.open, credit: t.common.photoCredit }}
        />
      </section>
      <section className="container-x pb-24">
        <details className="rounded-[var(--radius)] border border-line bg-white p-6">
          <summary className="cursor-pointer font-bold">{g.creditsTitle}</summary>
          <p className="mt-3 text-sm text-muted">{g.creditsText}</p>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {photos.map((p) => (
              <li key={p.key} className="text-muted">
                <span className="text-ink">{p.place}</span> — {p.author},{" "}
                <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline">{p.license}</a>,{" "}
                <a href={p.source} target="_blank" rel="noopener noreferrer" className="underline">Wikimedia Commons</a>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </>
  );
}
