import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { locales, localeMeta, type Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n";
import { tours } from "@/data/tours";
import { href, paths } from "@/lib/routes";
import { whatsappLink } from "@/lib/whatsapp";
import SocialLinks from "./SocialLinks";
import { Mail, Phone, WhatsAppIcon } from "./Icons";

export default function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const wa = whatsappLink();
  const year = new Date().getFullYear();
  const pages = [
    [t.nav.tours, paths.tours],
    [t.nav.custom, paths.custom],
    [t.nav.about, paths.about],
    [t.nav.gallery, paths.gallery],
    [t.nav.blog, paths.blog],
    [t.nav.faq, paths.faq],
    [t.nav.contacts, paths.contacts],
  ] as const;

  return (
    <footer className="relative bg-ink text-white grain overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full border-[18px] border-red/70 border-l-transparent border-b-transparent rotate-12" />
      <div className="container-x relative py-16 md:py-20 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Link href={href(locale, paths.home)} className="flex items-center gap-3">
            <span className="block h-14 w-14 overflow-hidden rounded-full bg-white">
              <Image src="/brand/logo-256.webp" alt="Insta Tour" width={56} height={56} className="h-full w-full object-cover" />
            </span>
            <span className="font-display text-3xl">Insta<span className="text-red"> Tour</span></span>
          </Link>
          <p className="mt-5 max-w-sm text-white/70 leading-relaxed">{t.footer.about}</p>
          <SocialLinks className="mt-6" />
        </div>

        <nav className="md:col-span-2" aria-label={t.footer.pages}>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">{t.footer.pages}</h2>
          <ul className="mt-5 space-y-3 text-white/85">
            {pages.map(([label, p]) => (
              <li key={p}><Link className="hover:text-red transition-colors" href={href(locale, p)}>{label}</Link></li>
            ))}
          </ul>
        </nav>

        <nav className="md:col-span-3" aria-label={t.footer.tours}>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">{t.footer.tours}</h2>
          <ul className="mt-5 space-y-3 text-white/85">
            {tours.map((tour) => (
              <li key={tour.slug}>
                <Link className="hover:text-red transition-colors" href={href(locale, paths.tour(tour.slug))}>
                  {tour.title[locale]} <span className="text-white/45">· {t.common.days(tour.days)}</span>
                </Link>
              </li>
            ))}
            <li><Link className="hover:text-red transition-colors" href={href(locale, paths.custom)}>{t.nav.custom}</Link></li>
          </ul>
        </nav>

        <div className="md:col-span-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">{t.footer.contacts}</h2>
          <ul className="mt-5 space-y-3 text-white/85">
            {wa && (
              <li><a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-red"><WhatsAppIcon /> WhatsApp</a></li>
            )}
            {site.contacts.phone && (
              <li><a href={`tel:${site.contacts.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 hover:text-red"><Phone /> {site.contacts.phone}</a></li>
            )}
            {site.contacts.email && (
              <li><a href={`mailto:${site.contacts.email}`} className="inline-flex items-center gap-2 hover:text-red"><Mail /> {site.contacts.email}</a></li>
            )}
            <li><Link href={href(locale, paths.contacts)} className="hover:text-red">{t.nav.contacts} →</Link></li>
          </ul>
          <div className="mt-6 flex gap-2 text-sm font-bold">
            {locales.map((l) => (
              <Link key={l} href={href(l, paths.home)} hrefLang={localeMeta[l].hreflang} className={`rounded-full px-3 py-1.5 border ${l === locale ? "bg-red border-red" : "border-white/25 hover:border-white"}`}>
                {localeMeta[l].label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-x py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-white/55">
          <p>© {year} {site.name}. {t.footer.rights}</p>
          <p className="text-white/40">{t.footer.photoNote}</p>
          <div className="flex gap-5">
            <Link href={href(locale, paths.privacy)} className="hover:text-white">{t.footer.privacy}</Link>
            <Link href={href(locale, paths.terms)} className="hover:text-white">{t.footer.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
