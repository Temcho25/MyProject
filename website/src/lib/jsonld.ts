import { site, socialLinks } from "@/config/site";
import type { Locale } from "@/i18n/locales";
import { localeMeta } from "@/i18n/locales";
import type { Tour } from "@/data/tours";
import { absoluteUrl } from "./seo";
import { href, paths } from "./routes";
import { getPhoto } from "./photos";

/**
 * Schema.org helpers. Only facts that are visible on the page go here:
 * no ratings, no reviews, no invented availability or dates.
 */

const orgId = () => absoluteUrl("/#organization");

export function organizationLd(description: string) {
  const contactPoint =
    site.contacts.phone || site.contacts.email
      ? [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(site.contacts.phone ? { telephone: site.contacts.phone } : {}),
            ...(site.contacts.email ? { email: site.contacts.email } : {}),
            availableLanguage: ["Russian", "English", "Georgian"],
          },
        ]
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": orgId(),
    name: site.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl(site.logo),
    description,
    sameAs: socialLinks().map(([, url]) => url),
    ...(contactPoint ? { contactPoint } : {}),
  };
}

export function websiteLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl(`/${locale}/#website`),
    url: absoluteUrl(href(locale, paths.home)),
    name: site.name,
    inLanguage: localeMeta[locale].hreflang,
    publisher: { "@id": orgId() },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function touristTripLd(tour: Tour, locale: Locale) {
  const url = absoluteUrl(href(locale, paths.tour(tour.slug)));
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${url}#trip`,
    name: tour.title[locale],
    description: tour.seoDescription[locale],
    url,
    image: absoluteUrl(getPhoto(tour.cover).file),
    inLanguage: localeMeta[locale].hreflang,
    touristType: tour.season === "winter" ? "Winter travel, culture" : "Nature, culture, sightseeing",
    itinerary: {
      "@type": "ItemList",
      numberOfItems: tour.route.length,
      itemListElement: tour.route.map((stop, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "City", name: stop.city[locale], containedInPlace: { "@type": "Country", name: "China" } },
      })),
    },
    offers: {
      "@type": "Offer",
      price: tour.priceUsd,
      priceCurrency: "USD",
      url,
      description: `${tour.days} days, price per person; international flights not included`,
    },
    provider: { "@id": orgId() },
  };
}

export function articleLd(p: {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  image: string;
  published: string;
  updated: string;
}) {
  const url = absoluteUrl(href(p.locale, paths.post(p.slug)));
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    image: [absoluteUrl(p.image)],
    datePublished: p.published,
    dateModified: p.updated,
    inLanguage: localeMeta[p.locale].hreflang,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: site.name, url: absoluteUrl("/") },
    publisher: { "@id": orgId() },
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
