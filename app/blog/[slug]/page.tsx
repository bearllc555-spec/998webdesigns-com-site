import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { BlogCta } from "@/components/blog/BlogCta";
import { formatPostDate, getAllSlugs, getPostBySlug } from "@/lib/blog";
import { SITE_ORIGIN, withSiteSeo } from "@/lib/site-origin";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const path = `/blog/${slug}`;

  return withSiteSeo(path, {
    title: `${post.title} - 998 web designs`,
    description: post.description,
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
    },
  });
}

function BlogPostingJsonLd({
  post,
}: {
  post: NonNullable<ReturnType<typeof getPostBySlug>>;
}) {
  const json = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Organization",
      name: post.author ?? "998 web designs",
    },
    publisher: {
      "@type": "Organization",
      name: "998 web designs",
      url: SITE_ORIGIN,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_ORIGIN}/blog/${post.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-bg">
      <BlogPostingJsonLd post={post} />
      <Nav />
      <main id="main" className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <Link
          href="/blog"
          className="text-sm font-medium text-accent transition hover:text-accent-deep"
        >
          &larr; All field notes
        </Link>

        <header className="mt-8 border-b border-rule pb-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate">
            <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
            <span aria-hidden>&middot;</span>
            <span>{post.readingMinutes} min read</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight text-ink md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{post.description}</p>
          {post.tags && post.tags.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-rule-soft px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <BlogPostBody content={post.content} />
        <BlogCta />
      </main>
      <Footer />
    </div>
  );
}
