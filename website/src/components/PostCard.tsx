import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n";
import type { PostMeta } from "@/lib/blog";
import { href, paths } from "@/lib/routes";
import Photo from "./Photo";

export default function PostCard({ post, locale, t, index = 0, large }: { post: PostMeta; locale: Locale; t: Dictionary; index?: number; large?: boolean }) {
  return (
    <article className={`reveal group relative ${large ? "md:col-span-2" : ""}`} style={{ "--d": `${(index % 3) * 90}ms` } as React.CSSProperties}>
      <Link href={href(locale, paths.post(post.slug))} className="block">
        <div className={`relative overflow-hidden rounded-[var(--radius)] ${large ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
          <Photo k={post.cover} locale={locale} sizes={large ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"} className="transition-transform duration-[1.4s] group-hover:scale-105" />
          <span className="absolute left-4 top-4 chip !bg-black/40">{t.blog.categories[post.category]}</span>
        </div>
        <h3 className={`mt-5 font-display leading-[1.12] group-hover:text-red transition-colors ${large ? "text-4xl" : "text-[1.7rem]"}`}>{post.h1}</h3>
        <p className="mt-3 text-muted leading-relaxed line-clamp-3">{post.excerpt}</p>
        <p className="mt-3 text-sm font-semibold text-ink">{t.common.readingTime(post.readingMinutes)} →</p>
      </Link>
    </article>
  );
}
