import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Manrope, Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";
import "../globals.css";
import { site } from "@/config/site";
import { isLocale, locales, type Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatFloat from "@/components/ChatFloat";
import MotionController from "@/components/MotionController";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import JsonLd from "@/components/JsonLd";
import { organizationLd, websiteLd } from "@/lib/jsonld";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
// Georgian glyphs fall through to these (Manrope/Cormorant have no Georgian).
const notoSansKa = Noto_Sans_Georgian({ subsets: ["georgian"], variable: "--font-noto-sans-georgian", display: "swap", preload: false });
const notoSerifKa = Noto_Serif_Georgian({ subsets: ["georgian"], weight: ["500", "600", "700"], variable: "--font-noto-serif-georgian", display: "swap", preload: false });

export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#0f0f10",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const locale = (isLocale(lang) ? lang : "ru") as Locale;
  return {
    metadataBase: new URL(site.url),
    applicationName: site.name,
    title: { default: site.name, template: `%s | ${site.name}` },
    description: getDictionary(locale).meta.siteDescription,
    formatDetection: { telephone: false },
    verification: site.analytics.gscVerification ? { google: site.analytics.gscVerification } : undefined,
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const fontVars = `${manrope.variable} ${cormorant.variable} ${notoSansKa.variable} ${notoSerifKa.variable}`;

  return (
    <html lang={lang} className={`${fontVars} no-js`} suppressHydrationWarning>
      <body>
        {site.analytics.gtm && (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${site.analytics.gtm}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
          </noscript>
        )}
        <Header locale={lang} nav={t.nav} cta={t.home.heroCtaTours} />
        <main id="main">{children}</main>
        <Footer locale={lang} t={t} />
        <ChatFloat labels={{ whatsapp: t.common.writeWhatsapp, instagram: t.common.writeInstagram }} message={`Insta Tour — ${t.forms.leadTypeContact}`} />
        <MotionController />
        <AnalyticsScripts />
        <JsonLd data={[organizationLd(t.meta.siteDescription), websiteLd(lang)]} />
      </body>
    </html>
  );
}
