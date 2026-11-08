import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { tours } from "@/data/tours";
import { href, paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getPhoto } from "@/lib/photos";
import TourCard from "@/components/TourCard";
import JsonLd from "@/components/JsonLd";
import { Breadcrumbs, PageHero } from "@/components/ui";
import { ArrowRight } from "@/components/Icons";
import { absoluteUrl } from "@/lib/seo";

type Props = PageProps<"/[lang]/tours">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const p = getPhoto("great-wall");
  return pageMetadata({ locale, path: paths.tours, title: t.tours.seoTitle, description: t.tours.seoDescription, image: { url: p.file, width: p.width, height: p.height, alt: p.alt[locale] } });
}

export default async function ToursPage({ params }: Props) {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  return (
    <>
      <PageHero
        locale={locale}
        eyebrow={t.nav.tours}
        title={t.tours.title}
        lead={t.tours.lead}
        crumbs={<Breadcrumbs locale={locale} t={t} items={[{ name: t.nav.tours, path: paths.tours }]} />}
      />
      <section className="container-x pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour, i) => (
            <TourCard key={tour.slug} tour={tour} locale={locale} t={t} index={i} priority={i === 0} />
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">✈ {t.common.flightsNotIncluded}</p>

        <div className="reveal mt-16 flex flex-col items-start gap-6 rounded-[var(--radius)] bg-ink p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <h2 className="font-display display-md">{t.tours.customTeaser}</h2>
            <p className="mt-3 text-white/75">{t.tours.customTeaserText}</p>
          </div>
          <Link href={href(locale, paths.custom)} className="btn btn-red shrink-0">{t.common.orderCustom} <ArrowRight /></Link>
        </div>
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: tours.map((tour, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(href(locale, paths.tour(tour.slug))), name: tour.title[locale] })),
        }}
      />
    </>
  );
}
