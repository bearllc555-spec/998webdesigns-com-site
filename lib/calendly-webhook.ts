import { createHmac, timingSafeEqual } from "crypto";

export type CalendlyWebhookEnvelope = {
  event?: string;
  payload?: Record<string, unknown>;
};

function calendlySigningKey(): string | null {
  return process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim() || null;
}

/** Verify Calendly-Webhook-Signature header (t=timestamp,v1=hex). */
export function verifyCalendlyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const key = calendlySigningKey();
  if (!key) {
    console.warn("[calendly-webhook] CALENDLY_WEBHOOK_SIGNING_KEY not set");
    return false;
  }
  if (!signatureHeader?.trim()) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const eq = part.indexOf("=");
      if (eq <= 0) return [part, ""] as const;
      return [part.slice(0, eq).trim(), part.slice(eq + 1).trim()] as const;
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", key).update(signedPayload).digest("hex");

  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseCalendlyWebhookBody(rawBody: string): CalendlyWebhookEnvelope | null {
  try {
    return JSON.parse(rawBody) as CalendlyWebhookEnvelope;
  } catch {
    return null;
  }
}

export type CalendlyInviteePayload = {
  email: string;
  uri: string | null;
  eventStartAt: string | null;
  prospectId: string | null;
};

export function extractCalendlyInviteePayload(
  payload: Record<string, unknown> | undefined
): CalendlyInviteePayload | null {
  if (!payload) return null;

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email) return null;

  const uri = typeof payload.uri === "string" ? payload.uri : null;

  let eventStartAt: string | null = null;
  const scheduledEvent = payload.scheduled_event;
  if (scheduledEvent && typeof scheduledEvent === "object") {
    const start = (scheduledEvent as Record<string, unknown>).start_time;
    if (typeof start === "string") eventStartAt = start;
  }

  const tracking =
    payload.tracking && typeof payload.tracking === "object"
      ? (payload.tracking as Record<string, unknown>)
      : null;

  let prospectId: string | null = null;
  if (tracking && typeof tracking.utm_campaign === "string") {
    const trimmed = tracking.utm_campaign.trim();
    prospectId = trimmed.length > 0 ? trimmed : null;
  }

  return { email, uri, eventStartAt, prospectId };
}
