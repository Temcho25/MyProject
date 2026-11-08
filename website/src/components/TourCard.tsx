import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n";
import { formatPrice, type Tour } from "@/data/tours";
import { href, paths } from "@/lib/routes";
import Photo from "./Photo";
import { ArrowRight, Clock, Users, Snow } from "./Icons";

export default function TourCard({ tour, locale, t, index = 0, priority }: { tour: Tour; locale: Locale; t: Dictionary; index?: number; priority?: boolean }) {
  return (
    <article className="tour-card reveal group relative flex flex-col overflow-hidden card" style={{ "--d": `${index * 120}ms` } as React.CSSProperties}>
      <Link href={href(locale, paths.tour(tour.slug))} className="absolute inset-0 z-10" aria-label={`${tour.title[locale]} — ${t.common.viewTour}`} />
      <div className="media relative aspect-[4/3] overflow-hidden">
        <Photo k={tour.cover} locale={locale} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" priority={priority} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="chip !bg-black/35"><Clock className="w-4 h-4" /> {t.common.days(tour.days)}</span>
          {tour.season === "winter" && <span className="chip !bg-white/85 !text-ink"><Snow /> {t.common.winter}</span>}
        </div>
        <p className="absolute bottom-4 left-4 right-4 text-white/90 text-sm font-medium">
          {tour.route.map((r) => r.city[locale]).join(" · ")}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-[1.75rem] leading-[1.1]">
          <span className="underline-red">{tour.title[locale]}</span>
        </h3>
        <p className="mt-3 text-muted leading-relaxed">{tour.short[locale]}</p>
        <div className="mt-auto pt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted font-bold">{t.common.price}</p>
            <p className="mt-1">
              <span className="font-display text-4xl text-red">{formatPrice(tour.priceUsd, locale)}</span>{" "}
              <span className="text-sm text-muted">{t.common.perPerson}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Users className="w-4 h-4" /> {t.common.group}: {t.common.groupSize}</p>
          </div>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors duration-500 group-hover:bg-red">
            <ArrowRight className="w-5 h-5" />
          </span>
        </div>
      </div>
    </article>
  );
}
