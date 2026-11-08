/**
 * Everything about the brand that may change lives here.
 * Contacts and IDs come from environment variables (see .env.example),
 * so they can be updated in Vercel without touching the code.
 */

const clean = (v: string | undefined) => (v ?? "").trim();

function resolveSiteUrl() {
  const explicit = clean(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

const whatsappDigits = clean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER).replace(/\D/g, "");

export const site = {
  name: "Insta Tour",
  url: resolveSiteUrl(),
  logo: "/brand/logo-512.png",
  /** Group size for the fixed-departure tours. */
  groupSize: { min: 5, max: 7 },
  contacts: {
    whatsapp: whatsappDigits, // "" when not configured
    phone: clean(process.env.NEXT_PUBLIC_PHONE),
    email: clean(process.env.NEXT_PUBLIC_EMAIL),
  },
  social: {
    instagram: clean(process.env.NEXT_PUBLIC_INSTAGRAM_URL) || "https://www.instagram.com/instatour_china",
    tiktok: clean(process.env.NEXT_PUBLIC_TIKTOK_URL),
    telegram: clean(process.env.NEXT_PUBLIC_TELEGRAM_URL),
    facebook: clean(process.env.NEXT_PUBLIC_FACEBOOK_URL),
  },
  analytics: {
    ga4: clean(process.env.NEXT_PUBLIC_GA4_ID),
    gtm: clean(process.env.NEXT_PUBLIC_GTM_ID),
    metaPixel: clean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
    gscVerification: clean(process.env.NEXT_PUBLIC_GSC_VERIFICATION),
  },
} as const;

export const socialLinks = () =>
  (
    [
      ["instagram", site.social.instagram],
      ["tiktok", site.social.tiktok],
      ["telegram", site.social.telegram],
      ["facebook", site.social.facebook],
    ] as const
  ).filter(([, url]) => Boolean(url));
