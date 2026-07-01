import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { isEmail } from "@/lib/scorecard/validate";

export const runtime = "nodejs";

type JobPayload = { email?: string };

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
    .select("id, domain, status, payload, error")
    .eq("id", jobId)
    .maybeSingle();

  if (error || !job) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const payloadEmail = String((job.payload as JobPayload)?.email ?? "")
    .trim()
    .toLowerCase();
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
    const { data: report } = await supa
      .from("scorecard_reports")
      .select("token, score")
      .eq("domain", job.domain)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (report?.token) {
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
