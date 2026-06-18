import { blogPostUrl } from "@/lib/blog-db";
import { getPublishedPostBySlug } from "@/lib/blog-store";
import { notifyCrmActivity } from "@/lib/crm-notify";

export type PublishBlogPostResult =
  | { ok: true; slug: string; url: string; notified: boolean; skipped?: boolean }
  | { ok: false; detail: string };

/** Send the CRM/Telegram alert for a published post. Used by the dashboard publish flow + cron. */
export async function notifyBlogPublished(post: {
  slug: string;
  title: string;
  description: string;
}): Promise<void> {
  await notifyCrmActivity({
    kind: "blog_published",
    businessName: post.title,
    message: post.description,
    postUrl: blogPostUrl(post.slug),
  });
}

/**
 * Push a published post's alert to CRM + Telegram by slug.
 * Used by `npm run blog:notify` / POST /api/admin/blog-notify.
 * The blog_posts row is the post itself, so this only re-sends the alert.
 */
export async function publishBlogPostToCrm(
  slug: string
): Promise<PublishBlogPostResult> {
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    return { ok: false, detail: `No published post with slug "${slug}"` };
  }

  await notifyBlogPublished({
    slug: post.slug,
    title: post.title,
    description: post.description,
  });

  return { ok: true, slug, url: blogPostUrl(slug), notified: true };
}
