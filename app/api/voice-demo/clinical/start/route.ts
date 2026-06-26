import { NextRequest, NextResponse } from "next/server";
import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { enforceApiRateLimit, rateLimitResponse, clientIp } from "@/lib/api-rate-limit";
import { readJsonBody } from "@/lib/read-json-body";
import { isValidEmail } from "@/lib/validate-email";
import {
  getVoiceDemoDailyQuotaStatus,
  VOICE_DEMO_DAILY_LIMIT_MESSAGE,
} from "@/lib/voice-demo-daily-quota";
import { startAestheticsDemoLead } from "@/lib/voice-demo-aesthetics/start";
import { setVoiceDemoSessionCookie } from "@/lib/voice-demo-session";
import type { VoiceDemoVertical } from "@/lib/voice-demo-vertical";

export const runtime = "nodejs";

function createAestheticsStartRoute(brand: AestheticsDemoBrand, vertical: VoiceDemoVertical) {
  return async function POST(req: NextRequest) {
    const rate = await enforceApiRateLimit(req, `/api/voice-demo/${brand}/start`);
    if (!rate.allowed) {
      const body = rateLimitResponse(rate.retryAfterSec);
      return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
    }

    const parsed = await readJsonBody(req);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const body = parsed.body as { email?: string; website?: string };
    if (body.website && typeof body.website === "string" && body.website.length > 0) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const ip = clientIp(req);
    const quota = await getVoiceDemoDailyQuotaStatus(email, { ip });
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: VOICE_DEMO_DAILY_LIMIT_MESSAGE,
          dailyQuota: {
            used: quota.used,
            limit: quota.limit,
            remaining: quota.remaining,
          },
        },
        {
          status: 429,
          headers: quota.retryAfterSec
            ? { "Retry-After": String(quota.retryAfterSec) }
            : undefined,
        }
      );
    }

    const started = await startAestheticsDemoLead(brand, email, ip);
    if (!started.ok) {
      return NextResponse.json({ error: started.error }, { status: 503 });
    }

    const res = NextResponse.json({
      ok: true,
      leadId: started.leadId,
      verified: true,
      vertical,
    });
    setVoiceDemoSessionCookie(res, started.leadId, true, vertical);
    return res;
  };
}

export const POST = createAestheticsStartRoute("clinical", "clinical");
