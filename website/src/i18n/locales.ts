export const locales = ["ru", "en", "ka"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** BCP 47 codes for hreflang / og:locale */
export const localeMeta: Record<Locale, { label: string; name: string; hreflang: string; og: string }> = {
  ru: { label: "RU", name: "Русский", hreflang: "ru", og: "ru_RU" },
  en: { label: "EN", name: "English", hreflang: "en", og: "en_US" },
  ka: { label: "KA", name: "ქართული", hreflang: "ka", og: "ka_GE" },
};

/** A value that exists in every language. */
export type Localized<T = string> = Record<Locale, T>;
