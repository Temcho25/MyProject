import type { Metadata } from "next";
import { site } from "@/config/site";
import { defaultLocale, locales, localeMeta, type Locale } from "@/i18n/locales";
import { href } from "./routes";

export const absoluteUrl = (path: string) => `${site.url}${path}`;

/**
 * Alternate-language links for a page that exists in the given locales.
 * x-default points to the Russian version (the default language).
 */
export function languageAlternates(path: string, available: readonly Locale[] = locales) {
  const languages: Record<string, string> = {};
  for (const l of available) languages[localeMeta[l].hreflang] = absoluteUrl(href(l, path));
  const xDefault = available.includes(defaultLocale) ? defaultLocale : available[0];
  languages["x-default"] = absoluteUrl(href(xDefault, path));
  return languages;
}

type PageMetaInput = {
  locale: Locale;
  path: string; // without locale, e.g. "/tours/"
  title: string;
  description: string;
  image?: { url: string; width: number; height: number; alt: string };
  type?: "website" | "article";
  available?: readonly Locale[];
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
};

export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = "website",
  available = locales,
  publishedTime,
  modifiedTime,
  noindex,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(href(locale, path));
  const images = image ? [{ ...image, url: absoluteUrl(image.url) }] : undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: languageAlternates(path, available) },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: site.name,
      locale: localeMeta[locale].og,
      alternateLocale: available.filter((l) => l !== locale).map((l) => localeMeta[l].og),
      images,
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.map((i) => i.url),
    },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}
