import Link from "next/link";
import type { BlogPostMeta } from "@/lib/blog-types";
import { formatPostDate } from "@/lib/blog";

type Props = {
  post: BlogPostMeta & { readingMinutes?: number };
};

export function BlogPostCard({ post }: Props) {
  return (
    <article className="group relative flex flex-col rounded-2xl border border-rule bg-bg p-6 transition hover:border-accent/30 hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate">
        <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
        {post.readingMinutes ? (
          <>
            <span aria-hidden>&middot;</span>
            <span>{post.readingMinutes} min read</span>
          </>
        ) : null}
      </div>
      <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink transition group-hover:text-accent">
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 relative">
          {post.title}
        </Link>
      </h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
        {post.description}
      </p>
      {post.tags && post.tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
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
      <p className="mt-5 text-sm font-medium text-accent">
        Read article <span aria-hidden>&rarr;</span>
      </p>
    </article>
  );
}
