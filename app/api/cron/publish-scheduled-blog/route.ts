import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { publishDueScheduledPosts } from "@/lib/blog-store";
import { notifyBlogPublished } from "@/lib/blog-publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cronSecret(): string | null {
  return (
    process.env.CRON_SECRET?.trim() ||
    process.env.BALANCE_CAPTURE_SECRET?.trim() ||
    null
  );
}

/** Hourly: publish scheduled blog posts whose time has arrived (published_at = now). */
export async function GET(req: NextRequest) {
  const secret = cronSecret();
  if (!secret) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 503 });
  }
  if (!verifyBearerSecret(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { published, error } = await publishDueScheduledPosts();

  for (const post of published) {
    try {
      await notifyBlogPublished(post);
    } catch {
      /* non-critical */
    }
  }

  return NextResponse.json({
    ok: error === null,
    publishedCount: published.length,
    published: published.map((p) => p.slug),
    error,
  });
}
