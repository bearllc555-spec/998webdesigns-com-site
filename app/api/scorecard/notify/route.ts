import { NextRequest, NextResponse } from "next/server";
import { notifyScorecardReadyOnce } from "@/lib/scorecard/crm-ready-notify";
import { verifyScorecardGeneratorKey } from "@/lib/scorecard/generator-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ScorecardNotifyBody = {
  event?: string;
  fullName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  domain?: string;
  score?: number;
  verdict?: string;
  token?: string;
  deduped?: boolean;
};

/** POST — scorecard worker → CRM Telegram when a report is ready. Auth: x-generator-key. */
export async function POST(req: NextRequest) {
  if (!verifyScorecardGeneratorKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ScorecardNotifyBody;
  try {
    body = (await req.json()) as ScorecardNotifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event !== "ready") {
    return NextResponse.json({ error: "Unsupported event" }, { status: 400 });
  }

  const token = String(body.token ?? "").trim();
  const domain = String(body.domain ?? "").trim();
  if (!token || !domain) {
    return NextResponse.json({ error: "token and domain required" }, { status: 422 });
  }

  const score =
    typeof body.score === "number" && Number.isFinite(body.score) ? body.score : undefined;
  if (score == null) {
    return NextResponse.json({ error: "score required" }, { status: 422 });
  }

  const supa = supabaseAdmin();
  if (!supa) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: report } = await supa
    .from("scorecard_reports")
    .select("id")
    .eq("token", token)
    .eq("status", "active")
    .maybeSingle();

  if (!report?.id) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const sent = await notifyScorecardReadyOnce({
    reportId: report.id,
    token,
    domain,
    score,
    verdict: body.verdict?.trim() || undefined,
    fullName: body.fullName?.trim() || undefined,
    businessName: body.businessName?.trim() || undefined,
    email: body.email?.trim() || undefined,
    phone: body.phone?.trim() || undefined,
    deduped: Boolean(body.deduped),
  });

  return NextResponse.json({ ok: true, sent });
}
