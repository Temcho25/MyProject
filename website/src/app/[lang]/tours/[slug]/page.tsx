import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { formatPrice, getTour, tours } from "@/data/tours";
import { href, paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getPhoto } from "@/lib/photos";
import { touristTripLd } from "@/lib/jsonld";
import { getPostsBySlugs } from "@/lib/blog";
import { formProps } from "@/lib/formProps";
import { primaryChat } from "@/lib/contact";
import Photo from "@/components/Photo";
import TourCard from "@/components/TourCard";
import LeadForm from "@/components/LeadForm";
import JsonLd from "@/components/JsonLd";
import TrackView from "@/components/TrackView";
import { Breadcrumbs, FaqList, PageHero, SectionHeading } from "@/components/ui";
import { ArrowRight, Check, Clock, Cross, Pin, Plane, Users, WhatsAppIcon, InstagramIcon } from "@/components/Icons";

type Props = PageProps<"/[lang]/tours/[slug]">;

export const dynamicParams = false;
export function generateStaticParams() {
  return locales.flatMap((lang) => tours.map((t) => ({ lang, slug: t.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const tour = getTour(slug);
  if (!tour) return {};
  const p = getPhoto(tour.cover);
  return pageMetadata({
    locale,
    path: paths.tour(tour.slug),
    title: tour.seoTitle[locale],
    description: tour.seoDescription[locale],
    image: { url: p.file, width: p.width, height: p.height, alt: p.alt[locale] },
  });
}

export default async function TourPage({ params }: Props) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const tour = getTour(slug);
  if (!tour) notFound();
  const t = getDictionary(locale);
  const price = formatPrice(tour.priceUsd, locale);
  const chat = primaryChat(`Insta Tour — ${t.forms.leadTypeTour}: ${tour.title[locale]} (${t.common.days(tour.days)}, ${price})`);
  const articles = getPostsBySlugs(tour.relatedArticles, locale);
  const others = tours.filter((x) => x.slug !== tour.slug);

  const facts = [
    { icon: Clock, label: t.common.duration, value: t.common.days(tour.days) },
    { icon: Users, label: t.common.group, value: t.common.groupSize },
    { icon: Pin, label: t.common.route, value: tour.route.map((r) => r.city[locale]).join(" → ") },
    { icon: Plane, label: t.tour.flightsTitle, value: t.common.flightsNotIncluded },
  ];

  return (
    <>
      <TrackView event="view_tour" params={{ tour: tour.slug, price: tour.priceUsd }} />
      <JsonLd data={touristTripLd(tour, locale)} />

      <PageHero
        locale={locale}
        photo={tour.cover}
        eyebrow={`${t.common.days(tour.days)} · ${t.common.groupSize}`}
        title={tour.title[locale]}
        lead={tour.tagline[locale]}
        crumbs={<Breadcrumbs light locale={locale} t={t} items={[{ name: t.nav.tours, path: paths.tours }, { name: tour.title[locale], path: paths.tour(tour.slug) }]} />}
      >
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center fade-up" style={{ "--d": "360ms" } as React.CSSProperties}>
          <p>
            <span className="font-display text-5xl md:text-6xl">{price}</span>{" "}
            <span className="text-white/75">{t.common.perPerson}</span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="#apply" className="btn btn-red" data-track="form_cta_click" data-track-label={tour.slug}>
              {t.common.wantThisTour} <ArrowRight />
            </a>
            <a href={chat.url} target="_blank" rel="noopener noreferrer" className="btn btn-glass" data-track-label={`tour-hero-${tour.slug}`}>
              {chat.kind === "whatsapp" ? <WhatsAppIcon /> : <InstagramIcon />}
              {chat.kind === "whatsapp" ? t.common.writeWhatsapp : t.common.writeInstagram}
            </a>
          </div>
        </div>
      </PageHero>

      {/* Facts strip */}
      <section className="border-b border-line bg-white">
        <dl className="container-x grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {facts.map((f, i) => (
            <div key={f.label} className="reveal flex items-start gap-4 py-6 lg:px-6 first:lg:pl-0" style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
              <f.icon className="mt-0.5 h-6 w-6 shrink-0 text-red" />
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-muted">{f.label}</dt>
                <dd className="mt-1 font-semibold leading-snug">{f.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Overview + highlights */}
      <section className="container-x grid gap-14 py-20 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionHeading eyebrow={t.tour.overview} title={tour.short[locale]} />
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink-2">
            {tour.intro[locale].map((p, i) => (
              <p key={i} className="reveal" style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>{p}</p>
            ))}
          </div>
        </div>
        <aside className="lg:col-span-5">
          <div className="reveal rounded-[var(--radius)] bg-ink p-8 text-white lg:sticky lg:top-28">
            <h2 className="font-display text-3xl">{t.tour.highlights}</h2>
            <ul className="mt-6 space-y-4">
              {tour.highlights[locale].map((hl) => (
                <li key={hl} className="flex gap-3"><span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red"><Check className="w-4 h-4" /></span>{hl}</li>
              ))}
            </ul>
            <div className="mt-8 border-t border-white/15 pt-6">
              <p className="text-sm text-white/60">{t.common.price}</p>
              <p className="font-display text-5xl">{price} <span className="font-sans text-base text-white/60">{t.common.perPerson}</span></p>
              <p className="mt-2 text-sm text-white/60">{t.tour.datesTitle}: {t.tour.datesText}</p>
              <a href="#apply" className="btn btn-red mt-6 w-full">{t.common.wantThisTour} <ArrowRight /></a>
            </div>
          </div>
        </aside>
      </section>

      {/* Route timeline */}
      <section className="bg-white py-20 md:py-24">
        <div className="container-x">
          <SectionHeading eyebrow={t.tour.route} title={tour.route.map((r) => r.city[locale]).join(" — ")} lead={t.tour.routeNote} />
          <ol className="relative mt-14" data-inview>
            <span aria-hidden className="route-line absolute bottom-6 left-[19px] top-6 w-[2px] bg-gradient-to-b from-red via-red to-red/20 md:left-1/2 md:-translate-x-1/2" />
            {tour.route.map((stop, i) => (
              <li key={i} className="route-stop relative grid gap-6 pb-14 pl-14 last:pb-0 md:grid-cols-2 md:gap-16 md:pl-0">
                <span className="node absolute left-[8px] top-2 h-6 w-6 rounded-full border-4 border-white bg-red shadow-[0_0_0_2px_var(--red)] md:left-1/2 md:-translate-x-1/2" style={{ "--d": `${300 + i * 250}ms` } as React.CSSProperties} />
                <div className={`reveal ${i % 2 ? "md:order-2" : "md:text-right"}`} style={{ "--d": `${i * 120}ms` } as React.CSSProperties}>
                  <p className="text-sm font-bold text-red">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="font-display text-4xl md:text-5xl">{stop.city[locale]}</h3>
                  <p className={`mt-3 text-muted leading-relaxed md:max-w-md ${i % 2 ? "" : "md:ml-auto"}`}>{stop.note[locale]}</p>
                </div>
                <div className={`wipe relative aspect-[16/10] overflow-hidden rounded-[var(--radius)] ${i % 2 ? "md:order-1" : ""}`} style={{ "--d": `${i * 120 + 100}ms` } as React.CSSProperties}>
                  <Photo k={stop.photo} locale={locale} sizes="(min-width: 768px) 45vw, 90vw" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Gallery */}
      <section className="container-x py-20 md:py-24">
        <SectionHeading eyebrow={t.nav.gallery} title={t.tour.gallery} />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {tour.gallery.map((k, i) => (
            <div key={k} className={`wipe relative overflow-hidden rounded-[var(--radius)] ${i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-[4/3]"}`} style={{ "--d": `${(i % 3) * 90}ms` } as React.CSSProperties}>
              <Photo k={k} locale={locale} sizes={i === 0 ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 50vw"} />
            </div>
          ))}
        </div>
      </section>

      {/* Included / not included */}
      <section className="relative overflow-hidden bg-ink py-20 text-white grain md:py-24">
        <div className="container-x relative grid gap-10 lg:grid-cols-2">
          <div className="reveal">
            <h2 className="font-display display-md">{t.tour.included}</h2>
            <ul className="mt-8 space-y-4">
              {tour.included[locale].map((x) => (
                <li key={x} className="flex gap-3"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red"><Check className="w-4 h-4" /></span><span className="text-lg">{x}</span></li>
              ))}
            </ul>
          </div>
          <div className="reveal" style={{ "--d": "120ms" } as React.CSSProperties}>
            <h2 className="font-display display-md">{t.tour.notIncluded}</h2>
            <ul className="mt-8 space-y-4">
              {tour.notIncluded[locale].map((x) => (
                <li key={x} className="flex gap-3 text-white/80"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/30"><Cross className="w-4 h-4" /></span><span className="text-lg">{x}</span></li>
              ))}
            </ul>
            <div className="mt-10 rounded-2xl border border-white/15 bg-white/5 p-6">
              <h3 className="flex items-center gap-3 text-lg font-bold"><Plane className="w-6 h-6 text-red" /> {t.tour.flightsTitle}</h3>
              <p className="mt-3 text-white/75 leading-relaxed">{t.tour.flightsText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-x grid gap-12 py-20 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-4"><SectionHeading eyebrow={t.nav.faq} title={t.tour.faq} /></div>
        <FaqList items={tour.faq[locale]} className="lg:col-span-8" />
      </section>

      {/* Apply */}
      <section id="apply" className="scroll-mt-20 bg-white py-20 md:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow={tour.title[locale]} title={t.tour.applyTitle} lead={t.tour.applyText} />
            <a href={chat.url} target="_blank" rel="noopener noreferrer" className={`btn mt-8 text-white reveal ${chat.kind === "whatsapp" ? "!bg-[#25D366]" : "btn-red"}`} data-track-label={`tour-apply-${tour.slug}`}>
              {chat.kind === "whatsapp" ? <WhatsAppIcon /> : <InstagramIcon />}
              {chat.kind === "whatsapp" ? t.common.writeWhatsapp : t.common.writeInstagram}
            </a>
          </div>
          <div className="lg:col-span-7 reveal">
            <div className="rounded-[var(--radius)] border border-line bg-paper p-6 sm:p-10">
              <LeadForm variant="tour" defaultTour={tour.slug} {...formProps(locale)} />
            </div>
          </div>
        </div>
      </section>

      {/* Related articles */}
      {articles.length > 0 && (
        <section className="container-x py-20 md:py-24">
          <SectionHeading eyebrow={t.nav.blog} title={t.tour.articles} />
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {articles.map((a, i) => (
              <Link key={a.slug} href={href(locale, paths.post(a.slug))} className="reveal group card overflow-hidden" style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Photo k={a.cover} locale={locale} sizes="(min-width: 1024px) 300px, 50vw" className="transition-transform duration-1000 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold leading-snug group-hover:text-red transition-colors">{a.h1}</h3>
                  <p className="mt-2 text-sm text-muted">{t.common.readingTime(a.readingMinutes)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Similar tours */}
      <section className="bg-white py-20 md:py-24">
        <div className="container-x">
          <SectionHeading eyebrow={t.nav.tours} title={t.tour.related} />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {others.map((o, i) => (
              <TourCard key={o.slug} tour={o} locale={locale} t={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 pr-24 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="leading-tight">
            <span className="font-display text-2xl text-red">{price}</span>
            <span className="block text-xs text-muted">{t.common.days(tour.days)} · {t.common.perPerson}</span>
          </p>
          <a href="#apply" className="btn btn-red !min-h-[46px] !px-5 text-sm">{t.common.wantThisTour}</a>
        </div>
      </div>
    </>
  );
}
