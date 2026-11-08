import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { href, paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getPhoto } from "@/lib/photos";
import Photo from "@/components/Photo";
import { Breadcrumbs, PageHero, SectionHeading } from "@/components/ui";
import { ArrowRight, InstagramIcon } from "@/components/Icons";

type Props = PageProps<"/[lang]/about">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const p = getPhoto("li-river");
  return pageMetadata({ locale, path: paths.about, title: t.about.seoTitle, description: t.about.seoDescription, image: { url: p.file, width: p.width, height: p.height, alt: p.alt[locale] } });
}

export default async function AboutPage({ params }: Props) {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const a = t.about;
  return (
    <>
      <PageHero locale={locale} eyebrow="Insta Tour" title={a.title} lead={a.lead} crumbs={<Breadcrumbs locale={locale} t={t} items={[{ name: t.nav.about, path: paths.about }]} />} />

      <section className="container-x grid items-start gap-12 pb-20 lg:grid-cols-12">
        <div className="lg:col-span-6 space-y-6 text-lg leading-relaxed text-ink-2">
          {a.paragraphs.map((p, i) => (
            <p key={i} className="reveal" style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>{p}</p>
          ))}
        </div>
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <div className="wipe relative aspect-[3/4] overflow-hidden rounded-[var(--radius)]"><Photo k="li-river" locale={locale} sizes="(min-width: 1024px) 25vw, 50vw" /></div>
          <div className="wipe relative mt-12 aspect-[3/4] overflow-hidden rounded-[var(--radius)]" style={{ "--d": "150ms" } as React.CSSProperties}>
            <Photo k="forbidden-city" locale={locale} sizes="(min-width: 1024px) 25vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="container-x">
          <SectionHeading title={a.valuesTitle} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {a.values.map((v, i) => (
              <div key={v.title} className="reveal border-t-2 border-red pt-6" style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
                <h3 className="font-display text-3xl">{v.title}</h3>
                <p className="mt-3 text-muted leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Placeholders for real team photos and genuine reviews (never invented) */}
      <section className="container-x grid gap-6 py-20 md:grid-cols-2 md:py-24">
        <div className="reveal rounded-[var(--radius)] border border-dashed border-line p-8">
          <h2 className="font-display display-md">{a.teamTitle}</h2>
          <p className="mt-4 text-muted">{a.teamPlaceholder}</p>
        </div>
        <div className="reveal rounded-[var(--radius)] border border-dashed border-line p-8" style={{ "--d": "120ms" } as React.CSSProperties}>
          <h2 className="font-display display-md">{a.reviewsTitle}</h2>
          <p className="mt-4 text-muted">{a.reviewsPlaceholder}</p>
        </div>
      </section>

      <section className="container-x pb-24">
        <div className="reveal flex flex-col items-start gap-6 rounded-[var(--radius)] bg-ink p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
          <p className="font-display display-md max-w-xl">{a.instagramText}</p>
          <div className="flex flex-wrap gap-3">
            <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-light"><InstagramIcon /> Instagram</a>
            <Link href={href(locale, paths.tours)} className="btn btn-red">{t.common.allTours} <ArrowRight /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
