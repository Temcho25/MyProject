import type { Metadata } from "next";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getPhoto } from "@/lib/photos";
import { formProps } from "@/lib/formProps";
import { primaryChat } from "@/lib/contact";
import LeadForm from "@/components/LeadForm";
import Photo from "@/components/Photo";
import { Breadcrumbs, PageHero, SectionHeading } from "@/components/ui";
import { ArrowRight, Route, Clock, Users, Sparkle, WhatsAppIcon, InstagramIcon } from "@/components/Icons";

type Props = PageProps<"/[lang]/custom-tours">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const p = getPhoto("shanghai-bund");
  return pageMetadata({ locale, path: paths.custom, title: t.custom.seoTitle, description: t.custom.seoDescription, image: { url: p.file, width: p.width, height: p.height, alt: p.alt[locale] } });
}

const ICONS = [Route, Sparkle, Clock, Users];

export default async function CustomToursPage({ params }: Props) {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const c = t.custom;
  const chat = primaryChat(`Insta Tour — ${t.forms.leadTypeCustom}`);
  return (
    <>
      <PageHero
        locale={locale}
        photo="shanghai-bund"
        eyebrow={t.nav.custom}
        title={c.title}
        lead={c.lead}
        crumbs={<Breadcrumbs light locale={locale} t={t} items={[{ name: t.nav.custom, path: paths.custom }]} />}
      >
        <a href="#quote" className="btn btn-red mt-8 fade-up" style={{ "--d": "360ms" } as React.CSSProperties}>
          {t.common.calcCustom} <ArrowRight />
        </a>
      </PageHero>

      <section className="container-x py-20 md:py-24">
        <SectionHeading title={c.whatTitle} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.what.map((w, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div key={w.title} className="reveal card p-7" style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-soft text-red"><Icon /></span>
                <h3 className="mt-5 text-xl font-extrabold">{w.title}</h3>
                <p className="mt-2 text-muted leading-relaxed">{w.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="wipe relative aspect-[4/3] overflow-hidden rounded-[var(--radius)]">
            <div data-parallax className="absolute inset-[-10%]" style={{ "--speed": "-40px" } as React.CSSProperties}>
              <Photo k="guangzhou-canton-tower" locale={locale} sizes="(min-width: 1024px) 50vw, 100vw" />
            </div>
          </div>
          <div>
            <SectionHeading title={c.priceTitle} lead={c.priceText} />
            <h3 className="mt-10 text-sm font-bold uppercase tracking-widest text-muted reveal">{c.howTitle}</h3>
            <ol className="mt-5 space-y-4">
              {c.how.map((step, i) => (
                <li key={step} className="reveal flex items-center gap-4" style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink font-bold text-white">{i + 1}</span>
                  <span className="text-lg">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="quote" className="scroll-mt-20 relative overflow-hidden bg-ink py-20 text-white grain md:py-24">
        <div className="container-x relative grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow={t.nav.custom} title={c.formTitle} lead={c.formLead} dark />
            <a href={chat.url} target="_blank" rel="noopener noreferrer" className={`btn mt-8 text-white reveal ${chat.kind === "whatsapp" ? "!bg-[#25D366]" : "btn-red"}`} data-track-label="custom-page">
              {chat.kind === "whatsapp" ? <WhatsAppIcon /> : <InstagramIcon />}
              {chat.kind === "whatsapp" ? t.common.writeWhatsapp : t.common.writeInstagram}
            </a>
          </div>
          <div className="lg:col-span-8 reveal">
            <div className="rounded-[var(--radius)] bg-white p-6 text-ink sm:p-10">
              <LeadForm variant="custom" submitLabel={t.common.calcCustom} {...formProps(locale)} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
