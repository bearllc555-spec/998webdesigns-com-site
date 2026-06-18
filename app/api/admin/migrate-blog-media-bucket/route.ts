import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { enforceAdminRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { BLOG_MEDIA_BUCKET } from "@/lib/blog-media";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST - create the public blog-media storage bucket (idempotent). Bearer: BALANCE_CAPTURE_SECRET. */
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

  const { error } = await supa.storage.createBucket(BLOG_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"],
  });

  if (error && !/already exists/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, bucket: BLOG_MEDIA_BUCKET, created: !error });
}
