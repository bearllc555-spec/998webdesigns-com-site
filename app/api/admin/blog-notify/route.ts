import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { publishBlogPostToCrm } from "@/lib/blog-publish";
import { enforceAdminRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST - record blog post in CRM + Telegram. Bearer: BALANCE_CAPTURE_SECRET. Body: { slug, forceNotify? } */
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

  let body: { slug?: string; forceNotify?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const result = await publishBlogPostToCrm(slug, {
    forceNotify: Boolean(body.forceNotify),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: 500 });
  }

  return NextResponse.json(result);
}
