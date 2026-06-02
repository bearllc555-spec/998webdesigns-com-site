import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { enforceAdminRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { captureBalanceForLead } from "@/lib/capture-balance";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const rate = await enforceAdminRateLimit(req, "/api/admin/capture-balance");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const secret = process.env.BALANCE_CAPTURE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "BALANCE_CAPTURE_SECRET is not configured on the server" },
      { status: 503 }
    );
  }

  if (!verifyBearerSecret(req.headers.get("authorization"), secret)) {
    return unauthorized();
  }

  let body: { email?: string; depositSessionId?: string; leadId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email && !body.depositSessionId && !body.leadId) {
    return NextResponse.json(
      { error: "Provide email, depositSessionId, or leadId" },
      { status: 400 }
    );
  }

  const result = await captureBalanceForLead(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    leadId: result.leadId,
    paymentIntentId: result.paymentIntentId,
    alreadyCaptured: result.alreadyCaptured ?? false,
  });
}
