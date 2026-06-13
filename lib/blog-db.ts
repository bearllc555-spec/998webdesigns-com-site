import { supabaseAdmin } from "@/lib/supabase";

export type BlogPostRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  url: string;
  published_at: string;
  read_at: string | null;
  inbox_flag: string | null;
};

const SITE_BASE = "https://998webdesigns.com";

export function blogPostUrl(slug: string): string {
  return `${SITE_BASE}/blog/${slug}`;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostRecord | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const { data, error } = await supa
    .from("blog_posts")
    .select("id, slug, title, description, url, published_at, read_at, inbox_flag")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as BlogPostRecord;
}

export async function insertBlogPostRecord(input: {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
}): Promise<{ ok: true; record: BlogPostRecord } | { ok: false; detail: string }> {
  const supa = supabaseAdmin();
  if (!supa) {
    return { ok: false, detail: "Supabase not configured" };
  }

  const row = {
    slug: input.slug,
    title: input.title,
    description: input.description,
    url: blogPostUrl(input.slug),
    published_at: input.publishedAt,
    read_at: null,
    inbox_flag: null,
  };

  const { data, error } = await supa
    .from("blog_posts")
    .upsert(row, { onConflict: "slug", ignoreDuplicates: false })
    .select("id, slug, title, description, url, published_at, read_at, inbox_flag")
    .single();

  if (error) {
    if (/blog_posts|schema cache|does not exist/i.test(error.message)) {
      return {
        ok: false,
        detail:
          "blog_posts table missing - POST /api/admin/migrate-blog-posts with BALANCE_CAPTURE_SECRET",
      };
    }
    console.warn("[blog-db] insert failed:", error.message);
    return { ok: false, detail: error.message };
  }

  return { ok: true, record: data as BlogPostRecord };
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const { error } = await supa.from("blog_posts").delete().eq("id", id);
  if (error) {
    console.warn("[blog-db] delete failed:", error.message);
    return false;
  }
  return true;
}
