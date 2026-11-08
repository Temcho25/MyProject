import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n";
import { Breadcrumbs, PageHero } from "./ui";

type Doc = Dictionary["legal"]["privacy"];

export default function LegalPage({ locale, t, doc, path }: { locale: Locale; t: Dictionary; doc: Doc; path: string }) {
  return (
    <>
      <PageHero locale={locale} title={doc.title} crumbs={<Breadcrumbs locale={locale} t={t} items={[{ name: doc.title, path }]} />}>
        <p className="mt-4 text-sm text-muted">{t.common.updated}: <time dateTime={doc.updated}>{doc.updated}</time></p>
      </PageHero>
      <article className="container-x pb-24">
        <div className="prose-it max-w-3xl">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
          <blockquote>{doc.note}</blockquote>
        </div>
      </article>
    </>
  );
}
