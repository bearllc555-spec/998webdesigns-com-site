import { NextRequest, NextResponse } from "next/server";
import { notifyCrmActivity } from "@/lib/crm-notify";
import {
  findDiscoveryProspectByPhone,
  markDiscoveryProspectUnread,
} from "@/lib/discovery-db";
import { insertInboundSms } from "@/lib/inbound-sms-db";
import { marketingSiteOrigin } from "@/lib/site-origin";
import { validateTwilioWebhookSignature } from "@/lib/twilio-webhook";
import { normalizePhoneE164, twilioCredentials } from "@/lib/twilio-verify";

export const runtime = "nodejs";

function formParams(req: NextRequest, body: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(body)) {
    params[key] = value;
  }
  const messageSid = req.nextUrl.searchParams.get("MessageSid");
  if (messageSid && !params.MessageSid) params.MessageSid = messageSid;
  return params;
}

function emptyTwiml(): NextResponse {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

/** Twilio inbound SMS webhook — stores in CRM inbox and alerts Telegram. */
export async function POST(req: NextRequest) {
  const creds = twilioCredentials();
  if (!creds) {
    console.warn("[twilio-inbound] Twilio not configured");
    return new NextResponse("Not configured", { status: 503 });
  }

  const rawBody = await req.text();
  const params = formParams(req, rawBody);
  const signature = req.headers.get("x-twilio-signature");
  const webhookUrl = `${marketingSiteOrigin()}/api/twilio/inbound-sms`;

  if (
    process.env.VERCEL_ENV === "production" &&
    !validateTwilioWebhookSignature(creds.authToken, signature, webhookUrl, params)
  ) {
    console.warn("[twilio-inbound] invalid signature");
    return new NextResponse("Forbidden", { status: 403 });
  }

  const fromRaw = params.From?.trim() ?? "";
  const body = params.Body?.trim() ?? "";
  const messageSid = params.MessageSid?.trim() ?? "";

  if (!fromRaw || !body || !messageSid) {
    return emptyTwiml();
  }

  const fromPhone = normalizePhoneE164(fromRaw) ?? fromRaw;
  const prospect = await findDiscoveryProspectByPhone(fromPhone);

  const inserted = await insertInboundSms({
    from_phone: fromPhone,
    body,
    twilio_message_sid: messageSid,
    discovery_prospect_id: prospect?.id ?? null,
  });

  if (!inserted.ok) {
    if (inserted.reason === "duplicate") {
      return emptyTwiml();
    }
    console.warn("[twilio-inbound] insert failed:", inserted.detail);
    return new NextResponse("Error", { status: 500 });
  }

  if (prospect) {
    await markDiscoveryProspectUnread(prospect.id);
  }

  const intake = prospect?.intake as { businessName?: string } | null;

  void notifyCrmActivity({
    kind: "inbound_sms",
    fullName: prospect?.full_name,
    businessName: intake?.businessName,
    email: prospect?.email,
    message: body,
    phone: fromPhone,
  });

  return emptyTwiml();
}
