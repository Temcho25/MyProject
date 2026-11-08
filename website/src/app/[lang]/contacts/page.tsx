import type { Metadata } from "next";
import { site } from "@/config/site";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { formProps } from "@/lib/formProps";
import { whatsappLink } from "@/lib/whatsapp";
import { instagramDm } from "@/lib/contact";
import LeadForm from "@/components/LeadForm";
import SocialLinks from "@/components/SocialLinks";
import { Breadcrumbs, PageHero } from "@/components/ui";
import { Mail, Phone, WhatsAppIcon, InstagramIcon } from "@/components/Icons";

type Props = PageProps<"/[lang]/contacts">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: paths.contacts, title: t.contacts.seoTitle, description: t.contacts.seoDescription });
}

export default async function ContactsPage({ params }: Props) {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const c = t.contacts;
  const wa = whatsappLink(`Insta Tour — ${t.forms.leadTypeContact}`);
  const rows = [
    { icon: WhatsAppIcon, label: c.whatsapp, value: wa ? `+${site.contacts.whatsapp}` : "", href: wa ?? "" },
    { icon: Phone, label: c.phone, value: site.contacts.phone, href: site.contacts.phone ? `tel:${site.contacts.phone.replace(/[^\d+]/g, "")}` : "" },
    { icon: Mail, label: c.email, value: site.contacts.email, href: site.contacts.email ? `mailto:${site.contacts.email}` : "" },
    { icon: InstagramIcon, label: "Instagram", value: "@" + (site.social.instagram.match(/instagram\.com\/([^/?#]+)/)?.[1] ?? "instatour"), href: instagramDm() },
  ];

  return (
    <>
      <PageHero locale={locale} eyebrow={t.nav.contacts} title={c.title} lead={c.lead} crumbs={<Breadcrumbs locale={locale} t={t} items={[{ name: t.nav.contacts, path: paths.contacts }]} />} />
      <section className="container-x grid gap-12 pb-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ul className="divide-y divide-line border-y border-line">
            {rows.map((r, i) => (
              <li key={r.label} className="reveal flex items-center gap-5 py-6" style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red-soft text-red"><r.icon /></span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">{r.label}</p>
                  {r.value && r.href ? (
                    <a href={r.href} target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="mt-1 block truncate text-lg font-semibold hover:text-red" data-track-label="contacts-page">
                      {r.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-muted">{c.notConfigured}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm font-bold uppercase tracking-widest text-muted reveal">{c.social}</p>
          <SocialLinks className="mt-4 reveal" />
        </div>
        <div className="lg:col-span-7 reveal">
          <div className="rounded-[var(--radius)] border border-line bg-white p-6 sm:p-10">
            <h2 className="font-display display-md mb-8">{c.formTitle}</h2>
            <LeadForm variant="contact" {...formProps(locale)} />
          </div>
        </div>
      </section>
    </>
  );
}
