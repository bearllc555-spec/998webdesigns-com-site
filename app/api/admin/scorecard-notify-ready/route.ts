import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { enforceAdminRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { notifyScorecardReadyOnce } from "@/lib/scorecard/crm-ready-notify";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST - send scorecard_ready Telegram for a report token. Bearer: BALANCE_CAPTURE_SECRET. */
export async function POST(req: NextRequest) {
  const rate = await enforceAdminRateLimit(req, "/api/admin/env-status");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const secret = process.env.BALANCE_CAPTURE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "BALANCE_CAPTURE_SECRET not configured" }, { status: 503 });
  }

  if (!verifyBearerSecret(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: string; force?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "token is required" }, { status: 422 });
  }

  const supa = supabaseAdmin();
  if (!supa) {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const { data: report } = await supa
    .from("scorecard_reports")
    .select(
      "id, token, domain, score, verdict, business_name, lead_id, leads ( full_name, email, phone )"
    )
    .eq("token", token)
    .eq("status", "active")
    .maybeSingle();

  if (!report?.id) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const leadRaw = report.leads as
    | { full_name?: string | null; email?: string | null; phone?: string | null }
    | { full_name?: string | null; email?: string | null; phone?: string | null }[]
    | null;
  const lead = Array.isArray(leadRaw) ? leadRaw[0] : leadRaw;

  const sent = await notifyScorecardReadyOnce({
    reportId: report.id as string,
    token: report.token as string,
    domain: report.domain as string,
    score: report.score as number,
    verdict: (report.verdict as string) ?? undefined,
    fullName: (lead?.full_name as string) ?? undefined,
    businessName: (report.business_name as string) ?? undefined,
    email: (lead?.email as string) ?? undefined,
    phone: (lead?.phone as string) ?? undefined,
    force: Boolean(body.force),
  });

  return NextResponse.json({ ok: true, sent });
}
