import "server-only";

import { blogPostUrl } from "@/lib/blog-db";
import type { BlogPost } from "@/lib/blog-types";
import { supabaseAdmin } from "@/lib/supabase";

export type BlogStatus = "draft" | "scheduled" | "published" | "archived";

export const BLOG_STATUSES: BlogStatus[] = [
  "draft",
  "scheduled",
  "published",
  "archived",
];

/** Raw DB shape (snake_case). */
type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string | null;
  url: string;
  tags: string[] | null;
  author: string | null;
  featured: boolean | null;
  og_image_url: string | null;
  status: BlogStatus;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string | null;
  view_count: number | null;
};

/** Admin/dashboard view of a post (any status). */
export type BlogDashboardPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  url: string;
  tags: string[];
  author: string;
  featured: boolean;
  ogImageUrl: string | null;
  status: BlogStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  viewCount: number;
};

const COLUMNS =
  "id, slug, title, description, body, url, tags, author, featured, og_image_url, status, published_at, scheduled_at, created_at, updated_at, view_count";

const MISSING_TABLE = /blog_posts|schema cache|does not exist|column .* does not exist/i;

function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `post-${Date.now()}`
  );
}

function rowToDashboard(row: BlogPostRow): BlogDashboardPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    body: row.body ?? "",
    url: row.url,
    tags: row.tags ?? [],
    author: row.author ?? "998 web designs",
    featured: Boolean(row.featured),
    ogImageUrl: row.og_image_url,
    status: row.status,
    publishedAt: row.published_at,
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewCount: row.view_count ?? 0,
  };
}

function rowToPublic(row: BlogPostRow): BlogPost {
  const content = (row.body ?? "").trim();
  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    publishedAt: row.published_at ?? "",
    updatedAt: row.updated_at ?? undefined,
    author: row.author ?? "998 web designs",
    tags: row.tags ?? [],
    featured: Boolean(row.featured),
    content,
    readingMinutes: readingMinutes(content),
  };
}

/* ------------------------------------------------------------------ */
/* Public reads (live /blog)                                          */
/* ------------------------------------------------------------------ */

export async function getAllPublishedPosts(): Promise<BlogPost[]> {
  const supa = supabaseAdmin();
  if (!supa) return [];

  const { data, error } = await supa
    .from("blog_posts")
    .select(COLUMNS)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error) {
    if (!MISSING_TABLE.test(error.message)) {
      console.warn("[blog-store] getAllPublishedPosts:", error.message);
    }
    return [];
  }

  return (data as BlogPostRow[]).map(rowToPublic);
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const { data, error } = await supa
    .from("blog_posts")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return rowToPublic(data as BlogPostRow);
}

export async function getPublishedSlugs(): Promise<string[]> {
  const supa = supabaseAdmin();
  if (!supa) return [];

  const { data, error } = await supa
    .from("blog_posts")
    .select("slug")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString());

  if (error || !data) return [];
  return (data as { slug: string }[]).map((r) => r.slug);
}

/* ------------------------------------------------------------------ */
/* Admin reads/writes (dashboard)                                     */
/* ------------------------------------------------------------------ */

export async function listDashboardPosts(): Promise<
  { ok: true; posts: BlogDashboardPost[] } | { ok: false; detail: string }
> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, detail: "Supabase not configured" };

  const { data, error } = await supa
    .from("blog_posts")
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    if (MISSING_TABLE.test(error.message)) {
      return {
        ok: false,
        detail:
          "blog_posts authoring columns missing - POST /api/admin/migrate-blog-authoring with BALANCE_CAPTURE_SECRET",
      };
    }
    return { ok: false, detail: error.message };
  }

  return { ok: true, posts: (data as BlogPostRow[]).map(rowToDashboard) };
}

export async function getDashboardPostById(id: string): Promise<BlogDashboardPost | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const { data, error } = await supa
    .from("blog_posts")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToDashboard(data as BlogPostRow);
}

async function slugExists(supa: NonNullable<ReturnType<typeof supabaseAdmin>>, slug: string, exceptId?: string): Promise<boolean> {
  let query = supa.from("blog_posts").select("id").eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

async function uniqueSlug(
  supa: NonNullable<ReturnType<typeof supabaseAdmin>>,
  base: string,
  exceptId?: string
): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let n = 2;
  while (await slugExists(supa, candidate, exceptId)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}

export type CreateDraftInput = {
  title: string;
  slug?: string;
  description?: string;
  body?: string;
  tags?: string[];
  author?: string;
  featured?: boolean;
  ogImageUrl?: string | null;
};

export async function createDraftPost(
  input: CreateDraftInput
): Promise<{ ok: true; post: BlogDashboardPost } | { ok: false; detail: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, detail: "Supabase not configured" };

  const title = input.title.trim();
  if (!title) return { ok: false, detail: "Title is required" };

  const slug = await uniqueSlug(supa, input.slug?.trim() || title);

  const { data, error } = await supa
    .from("blog_posts")
    .insert({
      slug,
      title,
      description: input.description?.trim() ?? "",
      body: input.body ?? "",
      url: blogPostUrl(slug),
      tags: input.tags ?? [],
      author: input.author?.trim() || "998 web designs",
      featured: Boolean(input.featured),
      og_image_url: input.ogImageUrl ?? null,
      status: "draft",
      published_at: null,
      scheduled_at: null,
      updated_at: new Date().toISOString(),
    })
    .select(COLUMNS)
    .single();

  if (error) {
    if (MISSING_TABLE.test(error.message)) {
      return {
        ok: false,
        detail:
          "blog_posts authoring columns missing - POST /api/admin/migrate-blog-authoring with BALANCE_CAPTURE_SECRET",
      };
    }
    return { ok: false, detail: error.message };
  }

  return { ok: true, post: rowToDashboard(data as BlogPostRow) };
}

export type UpdatePostInput = {
  title?: string;
  slug?: string;
  description?: string;
  body?: string;
  tags?: string[];
  author?: string;
  featured?: boolean;
  ogImageUrl?: string | null;
};

/** Edit content/metadata. Never touches status or published_at. */
export async function updatePost(
  id: string,
  input: UpdatePostInput
): Promise<{ ok: true; post: BlogDashboardPost } | { ok: false; detail: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, detail: "Supabase not configured" };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) return { ok: false, detail: "Title cannot be empty" };
    patch.title = title;
  }
  if (input.slug !== undefined) {
    const slug = await uniqueSlug(supa, input.slug || input.title || "post", id);
    patch.slug = slug;
    patch.url = blogPostUrl(slug);
  }
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.body !== undefined) patch.body = input.body;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.author !== undefined) patch.author = input.author.trim() || "998 web designs";
  if (input.featured !== undefined) patch.featured = Boolean(input.featured);
  if (input.ogImageUrl !== undefined) patch.og_image_url = input.ogImageUrl;

  const { data, error } = await supa
    .from("blog_posts")
    .update(patch)
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) return { ok: false, detail: error.message };
  return { ok: true, post: rowToDashboard(data as BlogPostRow) };
}

export async function deletePost(id: string): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;
  const { error } = await supa.from("blog_posts").delete().eq("id", id);
  if (error) {
    console.warn("[blog-store] delete:", error.message);
    return false;
  }
  return true;
}

/** Publish now: published_at = now() (the actual moment posted to DB). */
export async function publishPost(
  id: string
): Promise<{ ok: true; post: BlogDashboardPost } | { ok: false; detail: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, detail: "Supabase not configured" };

  const now = new Date().toISOString();
  const { data, error } = await supa
    .from("blog_posts")
    .update({ status: "published", published_at: now, scheduled_at: null, updated_at: now })
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) return { ok: false, detail: error.message };
  return { ok: true, post: rowToDashboard(data as BlogPostRow) };
}

/** Move a published/scheduled post back to draft (unpublish). Clears the date. */
export async function unpublishPost(
  id: string
): Promise<{ ok: true; post: BlogDashboardPost } | { ok: false; detail: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, detail: "Supabase not configured" };

  const { data, error } = await supa
    .from("blog_posts")
    .update({
      status: "draft",
      published_at: null,
      scheduled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) return { ok: false, detail: error.message };
  return { ok: true, post: rowToDashboard(data as BlogPostRow) };
}

export async function archivePost(
  id: string
): Promise<{ ok: true; post: BlogDashboardPost } | { ok: false; detail: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, detail: "Supabase not configured" };

  const { data, error } = await supa
    .from("blog_posts")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) return { ok: false, detail: error.message };
  return { ok: true, post: rowToDashboard(data as BlogPostRow) };
}

export async function schedulePost(
  id: string,
  scheduledAtIso: string
): Promise<{ ok: true; post: BlogDashboardPost } | { ok: false; detail: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, detail: "Supabase not configured" };

  const when = new Date(scheduledAtIso);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, detail: "Invalid scheduled date" };
  }

  const { data, error } = await supa
    .from("blog_posts")
    .update({
      status: "scheduled",
      scheduled_at: when.toISOString(),
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) return { ok: false, detail: error.message };
  return { ok: true, post: rowToDashboard(data as BlogPostRow) };
}

/** Cron: publish scheduled posts whose time has arrived. published_at = now(). */
export async function publishDueScheduledPosts(): Promise<{
  published: BlogDashboardPost[];
  error: string | null;
}> {
  const supa = supabaseAdmin();
  if (!supa) return { published: [], error: "Supabase not configured" };

  const nowIso = new Date().toISOString();
  const { data, error } = await supa
    .from("blog_posts")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso);

  if (error) return { published: [], error: error.message };

  const ids = (data as { id: string }[]).map((r) => r.id);
  const published: BlogDashboardPost[] = [];
  for (const id of ids) {
    const res = await publishPost(id);
    if (res.ok) published.push(res.post);
  }

  return { published, error: null };
}

/** Best-effort view counter (fire-and-forget from the post render). */
export async function incrementViewCount(slug: string): Promise<void> {
  const supa = supabaseAdmin();
  if (!supa) return;
  try {
    const { data } = await supa
      .from("blog_posts")
      .select("view_count")
      .eq("slug", slug)
      .maybeSingle();
    const current = (data as { view_count?: number } | null)?.view_count ?? 0;
    await supa
      .from("blog_posts")
      .update({ view_count: current + 1 })
      .eq("slug", slug);
  } catch {
    /* non-critical */
  }
}
