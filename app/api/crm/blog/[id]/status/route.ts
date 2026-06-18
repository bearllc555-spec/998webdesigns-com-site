import { NextRequest, NextResponse } from "next/server";
import {
  archivePost,
  publishPost,
  schedulePost,
  unpublishPost,
} from "@/lib/blog-store";
import { notifyBlogPublished } from "@/lib/blog-publish";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "publish" | "schedule" | "unpublish" | "archive";

/** POST - change a post's lifecycle state. Body: { action, scheduledAt? } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }
  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { action?: Action; scheduledAt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (body.action) {
    case "publish": {
      const result = await publishPost(id);
      if (!result.ok) return NextResponse.json({ error: result.detail }, { status: 500 });
      // Fire CRM/Telegram alert; never block the publish on a notify failure.
      try {
        await notifyBlogPublished(result.post);
      } catch {
        /* non-critical */
      }
      return NextResponse.json({ post: result.post });
    }
    case "schedule": {
      if (!body.scheduledAt) {
        return NextResponse.json({ error: "scheduledAt is required" }, { status: 400 });
      }
      const result = await schedulePost(id, body.scheduledAt);
      if (!result.ok) return NextResponse.json({ error: result.detail }, { status: 500 });
      return NextResponse.json({ post: result.post });
    }
    case "unpublish": {
      const result = await unpublishPost(id);
      if (!result.ok) return NextResponse.json({ error: result.detail }, { status: 500 });
      return NextResponse.json({ post: result.post });
    }
    case "archive": {
      const result = await archivePost(id);
      if (!result.ok) return NextResponse.json({ error: result.detail }, { status: 500 });
      return NextResponse.json({ post: result.post });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
