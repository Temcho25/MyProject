import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked, type Tokens } from "marked";
import { locales, type Locale } from "@/i18n/locales";
import { getPhoto, photoAlt } from "./photos";
import type { TourSlug } from "@/data/tours";

/**
 * Blog articles are Markdown files: content/blog/<slug>/<locale>.md
 * (format described in content/README.md). Adding a folder publishes a new
 * article in every language it has a file for — no code changes needed.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
export const CATEGORIES = ["cities", "attractions", "guides"] as const;
export type Category = (typeof CATEGORIES)[number];

export type PostMeta = {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  h1: string;
  excerpt: string;
  category: Category;
  cover: string;
  keyword: string;
  relatedTours: TourSlug[];
  published: string;
  updated: string;
  readingMinutes: number;
};

export type Post = PostMeta & { html: string; toc: { id: string; text: string }[] };

const toDate = (v: unknown) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "").slice(0, 10);

function slugifyHeading(text: string, used: Map<string, number>) {
  const base =
    text
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "section";
  const n = used.get(base) ?? 0;
  used.set(base, n + 1);
  return n ? `${base}-${n}` : base;
}

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function optimizedSrc(file: string, w: number) {
  return `/_next/image?url=${encodeURIComponent(file)}&w=${w}&q=75`;
}

function renderMarkdown(md: string, locale: Locale) {
  const used = new Map<string, number>();
  const toc: { id: string; text: string }[] = [];
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Heading) {
        const inner = this.parser.parseInline(token.tokens);
        // Body H1s are demoted: the page renders its own H1.
        const depth = Math.max(2, token.depth);
        const id = slugifyHeading(token.text, used);
        if (depth === 2) toc.push({ id, text: inner.replace(/<[^>]+>/g, "") });
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      image(token: Tokens.Image) {
        const alt = token.text || "";
        if (token.href.startsWith("photo:")) {
          const p = getPhoto(token.href.slice(6));
          const srcset = [640, 1080, 1600].map((w) => `${optimizedSrc(p.file, w)} ${w}w`).join(", ");
          return `<figure class="prose-figure"><img src="${optimizedSrc(p.file, 1080)}" srcset="${srcset}" sizes="(min-width: 900px) 760px, 100vw" width="${p.width}" height="${p.height}" alt="${escapeAttr(alt || photoAlt(p, locale))}" loading="lazy" decoding="async" /><figcaption>${escapeAttr(alt)} <span>© ${escapeAttr(p.author)}, ${escapeAttr(p.license)}</span></figcaption></figure>`;
        }
        return `<img src="${escapeAttr(token.href)}" alt="${escapeAttr(alt)}" loading="lazy" decoding="async" />`;
      },
      link(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Link) {
        const inner = this.parser.parseInline(token.tokens);
        const external = /^https?:\/\//.test(token.href);
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `<a href="${escapeAttr(token.href)}"${attrs}>${inner}</a>`;
      },
      table(this: unknown, token: Tokens.Table) {
        // Wrap tables so they scroll horizontally on phones instead of the page.
        const head = token.header.map((c) => `<th>${c.text}</th>`).join("");
        const rows = token.rows.map((r) => `<tr>${r.map((c) => `<td>${c.text}</td>`).join("")}</tr>`).join("");
        return `<div class="prose-table"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
      },
    },
  });
  const html = marked.parse(md, { async: false }) as string;
  return { html, toc };
}

function readFile(slug: string, locale: Locale): Post | null {
  const file = path.join(BLOG_DIR, slug, `${locale}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const required = ["title", "description", "h1", "excerpt", "category", "cover"];
  for (const key of required) {
    if (!data[key]) throw new Error(`Blog post ${slug}/${locale}.md is missing "${key}" in frontmatter`);
  }
  if (!CATEGORIES.includes(data.category)) {
    throw new Error(`Blog post ${slug}/${locale}.md has unknown category "${data.category}"`);
  }
  const words = content.split(/\s+/).filter(Boolean).length;
  const { html, toc } = renderMarkdown(content, locale);
  return {
    slug,
    locale,
    title: String(data.title),
    description: String(data.description),
    h1: String(data.h1),
    excerpt: String(data.excerpt),
    category: data.category,
    cover: String(data.cover),
    keyword: String(data.keyword ?? ""),
    relatedTours: (data.relatedTours ?? []) as TourSlug[],
    published: toDate(data.published),
    updated: toDate(data.updated ?? data.published),
    readingMinutes: Math.max(3, Math.round(words / 200)),
    html,
    toc,
  };
}

const cache = new Map<string, Post | null>();
function load(slug: string, locale: Locale) {
  const k = `${slug}/${locale}`;
  if (!cache.has(k)) cache.set(k, readFile(slug, locale));
  return cache.get(k)!;
}

export function allSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function getPost(slug: string, locale: Locale): Post | null {
  if (!allSlugs().includes(slug)) return null;
  return load(slug, locale);
}

/** Locales in which an article exists (for hreflang and the language switcher). */
export function postLocales(slug: string): Locale[] {
  return locales.filter((l) => load(slug, l) !== null);
}

function toMeta(p: Post): PostMeta {
  const meta: Partial<Post> = { ...p };
  delete meta.html;
  delete meta.toc;
  return meta as PostMeta;
}

export function getPosts(locale: Locale): PostMeta[] {
  return allSlugs()
    .map((s) => load(s, locale))
    .filter((p): p is Post => p !== null)
    .map(toMeta)
    .sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : a.slug.localeCompare(b.slug)));
}

export function getPostsBySlugs(slugs: string[], locale: Locale): PostMeta[] {
  return getPosts(locale).filter((p) => slugs.includes(p.slug));
}
