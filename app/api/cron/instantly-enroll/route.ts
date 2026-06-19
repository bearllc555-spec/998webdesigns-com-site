import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { enrollPendingLinkedinProspects } from "@/lib/linkedin-prospect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cronSecret(): string | null {
  return (
    process.env.CRON_SECRET?.trim() ||
    process.env.BALANCE_CAPTURE_SECRET?.trim() ||
    null
  );
}

/** Retry Instantly enrollment for email_captured prospects. Bearer: CRON_SECRET or BALANCE_CAPTURE_SECRET. */
export async function GET(req: NextRequest) {
  const secret = cronSecret();
  if (!secret) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 503 });
  }

  if (!verifyBearerSecret(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await enrollPendingLinkedinProspects(50);
  return NextResponse.json({ ok: true, ...result });
}
