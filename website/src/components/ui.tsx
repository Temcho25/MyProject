import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n";
import { href, paths } from "@/lib/routes";
import { breadcrumbLd } from "@/lib/jsonld";
import JsonLd from "./JsonLd";
import Photo from "./Photo";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  dark,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  dark?: boolean;
  as?: "h1" | "h2";
}) {
  return (
    <div className={`reveal max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className={`eyebrow ${align === "center" ? "justify-center" : ""}`}>{eyebrow}</p>}
      <Tag className={`font-display display-lg mt-4 ${dark ? "text-white" : ""}`}>{title}</Tag>
      {lead && <p className={`lead mt-5 ${dark ? "!text-white/75" : ""}`}>{lead}</p>}
    </div>
  );
}

export function FaqList({ items, className = "" }: { items: { q: string; a: string }[]; className?: string }) {
  return (
    <div className={`faq ${className}`}>
      {items.map((it, i) => (
        <details key={i} className="reveal" style={{ "--d": `${i * 60}ms` } as React.CSSProperties}>
          <summary>
            <span>{it.q}</span>
            <span className="pm" aria-hidden />
          </summary>
          <p className="answer">{it.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Visible breadcrumbs + matching BreadcrumbList JSON-LD. */
export function Breadcrumbs({
  locale,
  t,
  items,
  light,
}: {
  locale: Locale;
  t: Dictionary;
  items: { name: string; path: string }[]; // last item = current page
  light?: boolean;
}) {
  const all = [{ name: t.common.breadcrumbHome, path: paths.home }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={`text-sm ${light ? "text-white/75" : "text-muted"}`}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {all.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="opacity-50">/</span>}
              {i < all.length - 1 ? (
                <Link href={href(locale, it.path)} className={light ? "hover:text-white" : "hover:text-red"}>
                  {it.name}
                </Link>
              ) : (
                <span aria-current="page" className={light ? "text-white" : "text-ink"}>{it.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(all.map((it) => ({ name: it.name, path: href(locale, it.path) })))} />
    </>
  );
}

/** Interior page header: full-bleed photo with layered depth, or a plain paper header. */
export function PageHero({
  locale,
  photo,
  eyebrow,
  title,
  lead,
  children,
  crumbs,
}: {
  locale: Locale;
  photo?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
  crumbs?: React.ReactNode;
}) {
  if (!photo) {
    return (
      <section className="container-x pt-[calc(var(--header-h)+40px)] pb-10 md:pb-14">
        {crumbs}
        <div className="mt-8 max-w-4xl">
          {eyebrow && <p className="eyebrow fade-up">{eyebrow}</p>}
          <h1 className="font-display display-lg mt-4 fade-up" style={{ "--d": "120ms" } as React.CSSProperties}>{title}</h1>
          {lead && <p className="lead mt-5 max-w-2xl fade-up" style={{ "--d": "240ms" } as React.CSSProperties}>{lead}</p>}
          {children}
        </div>
      </section>
    );
  }
  return (
    <section className="hero relative isolate flex min-h-[78svh] items-end overflow-hidden bg-ink text-white">
      <div className="hero-bg absolute inset-[-6%] -z-20">
        <Photo k={photo} locale={locale} sizes="100vw" priority quality={80} />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />
      <div className="hero-mid mist absolute inset-0 -z-10" aria-hidden />
      <div className="hero-content container-x pb-14 pt-[calc(var(--header-h)+48px)] md:pb-20">
        {crumbs}
        {eyebrow && <p className="eyebrow mt-8 !text-white fade-up">{eyebrow}</p>}
        <h1 className="font-display display-lg mt-4 max-w-4xl fade-up" style={{ "--d": "120ms" } as React.CSSProperties}>{title}</h1>
        {lead && <p className="lead mt-5 max-w-2xl !text-white/85 fade-up" style={{ "--d": "240ms" } as React.CSSProperties}>{lead}</p>}
        {children}
      </div>
    </section>
  );
}
