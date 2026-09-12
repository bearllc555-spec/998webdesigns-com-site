import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/read-json-body";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { verifySiteforgeToken } from "@/lib/siteforge-token";
import { siteforgeApplyDecision, siteforgeGetJob } from "@/lib/siteforge-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/siteforge/changes");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json(
      { error: body.error },
      { status: body.status, headers: body.headers }
    );
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const token = typeof parsed.body.token === "string" ? parsed.body.token.trim() : "";
  const feedback =
    typeof parsed.body.feedback === "string" ? parsed.body.feedback.trim() : "";

  const payload = verifySiteforgeToken(token, "changes");
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  if (feedback.length < 8) {
    return NextResponse.json(
      { error: "Please describe the changes (at least a short note)." },
      { status: 400 }
    );
  }
  if (feedback.length > 4000) {
    return NextResponse.json({ error: "Feedback is too long." }, { status: 400 });
  }

  try {
    const bundle = await siteforgeGetJob(payload.jobId);
    if (
      !["concept_ready", "mockup_ready", "changes_requested", "approved"].includes(
        bundle.job.status
      )
    ) {
      return NextResponse.json(
        { error: `This concept can’t accept changes (status: ${bundle.job.status})` },
        { status: 409 }
      );
    }

    const result = await siteforgeApplyDecision(payload.jobId, "changes", feedback);
    return NextResponse.json({
      ok: true,
      status: result.status,
      businessName: bundle.lead.business_name,
    });
  } catch (err) {
    console.error("[siteforge/changes]", err);
    return NextResponse.json({ error: "Could not save your request" }, { status: 500 });
  }
}
