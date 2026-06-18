import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { enforceAdminRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { blogPostUrl } from "@/lib/blog-db";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** Date-only YYYY-MM-DD -> noon Eastern (16:00Z, EDT) so the displayed day is correct. */
function toPublishedAt(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T16:00:00.000Z`).toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

/** POST - import content/blog/*.md into blog_posts (upsert by slug). Bearer: BALANCE_CAPTURE_SECRET. */
export async function POST(req: NextRequest) {
  const rate = await enforceAdminRateLimit(req, "/api/admin/env-status");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const secret = process.env.BALANCE_CAPTURE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "BALANCE_CAPTURE_SECRET is not configured on the server" },
      { status: 503 }
    );
  }
  if (!verifyBearerSecret(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supa = supabaseAdmin();
  if (!supa) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  if (!fs.existsSync(BLOG_DIR)) {
    return NextResponse.json({ ok: true, imported: [], note: "no content/blog dir" });
  }

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((n) => n.endsWith(".md") && n !== "README.md" && n !== "backlog.md");

  const imported: string[] = [];
  const failed: { slug: string; detail: string }[] = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    try {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data, content } = matter(raw);

      const row = {
        slug,
        title: String(data.title ?? slug),
        description: String(data.description ?? ""),
        body: content.trim(),
        url: blogPostUrl(slug),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        author: data.author ? String(data.author) : "998 web designs",
        featured: Boolean(data.featured),
        status: "published",
        published_at: toPublishedAt(String(data.publishedAt ?? "")),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supa
        .from("blog_posts")
        .upsert(row, { onConflict: "slug", ignoreDuplicates: false });

      if (error) {
        failed.push({ slug, detail: error.message });
      } else {
        imported.push(slug);
      }
    } catch (err) {
      failed.push({ slug, detail: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ ok: failed.length === 0, imported, failed });
}
