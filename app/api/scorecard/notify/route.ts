import { NextRequest, NextResponse } from "next/server";
import { notifyCrmActivity } from "@/lib/crm-notify";
import { verifyScorecardGeneratorKey } from "@/lib/scorecard/generator-auth";

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

  const base = "https://998webdesigns.com";
  const score =
    typeof body.score === "number" && Number.isFinite(body.score) ? body.score : undefined;

  await notifyCrmActivity({
    kind: "scorecard_ready",
    fullName: body.fullName?.trim() || undefined,
    businessName: body.businessName?.trim() || undefined,
    email: body.email?.trim() || undefined,
    phone: body.phone?.trim() || undefined,
    domain,
    score,
    verdict: body.verdict?.trim() || undefined,
    deduped: Boolean(body.deduped),
    reportUrl: `${base}/r/${token}`,
    internalReportUrl: `${base}/crm/scorecard/r/${token}`,
  });

  return NextResponse.json({ ok: true });
}
