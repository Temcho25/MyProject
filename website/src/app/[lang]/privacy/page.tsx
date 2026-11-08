import type { Metadata } from "next";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import LegalPage from "@/components/LegalPage";

type Props = PageProps<"/[lang]/privacy">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const d = getDictionary(locale).legal.privacy;
  return pageMetadata({ locale, path: paths.privacy, title: d.seoTitle, description: d.seoDescription });
}

export default async function PrivacyPage({ params }: Props) {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  return <LegalPage locale={locale} t={t} doc={t.legal.privacy} path={paths.privacy} />;
}
