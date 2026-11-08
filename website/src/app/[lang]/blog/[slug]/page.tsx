import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { getTour } from "@/data/tours";
import { href, paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { allSlugs, getPost, getPosts, postLocales } from "@/lib/blog";
import { getPhoto } from "@/lib/photos";
import { articleLd } from "@/lib/jsonld";
import Photo from "@/components/Photo";
import TourCard from "@/components/TourCard";
import PostCard from "@/components/PostCard";
import JsonLd from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/ui";
import { ArrowRight } from "@/components/Icons";

type Props = PageProps<"/[lang]/blog/[slug]">;

export const dynamicParams = false;
export function generateStaticParams() {
  return locales.flatMap((lang) => allSlugs().filter((slug) => getPost(slug, lang)).map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const post = getPost(slug, locale);
  if (!post) return {};
  const p = getPhoto(post.cover);
  return pageMetadata({
    locale,
    path: paths.post(slug),
    title: post.title,
    description: post.description,
    type: "article",
    available: postLocales(slug),
    publishedTime: post.published,
    modifiedTime: post.updated,
    image: { url: p.file, width: p.width, height: p.height, alt: p.alt[locale] },
  });
}

export default async function PostPage({ params }: Props) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const post = getPost(slug, locale);
  if (!post) notFound();
  const t = getDictionary(locale);
  const cover = getPhoto(post.cover);
  const related = post.relatedTours.map(getTour).filter((x) => x !== undefined);
  const more = getPosts(locale)
    .filter((p) => p.slug !== slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, 3);
  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : locale === "en" ? "en-GB" : "ru-RU", { dateStyle: "long" });

  return (
    <>
      <JsonLd data={articleLd({ locale, slug, title: post.h1, description: post.description, image: cover.file, published: post.published, updated: post.updated })} />

      <header className="container-x pt-[calc(var(--header-h)+40px)]">
        <Breadcrumbs locale={locale} t={t} items={[{ name: t.nav.blog, path: paths.blog }, { name: post.h1, path: paths.post(slug) }]} />
        <div className="mx-auto mt-10 max-w-4xl text-center">
          <p className="eyebrow justify-center fade-up">{t.blog.categories[post.category]}</p>
          <h1 className="font-display display-lg mt-5 fade-up" style={{ "--d": "100ms" } as React.CSSProperties}>{post.h1}</h1>
          <p className="lead mx-auto mt-5 max-w-2xl fade-up" style={{ "--d": "200ms" } as React.CSSProperties}>{post.excerpt}</p>
          <p className="mt-6 text-sm text-muted fade-up" style={{ "--d": "300ms" } as React.CSSProperties}>
            {t.common.updated}: <time dateTime={post.updated}>{dateFmt.format(new Date(post.updated))}</time> · {t.common.readingTime(post.readingMinutes)}
          </p>
        </div>
      </header>

      <div className="container-x mt-10">
        <figure className="wipe relative aspect-[16/9] overflow-hidden rounded-[var(--radius)] md:aspect-[21/9]">
          <Photo k={post.cover} locale={locale} sizes="(min-width: 1240px) 1200px, 100vw" priority />
        </figure>
        <p className="mt-2 text-right text-xs text-muted">© {cover.author}, {cover.license}, Wikimedia Commons</p>
      </div>

      <div className="container-x grid gap-12 py-14 lg:grid-cols-12">
        {post.toc.length > 2 && (
          <aside className="lg:col-span-3 lg:order-2">
            <nav className="rounded-[var(--radius)] border border-line bg-white p-6 lg:sticky lg:top-28" aria-label={t.blog.tocTitle}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted">{t.blog.tocTitle}</p>
              <ol className="mt-4 space-y-2.5 text-sm">
                {post.toc.map((h) => (
                  <li key={h.id}><a href={`#${h.id}`} className="hover:text-red">{h.text}</a></li>
                ))}
              </ol>
            </nav>
          </aside>
        )}
        <article className={`prose-it ${post.toc.length > 2 ? "lg:col-span-8 lg:col-start-1" : "lg:col-span-8 lg:col-start-3"}`} dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>

      {related.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="container-x">
            <h2 className="font-display display-md reveal">{t.blog.relatedTours}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((tour, i) => (
                <TourCard key={tour.slug} tour={tour} locale={locale} t={t} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-x py-16">
        <div className="reveal flex flex-col items-start gap-6 rounded-[var(--radius)] bg-ink p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <h2 className="font-display display-md">{t.home.customTitle}</h2>
            <p className="mt-3 max-w-xl text-white/75">{t.home.customText}</p>
          </div>
          <Link href={href(locale, paths.custom)} className="btn btn-red shrink-0">{t.common.calcCustom} <ArrowRight /></Link>
        </div>
      </section>

      {more.length > 0 && (
        <section className="container-x pb-24">
          <h2 className="font-display display-md reveal">{t.blog.moreArticles}</h2>
          <div className="mt-10 grid gap-x-6 gap-y-14 md:grid-cols-3">
            {more.map((p, i) => (
              <PostCard key={p.slug} post={p} locale={locale} t={t} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
