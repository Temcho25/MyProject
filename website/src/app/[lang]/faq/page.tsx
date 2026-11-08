import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { href, paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { faqLd } from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";
import { Breadcrumbs, FaqList, PageHero } from "@/components/ui";
import { ArrowRight } from "@/components/Icons";

type Props = PageProps<"/[lang]/faq">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: paths.faq, title: t.faq.seoTitle, description: t.faq.seoDescription });
}

export default async function FaqPage({ params }: Props) {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  return (
    <>
      {/* FAQPage markup is valid here because every Q&A is visible on the page.
          Google currently shows FAQ rich results only for a few site types, so
          this is for clarity to search engines, not a guaranteed snippet. */}
      <JsonLd data={faqLd(t.faq.items)} />
      <PageHero locale={locale} eyebrow={t.nav.faq} title={t.faq.title} lead={t.faq.lead} crumbs={<Breadcrumbs locale={locale} t={t} items={[{ name: t.nav.faq, path: paths.faq }]} />} />
      <section className="container-x grid gap-12 pb-24 lg:grid-cols-12">
        <FaqList items={t.faq.items} className="lg:col-span-8" />
        <aside className="lg:col-span-4">
          <div className="reveal rounded-[var(--radius)] bg-ink p-8 text-white lg:sticky lg:top-28">
            <p className="font-display text-3xl">{t.home.ctaTitle}</p>
            <p className="mt-3 text-white/70">{t.home.ctaText}</p>
            <Link href={href(locale, paths.contacts)} className="btn btn-red mt-6 w-full">{t.nav.contacts} <ArrowRight /></Link>
            <Link href={href(locale, paths.tours)} className="btn btn-glass mt-3 w-full">{t.common.allTours}</Link>
          </div>
        </aside>
      </section>
    </>
  );
}
