import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { BlogPost, BlogPostMeta } from "@/lib/blog-types";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function parseFile(filename: string): BlogPost {
  const slug = filename.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8");
  const { data, content } = matter(raw);

  const publishedAt = String(data.publishedAt ?? "");
  const title = String(data.title ?? slug);
  const description = String(data.description ?? "");

  return {
    slug,
    title,
    description,
    publishedAt,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    author: data.author ? String(data.author) : "998 web designs",
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    featured: Boolean(data.featured),
    content: content.trim(),
    readingMinutes: readingMinutes(content),
  };
}

function listMarkdownFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort();
}

export function getAllPosts(): BlogPost[] {
  return listMarkdownFiles()
    .map(parseFile)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const filename = `${slug}.md`;
  if (!listMarkdownFiles().includes(filename)) return undefined;
  return parseFile(filename);
}

export function getAllSlugs(): string[] {
  return listMarkdownFiles().map((name) => name.replace(/\.md$/, ""));
}

export function toPostMeta(post: BlogPost): BlogPostMeta {
  const { content: _content, readingMinutes: _reading, ...meta } = post;
  return meta;
}

export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}
