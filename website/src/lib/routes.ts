import type { Locale } from "@/i18n/locales";

/** Paths without the language prefix. Every path ends with a slash. */
export const paths = {
  home: "/",
  tours: "/tours/",
  tour: (slug: string) => `/tours/${slug}/`,
  custom: "/custom-tours/",
  about: "/about/",
  gallery: "/gallery/",
  blog: "/blog/",
  post: (slug: string) => `/blog/${slug}/`,
  contacts: "/contacts/",
  faq: "/faq/",
  privacy: "/privacy/",
  terms: "/booking-terms/",
} as const;

/** "/ru" + "/tours/" → "/ru/tours/" */
export const href = (locale: Locale, path: string) => `/${locale}${path}`;
