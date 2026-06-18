import "server-only";

import type { BlogPost, BlogPostMeta } from "@/lib/blog-types";
import {
  getAllPublishedPosts,
  getPublishedPostBySlug,
  getPublishedSlugs,
} from "@/lib/blog-store";

/** Live published posts, newest first. Source of truth: Supabase blog_posts. */
export async function getAllPosts(): Promise<BlogPost[]> {
  return getAllPublishedPosts();
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  return getPublishedPostBySlug(slug);
}

export async function getAllSlugs(): Promise<string[]> {
  return getPublishedSlugs();
}

export function toPostMeta(post: BlogPost): BlogPostMeta {
  const { content: _content, readingMinutes: _reading, ...meta } = post;
  return meta;
}

export function formatPostDate(iso: string): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}
