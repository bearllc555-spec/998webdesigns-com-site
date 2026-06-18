import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import { createDraftPost } from "@/lib/blog-store";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST multipart/form-data { file } - import a markdown/text file as a new DRAFT.
 * Frontmatter (title, description, tags, author) is honored when present;
 * the publish date is intentionally ignored (set automatically on publish).
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
  if (!/\.(md|markdown|mdx|txt)$/.test(name)) {
    return NextResponse.json(
      { error: "Upload a .md, .markdown, .mdx or .txt file (convert .docx to markdown first)" },
      { status: 400 }
    );
  }
  if (file.size > 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 1MB" }, { status: 400 });
  }

  const raw = await file.text();
  const { data, content } = matter(raw);

  const fallbackTitle = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  const title = String(data.title ?? fallbackTitle ?? "Untitled draft");

  const result = await createDraftPost({
    title,
    description: data.description ? String(data.description) : "",
    body: content.trim(),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    author: data.author ? String(data.author) : undefined,
    featured: Boolean(data.featured),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: 500 });
  }
  return NextResponse.json({ post: result.post });
}
