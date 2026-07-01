import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { notifyScorecardReadyOnce } from "@/lib/scorecard/crm-ready-notify";
import { supabaseAdmin } from "@/lib/supabase";
import { isEmail } from "@/lib/scorecard/validate";

export const runtime = "nodejs";

type JobPayload = {
  email?: string;
  name?: string;
  company?: string;
  phone?: string;
  business_name?: string;
};

export async function GET(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/scorecard/status");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const jobId = req.nextUrl.searchParams.get("jobId")?.trim();
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!jobId || !email || !isEmail(email)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supa = supabaseAdmin();
  if (!supa) {
    return NextResponse.json({ error: "Unavailable." }, { status: 503 });
  }

  const { data: job, error } = await supa
    .from("scorecard_jobs")
    .select("id, domain, status, payload, error, lead_id")
    .eq("id", jobId)
    .maybeSingle();

  if (error || !job) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const payload = (job.payload as JobPayload) ?? {};
  const payloadEmail = String(payload.email ?? "").trim().toLowerCase();
  if (payloadEmail !== email) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (job.status === "failed") {
    return NextResponse.json({
      status: "failed" as const,
      email,
      error: job.error ?? "Report generation failed.",
    });
  }

  if (job.status === "done") {
    let reportQuery = supa
      .from("scorecard_reports")
      .select("id, token, score, verdict, business_name")
      .eq("domain", job.domain)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

    if (job.lead_id) {
      reportQuery = reportQuery.eq("lead_id", job.lead_id as string);
    }

    const { data: report } = await reportQuery.maybeSingle();

    if (report?.token) {
      try {
        await notifyScorecardReadyOnce({
          reportId: report.id as string,
          token: report.token as string,
          domain: job.domain as string,
          score: report.score as number,
          verdict: (report.verdict as string) ?? undefined,
          fullName: payload.name?.trim() || undefined,
          businessName:
            payload.company?.trim() ||
            payload.business_name?.trim() ||
            (report.business_name as string) ||
            undefined,
          email,
          phone: payload.phone?.trim() || undefined,
        });
      } catch (err) {
        console.warn("[scorecard/status] ready notify failed:", err);
      }

      return NextResponse.json({
        status: "ready" as const,
        email,
        reportUrl: `/r/${report.token}`,
        score: report.score,
      });
    }
  }

  return NextResponse.json({
    status: "processing" as const,
    email,
  });
}
