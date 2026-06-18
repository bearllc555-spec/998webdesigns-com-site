import { NextRequest, NextResponse } from "next/server";
import { createDraftPost, listDashboardPosts } from "@/lib/blog-store";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }
  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await listDashboardPosts();
  if (!result.ok) {
    return NextResponse.json({ posts: [], error: result.detail }, { status: 200 });
  }
  return NextResponse.json({ posts: result.posts, error: null });
}

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }
  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    slug?: string;
    description?: string;
    body?: string;
    tags?: string[];
    author?: string;
    featured?: boolean;
    ogImageUrl?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const result = await createDraftPost({
    title: body.title,
    slug: body.slug,
    description: body.description,
    body: body.body,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    author: body.author,
    featured: body.featured,
    ogImageUrl: body.ogImageUrl ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: 500 });
  }
  return NextResponse.json({ post: result.post });
}
