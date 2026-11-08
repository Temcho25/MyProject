import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { tours } from "@/data/tours";
import { destinations, marqueeWords } from "@/data/destinations";
import { href, paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getPhoto, photos } from "@/lib/photos";
import { formProps } from "@/lib/formProps";
import Photo from "@/components/Photo";
import TourCard from "@/components/TourCard";
import Marquee from "@/components/Marquee";
import LeadForm from "@/components/LeadForm";
import SocialLinks from "@/components/SocialLinks";
import { FaqList, SectionHeading } from "@/components/ui";
import { ArrowRight, Bed, Bowl, Train, Ticket, Guide, Shield, Users, Route, Sparkle } from "@/components/Icons";

type Props = PageProps<"/[lang]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const p = getPhoto("zhangjiajie-pillars");
  return pageMetadata({
    locale,
    path: paths.home,
    title: t.home.seoTitle,
    description: t.home.seoDescription,
    image: { url: p.file, width: p.width, height: p.height, alt: p.alt[locale] },
  });
}

const WHY_ICONS = [Users, Route, Shield, Ticket, Sparkle];
const INCLUDED_ICONS = [Bed, Bowl, Train, Ticket, Guide, Shield];

export default async function Home({ params }: Props) {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const h = t.home;
  const galleryKeys = ["great-wall-winter", "yangshuo-karst", "chongqing-hongyadong", "harbin-snow-sculpture", "chengdu-panda", "xian-bell-tower", "tianmen-mountain", "red-lanterns"].filter((k) =>
    photos.some((p) => p.key === k),
  );

  return (
    <>
      {/* ── 1. Hero: layered camera — photo (slow) · sun arc + mist (mid) · route chips (fast) ── */}
      <section className="hero relative isolate flex min-h-[100svh] items-end overflow-hidden bg-ink text-white">
        <div className="hero-bg absolute inset-[-7%] -z-30">
          <Photo k="zhangjiajie-pillars" locale={locale} sizes="100vw" priority quality={80} />
        </div>
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(120%_80%_at_70%_20%,transparent_0%,rgb(0_0_0/0.25)_55%,rgb(0_0_0/0.75)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-20 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="hero-mid absolute inset-0 -z-10" aria-hidden>
          <div className="mist absolute inset-0" />
          {/* Brand sun-arc, echoing the logo's red brush circle */}
          <svg className="sun-arc absolute -right-[18%] top-[6%] w-[90vw] max-w-[920px] md:-right-[6%] md:w-[62vw]" viewBox="0 0 200 200" fill="none">
            <path d="M40 34 A86 86 0 0 1 176 150" pathLength={1} stroke="#c5161d" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M58 26 A90 90 0 0 1 186 120" pathLength={1} stroke="#c5161d" strokeOpacity="0.45" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        </div>

        <div className="hero-front pointer-events-none absolute inset-0 -z-10 hidden md:block" aria-hidden>
          <div className="absolute right-[16%] top-[28%] float-a"><span className="chip"><span className="dot" />{tours[0].route[1].city[locale]}</span></div>
          <div className="absolute right-[6%] top-[44%] float-b"><span className="chip"><span className="dot" />{tours[1].route[0].city[locale]}</span></div>
          <div className="absolute right-[14%] top-[60%] float-a"><span className="chip"><span className="dot" />{tours[2].route[2].city[locale]}</span></div>
        </div>

        <div className="hero-content container-x pb-16 pt-[calc(var(--header-h)+40px)] md:pb-24">
          <p className="eyebrow !text-white fade-up" style={{ "--d": "100ms" } as React.CSSProperties}>{h.eyebrow}</p>
          <h1 className="kinetic font-display display-xl mt-5 max-w-5xl">
            {h.heroTitle.map((word, i) => (
              <Fragment key={i}>
                <span className="w">
                  <span style={{ "--i": i } as React.CSSProperties} className={i === 1 ? "text-red italic" : ""}>{word}</span>
                </span>
                {i < h.heroTitle.length - 1 ? " " : null}
              </Fragment>
            ))}
          </h1>
          <p className="lead mt-6 max-w-xl !text-white/85 fade-up" style={{ "--d": "800ms" } as React.CSSProperties}>{h.heroSubtitle}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row fade-up" style={{ "--d": "1000ms" } as React.CSSProperties}>
            <Link href={href(locale, paths.tours)} className="btn btn-red">
              {h.heroCtaTours} <ArrowRight />
            </Link>
            <Link href={href(locale, paths.custom)} className="btn btn-glass">
              {h.heroCtaCustom}
            </Link>
          </div>
          <div className="mt-12 hidden items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/60 md:flex fade-up" style={{ "--d": "1300ms" } as React.CSSProperties}>
            <span className="scroll-cue relative h-10 w-px overflow-hidden bg-white/20"><span className="absolute inset-x-0 top-0 h-1/2 bg-white" /></span>
            {h.heroScroll}
          </div>
        </div>
      </section>

      <Marquee words={marqueeWords[locale]} />

      {/* ── 2. Popular tours ── */}
      <section className="container-x py-20 md:py-28" aria-labelledby="popular">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div id="popular"><SectionHeading eyebrow={t.nav.tours} title={h.popularTitle} lead={h.popularLead} /></div>
          <Link href={href(locale, paths.tours)} className="btn btn-ghost self-start md:self-auto reveal">{t.common.allTours} <ArrowRight /></Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour, i) => (
            <TourCard key={tour.slug} tour={tour} locale={locale} t={t} index={i} />
          ))}
        </div>
        <p className="mt-6 text-sm text-muted reveal">✈ {t.common.flightsNotIncluded}</p>
      </section>

      {/* ── 3. Why Insta Tour ── */}
      <section className="relative overflow-hidden bg-white py-20 md:py-28">
        <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <SectionHeading eyebrow="Insta Tour" title={h.whyTitle} />
              <div className="wipe relative mt-10 hidden aspect-[4/5] overflow-hidden rounded-[var(--radius)] lg:block">
                <div data-parallax className="absolute inset-[-12%]" style={{ "--speed": "-60px" } as React.CSSProperties}>
                  <Photo k="great-wall" locale={locale} sizes="40vw" />
                </div>
              </div>
            </div>
          </div>
          <ol className="lg:col-span-7 divide-y divide-line">
            {h.why.map((w, i) => {
              const Icon = WHY_ICONS[i % WHY_ICONS.length];
              return (
                <li key={w.title} className="reveal flex gap-6 py-8 first:pt-0" style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
                  <span className="font-display text-5xl text-red/90 w-14 shrink-0 leading-none">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="flex items-center gap-3 text-xl font-extrabold"><Icon className="w-6 h-6 text-red" />{w.title}</h3>
                    <p className="mt-2 text-muted leading-relaxed">{w.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── 4. Destinations (bento) ── */}
      <section className="container-x py-20 md:py-28">
        <SectionHeading eyebrow={h.destinationsLead} title={h.destinationsTitle} />
        <div className="mt-12 grid auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[260px] md:grid-cols-4 md:gap-5">
          {destinations.map((d, i) => (
            <Link
              key={d.key}
              href={href(locale, paths.post(d.article))}
              className={`wipe group relative overflow-hidden rounded-[var(--radius)] ${d.size === "lg" ? "col-span-2 row-span-2" : d.size === "md" ? "col-span-2 md:col-span-2" : "col-span-1"}`}
              style={{ "--d": `${(i % 4) * 90}ms` } as React.CSSProperties}
            >
              <Photo k={d.photo} locale={locale} sizes={d.size === "sm" ? "(min-width: 768px) 25vw, 50vw" : "(min-width: 768px) 50vw, 100vw"} className="transition-transform duration-[1.6s] ease-out group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <span className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                <span className="block text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white/75">{d.line[locale]}</span>
                <span className={`mt-1 flex items-center justify-between gap-2 font-display leading-none ${d.size === "sm" ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl"}`}>
                  {d.name[locale]}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors group-hover:bg-red"><ArrowRight /></span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 5. What's included ── */}
      <section className="relative overflow-hidden bg-ink py-20 text-white grain md:py-28">
        <div aria-hidden className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full border border-red/40" data-parallax style={{ "--speed": "80px" } as React.CSSProperties} />
        <div className="container-x relative">
          <SectionHeading eyebrow={t.tour.included} title={h.includedTitle} lead={h.includedLead} dark />
          <ul className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius)] bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {h.includedItems.map((item, i) => {
              const Icon = INCLUDED_ICONS[i % INCLUDED_ICONS.length];
              return (
                <li key={item} className="reveal flex items-center gap-5 bg-ink p-7" style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red/15 text-red"><Icon className="w-7 h-7" /></span>
                  <span className="text-lg font-semibold">{item}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-white/60 reveal">✈ {h.includedNote}</p>
        </div>
      </section>

      {/* ── 6. Booking steps ── */}
      <section className="container-x py-20 md:py-28" data-inview>
        <SectionHeading title={h.stepsTitle} />
        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          <span aria-hidden className="route-line absolute left-[22px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-red to-red/20 md:hidden" />
          <span aria-hidden className="absolute left-0 right-0 top-[22px] hidden h-[2px] origin-left bg-gradient-to-r from-red to-red/20 md:block reveal" />
          {h.steps.map((s, i) => (
            <li key={s.title} className="reveal relative pl-16 md:pl-0" style={{ "--d": `${i * 150}ms` } as React.CSSProperties}>
              <span className="absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-full bg-red text-white font-bold shadow-[0_0_0_8px_var(--paper)] md:relative">
                {i + 1}
              </span>
              <h3 className="mt-0 text-xl font-extrabold md:mt-6">{s.title}</h3>
              <p className="mt-2 text-muted leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 7. Private journeys ── */}
      <section className="container-x pb-20 md:pb-28">
        <div className="relative isolate overflow-hidden rounded-[calc(var(--radius)+8px)] bg-ink text-white">
          <div className="absolute inset-[-10%] -z-10" data-parallax style={{ "--speed": "50px" } as React.CSSProperties}>
            <Photo k="yangshuo-yulong-river" locale={locale} sizes="100vw" />
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
          <div className="max-w-2xl px-6 py-16 sm:px-12 md:py-24">
            <p className="eyebrow !text-white reveal">{t.nav.custom}</p>
            <h2 className="font-display display-lg mt-4 reveal" style={{ "--d": "100ms" } as React.CSSProperties}>{h.customTitle}</h2>
            <p className="lead mt-5 !text-white/85 reveal" style={{ "--d": "200ms" } as React.CSSProperties}>{h.customText}</p>
            <Link href={href(locale, paths.custom)} className="btn btn-red mt-9 reveal" style={{ "--d": "300ms" } as React.CSSProperties}>
              {t.common.calcCustom} <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. Photos of China (snap strip) ── */}
      <section className="pb-20 md:pb-28">
        <div className="container-x flex items-end justify-between gap-6">
          <SectionHeading title={h.galleryTitle} lead={h.galleryLead} />
          <Link href={href(locale, paths.gallery)} className="btn btn-ghost hidden md:inline-flex reveal">{t.common.seeAll} <ArrowRight /></Link>
        </div>
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-7 [scrollbar-width:none] lg:px-[max(28px,calc((100vw-1240px)/2+28px))]">
          {galleryKeys.map((k, i) => (
            <Link
              key={k}
              href={href(locale, paths.gallery)}
              className={`reveal relative shrink-0 snap-start overflow-hidden rounded-[var(--radius)] ${i % 3 === 1 ? "h-[380px] w-[280px] md:h-[460px] md:w-[340px]" : "h-[380px] w-[300px] md:h-[460px] md:w-[440px]"}`}
              style={{ "--d": `${i * 60}ms` } as React.CSSProperties}
            >
              <Photo k={k} locale={locale} sizes="440px" className="transition-transform duration-[1.4s] hover:scale-105" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── 9. FAQ ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow={t.nav.faq} title={h.faqTitle} />
            <Link href={href(locale, paths.faq)} className="btn btn-ghost mt-8 reveal">{t.common.seeAll} <ArrowRight /></Link>
          </div>
          <FaqList items={t.faq.items.slice(0, 6)} className="lg:col-span-8" />
        </div>
      </section>

      {/* ── 10. CTA + contacts ── */}
      <section id="enquiry" className="relative overflow-hidden bg-ink py-20 text-white grain md:py-28">
        <div className="container-x relative grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow={h.contactsTitle} title={h.ctaTitle} lead={h.ctaText} dark />
            <div className="mt-10 reveal">
              <p className="text-sm text-white/60">{t.about.instagramText}</p>
              <SocialLinks className="mt-4" />
            </div>
          </div>
          <div className="lg:col-span-7 reveal">
            <div className="rounded-[var(--radius)] bg-white p-6 text-ink sm:p-10">
              <LeadForm variant="tour" {...formProps(locale)} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
