import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { cronCheckoutOrigin, processDueTenYearHostingBillings } from "@/lib/ten-year-hosting-billing";

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

/** Daily: email 10-year hosting Checkout to leads whose 30-day free period ended. */
export async function GET(req: NextRequest) {
  const secret = cronSecret();
  if (!secret) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 503 });
  }

  if (!verifyBearerSecret(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = cronCheckoutOrigin();
  const result = await processDueTenYearHostingBillings(origin);

  return NextResponse.json({ ok: true, origin, ...result });
}
