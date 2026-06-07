import { getPostBySlug } from "@/lib/blog";
import { blogPostUrl, getBlogPostBySlug, insertBlogPostRecord } from "@/lib/blog-db";
import { notifyCrmActivity } from "@/lib/crm-notify";

export type PublishBlogPostResult =
  | { ok: true; slug: string; url: string; notified: boolean; skipped?: boolean }
  | { ok: false; detail: string };

/** Record post in CRM feed + push Telegram alert. Idempotent by slug unless forceNotify. */
export async function publishBlogPostToCrm(
  slug: string,
  options?: { forceNotify?: boolean }
): Promise<PublishBlogPostResult> {
  const post = getPostBySlug(slug);
  if (!post) {
    return { ok: false, detail: `No markdown file at content/blog/${slug}.md` };
  }

  const existing = await getBlogPostBySlug(slug);
  if (existing && !options?.forceNotify) {
    return {
      ok: true,
      slug,
      url: blogPostUrl(slug),
      notified: false,
      skipped: true,
    };
  }

  const inserted = await insertBlogPostRecord({
    slug: post.slug,
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
  });

  if (!inserted.ok) {
    return { ok: false, detail: inserted.detail };
  }

  const url = blogPostUrl(slug);

  await notifyCrmActivity({
    kind: "blog_published",
    businessName: post.title,
    message: post.description,
    postUrl: url,
  });

  return { ok: true, slug, url, notified: true };
}
