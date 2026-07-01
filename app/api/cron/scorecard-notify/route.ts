import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { backfillScorecardReadyTelegram } from "@/lib/scorecard/crm-ready-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cronSecret(): string | null {
  return (
    process.env.CRON_SECRET?.trim() ||
    process.env.BALANCE_CAPTURE_SECRET?.trim() ||
    null
  );
}

/** Backfill scorecard_ready Telegram for reports emailed but not yet notified. */
export async function GET(req: NextRequest) {
  const secret = cronSecret();
  if (!secret) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 503 });
  }

  if (!verifyBearerSecret(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sent = await backfillScorecardReadyTelegram();
  return NextResponse.json({ ok: true, sent });
}
