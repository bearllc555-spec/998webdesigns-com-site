import { createHmac, timingSafeEqual } from "crypto";

export type DiscoveryTokenPurpose = "intake" | "close" | "schedule";

export type DiscoveryTokenPayload = {
  prospectId: string;
  purpose: DiscoveryTokenPurpose;
  exp: number;
};

const INTAKE_TTL_MS = 48 * 60 * 60 * 1000;
const SCHEDULE_TTL_MS = INTAKE_TTL_MS;
const CLOSE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function discoverySigningSecret(): string | null {
  return process.env.BALANCE_CAPTURE_SECRET?.trim() || null;
}

function signPayload(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

function createToken(
  prospectId: string,
  purpose: DiscoveryTokenPurpose,
  ttlMs: number,
  now = Date.now()
): string | null {
  const secret = discoverySigningSecret();
  if (!secret) return null;

  const payload: DiscoveryTokenPayload = {
    prospectId,
    purpose,
    exp: now + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = signPayload(encoded, secret);
  return `${encoded}.${sig}`;
}

export function createDiscoveryIntakeToken(prospectId: string, now = Date.now()): string | null {
  return createToken(prospectId, "intake", INTAKE_TTL_MS, now);
}

export function createDiscoveryScheduleToken(prospectId: string, now = Date.now()): string | null {
  return createToken(prospectId, "schedule", SCHEDULE_TTL_MS, now);
}

/** Schedule links: accept new schedule tokens or legacy intake tokens. */
export function verifyDiscoveryScheduleToken(
  token: string,
  now = Date.now()
): DiscoveryTokenPayload | null {
  return (
    verifyDiscoveryToken(token, "schedule", now) ?? verifyDiscoveryToken(token, "intake", now)
  );
}

export function createDiscoveryCloseToken(prospectId: string, now = Date.now()): string | null {
  return createToken(prospectId, "close", CLOSE_TTL_MS, now);
}

export function verifyDiscoveryToken(
  token: string,
  expectedPurpose: DiscoveryTokenPurpose,
  now = Date.now()
): DiscoveryTokenPayload | null {
  const secret = discoverySigningSecret();
  if (!secret) return null;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = signPayload(encoded, secret);

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  let payload: DiscoveryTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof payload.prospectId !== "string" ||
    payload.purpose !== expectedPurpose ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  if (payload.exp < now) return null;
  return payload;
}
