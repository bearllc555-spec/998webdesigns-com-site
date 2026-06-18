import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import JSZip from "jszip";
import { createDraftPost } from "@/lib/blog-store";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MARKDOWN_RE = /\.(md|markdown|mdx|txt)$/i;
const SINGLE_FILE_LIMIT = 1024 * 1024; // 1MB
const ZIP_LIMIT = 20 * 1024 * 1024; // 20MB
const ENTRY_LIMIT = 1024 * 1024; // 1MB per extracted markdown file

type ImportedPost = { id: string; title: string; slug: string };
type FailedImport = { name: string; detail: string };

/**
 * Create a draft post from raw markdown text. The publish date is intentionally
 * ignored (set automatically on publish); frontmatter title/description/tags/
 * author/featured are honored when present.
 */
async function importMarkdown(
  fileName: string,
  raw: string
): Promise<{ ok: true; post: ImportedPost } | { ok: false; detail: string }> {
  const { data, content } = matter(raw);
  const fallbackTitle = fileName
    .replace(/.*\//, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const title = String(data.title ?? fallbackTitle ?? "Untitled draft");

  const result = await createDraftPost({
    title,
    description: data.description ? String(data.description) : "",
    body: content.trim(),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    author: data.author ? String(data.author) : undefined,
    featured: Boolean(data.featured),
  });

  if (!result.ok) return { ok: false, detail: result.detail };
  return {
    ok: true,
    post: { id: result.post.id, title: result.post.title, slug: result.post.slug },
  };
}

/**
 * POST multipart/form-data { file }
 * - A single .md/.markdown/.mdx/.txt file -> one new DRAFT (returns { post }).
 * - A .zip archive -> a new DRAFT for each markdown file inside
 *   (returns { imported, failed, count }).
 */
export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }
  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const isZip = name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed";

  if (isZip) {
    if (file.size > ZIP_LIMIT) {
      return NextResponse.json({ error: "Zip exceeds 20MB" }, { status: 400 });
    }

    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(await file.arrayBuffer());
    } catch {
      return NextResponse.json({ error: "Could not read zip archive" }, { status: 400 });
    }

    const entries = Object.values(zip.files).filter((entry) => {
      if (entry.dir) return false;
      const entryName = entry.name;
      if (entryName.startsWith("__MACOSX/")) return false;
      const base = entryName.replace(/.*\//, "");
      if (base.startsWith(".")) return false;
      return MARKDOWN_RE.test(base);
    });

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No .md, .markdown, .mdx or .txt files found in the zip" },
        { status: 400 }
      );
    }

    // Stable order so imports read predictably in the dashboard.
    entries.sort((a, b) => a.name.localeCompare(b.name));

    const imported: ImportedPost[] = [];
    const failed: FailedImport[] = [];

    for (const entry of entries) {
      try {
        const raw = await entry.async("string");
        if (raw.length > ENTRY_LIMIT) {
          failed.push({ name: entry.name, detail: "File exceeds 1MB" });
          continue;
        }
        const res = await importMarkdown(entry.name, raw);
        if (res.ok) imported.push(res.post);
        else failed.push({ name: entry.name, detail: res.detail });
      } catch (err) {
        failed.push({ name: entry.name, detail: err instanceof Error ? err.message : "Import failed" });
      }
    }

    return NextResponse.json({ imported, failed, count: imported.length });
  }

  // Single markdown/text file
  if (!MARKDOWN_RE.test(name)) {
    return NextResponse.json(
      { error: "Upload a .md, .markdown, .mdx, .txt or .zip file (convert .docx to markdown first)" },
      { status: 400 }
    );
  }
  if (file.size > SINGLE_FILE_LIMIT) {
    return NextResponse.json({ error: "File exceeds 1MB" }, { status: 400 });
  }

  const res = await importMarkdown(file.name, await file.text());
  if (!res.ok) {
    return NextResponse.json({ error: res.detail }, { status: 500 });
  }
  return NextResponse.json({ post: res.post });
}
