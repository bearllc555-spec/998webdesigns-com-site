import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse, clientIp } from "@/lib/api-rate-limit";
import { checkRateLimitSupabase } from "@/lib/rate-limit-supabase";
import { readJsonBody } from "@/lib/read-json-body";
import { supabaseAdmin } from "@/lib/supabase";
import { isInternalProtectedScorecardBypass } from "@/lib/scorecard/internal-access";
import { isProtectedScorecardDomain } from "@/lib/scorecard/protected-domains";
import { isDomain, isEmail, normDomain } from "@/lib/scorecard/validate";
import type { ScorecardFormPayload } from "@/lib/scorecard/types";

export const runtime = "nodejs";

const DOMAIN_RL = { limit: 3, windowMs: 86_400_000 };

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    const status = parsed.error === "Request body too large" ? 413 : 400;
    return NextResponse.json({ error: parsed.error }, { status });
  }

  const body = parsed.body as ScorecardFormPayload;
  const name = String(body.name ?? "").trim();
  const company = String(body.company ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const domain = normDomain(body.domain);
  const internalBypass = isInternalProtectedScorecardBypass(email, domain);

  if (!name || !company) {
    return NextResponse.json({ error: "Name and company are required." }, { status: 422 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 422 });
  }
  if (!isDomain(domain)) {
    return NextResponse.json(
      { error: "Please enter a valid website (e.g. yourbusiness.com)." },
      { status: 422 }
    );
  }
  if (isProtectedScorecardDomain(domain) && !internalBypass) {
    return NextResponse.json(
      {
        error:
          "This tool scores business websites — enter your company's site, not a web design agency.",
      },
      { status: 422 }
    );
  }

  if (!internalBypass) {
    const rate = await enforceApiRateLimit(req, "/api/scorecard");
    if (!rate.allowed) {
      const body = rateLimitResponse(rate.retryAfterSec);
      return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
    }

    const domainRate = await checkRateLimitSupabase(`scorecard-dom:${domain}`, DOMAIN_RL);
    if (!domainRate.allowed) {
      return NextResponse.json(
        {
          error:
            "We've already received a request for this site recently — check that inbox.",
        },
        { status: 429 }
      );
    }
  }

  const supa = supabaseAdmin();
  if (!supa) {
    return NextResponse.json(
      { error: "Couldn't queue your report. Please try again." },
      { status: 503 }
    );
  }

  let leadId: string | null = null;
  try {
    const { data: existing } = await supa
      .from("leads")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existing?.id) {
      const { data: updated, error: updateError } = await supa
        .from("leads")
        .update({
          business_name: company,
          domain,
          phone: phone || null,
          source: "form",
        })
        .eq("id", existing.id)
        .select("id")
        .single();
      if (updateError) throw updateError;
      leadId = updated?.id ?? existing.id;
    } else {
      const { data: inserted, error: insertError } = await supa
        .from("leads")
        .insert({
          business_name: company,
          domain,
          email,
          phone: phone || null,
          source: "form",
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      leadId = inserted?.id ?? null;
    }
  } catch (err) {
    console.warn("[scorecard] lead upsert failed:", err);
  }

  const { error: jobError } = await supa.from("scorecard_jobs").insert({
    lead_id: leadId,
    domain,
    status: "queued",
    payload: { name, company, email, phone, business_name: company },
  });

  if (jobError) {
    console.error("[scorecard] job enqueue failed:", jobError.message);
    return NextResponse.json(
      { error: "Couldn't queue your report. Please try again." },
      { status: 502 }
    );
  }

  console.info("[scorecard] queued", {
    domain,
    email,
    ip: clientIp(req),
    internalBypass,
  });

  return NextResponse.json({
    ok: true,
    message: "Check your inbox — your scorecard is on its way.",
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
