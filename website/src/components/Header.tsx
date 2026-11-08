"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { locales, localeMeta, type Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n";
import { href, paths } from "@/lib/routes";
import { Menu, Cross, ArrowRight } from "./Icons";

type Props = { locale: Locale; nav: Dictionary["nav"]; cta: string };

/** Swap the language prefix of the current URL: /ru/tours/x/ → /en/tours/x/ */
const swapLocale = (pathname: string, to: Locale) => {
  const parts = pathname.split("/");
  parts[1] = to;
  const out = parts.join("/");
  return out.endsWith("/") ? out : `${out}/`;
};

export default function Header({ locale, nav, cta }: Props) {
  const pathname = usePathname() || `/${locale}/`;
  // The menu remembers which page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof v === "function" ? v(open) : v) ? pathname : null);
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  // Pages that start with a dark full-bleed photo get a transparent header on top.
  const overPhoto = /^\/(ru|en|ka)\/((tours\/[^/]+\/)|(custom-tours\/))?$/.test(pathname) || /^\/(ru|en|ka)\/$/.test(pathname);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 24);
      setHidden(y > 400 && y > last + 4);
      if (y < last - 4) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { label: nav.tours, path: paths.tours },
    { label: nav.custom, path: paths.custom },
    { label: nav.about, path: paths.about },
    { label: nav.gallery, path: paths.gallery },
    { label: nav.blog, path: paths.blog },
    { label: nav.faq, path: paths.faq },
    { label: nav.contacts, path: paths.contacts },
  ];
  const isActive = (p: string) => pathname.startsWith(href(locale, p));
  const light = overPhoto && !solid && !open;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-full">
        {nav.skip}
      </a>
      <header
        className={`site-header fixed inset-x-0 top-0 z-50 ${light ? "text-white" : "text-ink"}`}
        data-solid={solid || !overPhoto}
        data-hidden={hidden && !open}
      >
        <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-4">
          <Link href={href(locale, paths.home)} className="flex items-center gap-3 shrink-0" aria-label="Insta Tour">
            <span className="relative block h-11 w-11 overflow-hidden rounded-full bg-white ring-1 ring-black/5 shadow-sm">
              <Image src="/brand/logo-256.webp" alt="" width={44} height={44} priority className="h-full w-full object-cover" />
            </span>
            <span className="font-display text-[1.45rem] leading-none tracking-tight">
              Insta<span className="text-red"> Tour</span>
            </span>
          </Link>

          <nav aria-label={nav.menu} className="hidden xl:flex items-center gap-7 text-[0.93rem] font-semibold">
            {links.map((l) => (
              <Link key={l.path} href={href(locale, l.path)} className="nav-link" aria-current={isActive(l.path) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center rounded-full border border-current/20 p-1 text-xs font-bold" role="group" aria-label={nav.language}>
              {locales.map((l) => (
                <Link
                  key={l}
                  href={swapLocale(pathname, l)}
                  hrefLang={localeMeta[l].hreflang}
                  lang={l}
                  aria-current={l === locale ? "true" : undefined}
                  className={`rounded-full px-2.5 py-1.5 transition-colors ${l === locale ? "bg-red text-white" : "hover:text-red"}`}
                >
                  {localeMeta[l].label}
                </Link>
              ))}
            </div>
            <Link href={href(locale, paths.tours)} className="btn btn-red hidden md:inline-flex !min-h-[44px] !px-5 text-sm">
              {cta}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="xl:hidden relative z-[60] grid h-11 w-11 place-items-center rounded-full border border-current/25"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? nav.close : nav.menu}
            >
              {open ? <Cross className="w-6 h-6" /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className="mobile-panel xl:hidden fixed inset-0 z-[55] bg-ink text-white grain"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="container-x flex h-full flex-col pt-[calc(var(--header-h)+24px)] pb-10 overflow-y-auto">
          <nav className="flex flex-col gap-1" aria-label={nav.menu}>
            <Link href={href(locale, paths.home)} className="m-link font-display text-4xl py-2" style={{ "--i": 0 } as React.CSSProperties}>
              {nav.home}
            </Link>
            {links.map((l, i) => (
              <Link
                key={l.path}
                href={href(locale, l.path)}
                className={`m-link font-display text-4xl py-2 ${isActive(l.path) ? "text-red" : ""}`}
                style={{ "--i": i + 1 } as React.CSSProperties}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-10 flex flex-col gap-6">
            <div className="flex gap-2 text-sm font-bold" role="group" aria-label={nav.language}>
              {locales.map((l) => (
                <Link
                  key={l}
                  href={swapLocale(pathname, l)}
                  hrefLang={localeMeta[l].hreflang}
                  className={`rounded-full border px-4 py-2 ${l === locale ? "bg-red border-red" : "border-white/30"}`}
                >
                  {localeMeta[l].name}
                </Link>
              ))}
            </div>
            <Link href={href(locale, paths.tours)} className="btn btn-red w-full">
              {cta} <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
