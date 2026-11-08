import { site } from "@/config/site";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { tours } from "@/data/tours";
import { href, paths } from "./routes";
import { instagramDm } from "./contact";

/** Everything LeadForm needs from the server, in serialisable form. */
export function formProps(locale: Locale) {
  return {
    locale,
    f: getDictionary(locale).forms,
    tours: tours.map((t) => ({ slug: t.slug, title: `${t.title[locale]} · ${t.days} · $${t.priceUsd}` })),
    privacyHref: href(locale, paths.privacy),
    whatsapp: site.contacts.whatsapp,
    instagramDm: instagramDm(),
  };
}
