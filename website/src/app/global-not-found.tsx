import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Insta Tour",
  robots: { index: false },
};

/** For URLs that match no route at all (e.g. /xx/ with an unknown language). */
export default function GlobalNotFound() {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "system-ui, sans-serif" }}>
        <main className="container-x flex min-h-[100svh] flex-col justify-center">
          <p style={{ fontSize: "clamp(6rem,20vw,12rem)", lineHeight: 1, color: "#c5161d", fontWeight: 700 }}>404</p>
          <h1 style={{ fontSize: "1.6rem", marginTop: "1rem" }}>Страница не найдена · Page not found · გვერდი ვერ მოიძებნა</h1>
          <p style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link className="btn btn-red" href="/ru/">Insta Tour — RU</Link>
            <Link className="btn btn-ghost" href="/en/">EN</Link>
            <Link className="btn btn-ghost" href="/ka/">KA</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
