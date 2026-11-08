import type { Metadata } from "next";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { CATEGORIES, getPosts } from "@/lib/blog";
import { getPhoto } from "@/lib/photos";
import PostCard from "@/components/PostCard";
import { Breadcrumbs, PageHero } from "@/components/ui";

type Props = PageProps<"/[lang]/blog">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const p = getPhoto("forbidden-city");
  return pageMetadata({ locale, path: paths.blog, title: t.blog.seoTitle, description: t.blog.seoDescription, image: { url: p.file, width: p.width, height: p.height, alt: p.alt[locale] } });
}

export default async function BlogPage({ params }: Props) {
  const locale = (await params).lang as Locale;
  const t = getDictionary(locale);
  const posts = getPosts(locale);
  const groups = CATEGORIES.map((c) => ({ c, posts: posts.filter((p) => p.category === c) })).filter((g) => g.posts.length);

  return (
    <>
      <PageHero locale={locale} eyebrow={t.nav.blog} title={t.blog.title} lead={t.blog.lead} crumbs={<Breadcrumbs locale={locale} t={t} items={[{ name: t.nav.blog, path: paths.blog }]} />}>
        <nav className="mt-8 flex flex-wrap gap-2 fade-up" style={{ "--d": "320ms" } as React.CSSProperties} aria-label={t.blog.tocTitle}>
          {groups.map((g) => (
            <a key={g.c} href={`#${g.c}`} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-red hover:text-red">
              {t.blog.categories[g.c]} <span className="text-muted">({g.posts.length})</span>
            </a>
          ))}
        </nav>
      </PageHero>
      {posts.length === 0 && <p className="container-x pb-24 text-muted">{t.blog.empty}</p>}
      {groups.map((g) => (
        <section key={g.c} id={g.c} className="container-x scroll-mt-24 pb-20">
          <h2 className="font-display display-md reveal border-t border-line pt-10">{t.blog.categories[g.c]}</h2>
          <div className="mt-10 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {g.posts.map((p, i) => (
              <PostCard key={p.slug} post={p} locale={locale} t={t} index={i} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
