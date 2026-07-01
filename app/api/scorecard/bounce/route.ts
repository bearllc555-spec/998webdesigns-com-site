import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResendWebhookEvent = {
  type?: string;
  data?: {
    tags?: Record<string, string>;
    to?: string[];
    email_id?: string;
  };
};

/**
 * Resend bounce webhook — flips scorecard_reports.email_status to bounced.
 * Configure in Resend dashboard pointing at /api/scorecard/bounce.
 * Tag outbound scorecard emails with report_id (see scorecard/generator/service.py).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (secret) {
    const provided = req.headers.get("x-resend-signature") ?? req.headers.get("authorization");
    if (provided !== secret && provided !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let event: ResendWebhookEvent;
  try {
    event = (await req.json()) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const type = String(event.type ?? "").toLowerCase();
  if (!type.includes("bounce") && !type.includes("complaint")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const reportId = event.data?.tags?.report_id;
  if (!reportId) {
    console.info("[scorecard/bounce] no report_id tag", type);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supa = supabaseAdmin();
  if (!supa) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { error } = await supa.rpc("set_scorecard_email_status", {
    p_report_id: reportId,
    p_status: "bounced",
  });

  if (error) {
    console.error("[scorecard/bounce] update failed:", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  console.info("[scorecard/bounce] marked bounced", reportId);
  return NextResponse.json({ ok: true });
}
