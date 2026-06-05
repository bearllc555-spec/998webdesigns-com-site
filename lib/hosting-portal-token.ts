import { createHmac, timingSafeEqual } from "crypto";
import { hostingPortalSecret } from "@/lib/hosting-portal-secret";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export type HostingPortalTokenPayload = {
  email: string;
  customerId: string;
  exp: number;
};

function signPayload(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

export function createHostingPortalToken(
  email: string,
  customerId: string,
  now = Date.now()
): string | null {
  const secret = hostingPortalSecret();
  if (!secret) return null;

  const payload: HostingPortalTokenPayload = {
    email: email.trim().toLowerCase(),
    customerId,
    exp: now + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = signPayload(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifyHostingPortalToken(
  token: string,
  now = Date.now()
): HostingPortalTokenPayload | null {
  const secret = hostingPortalSecret();
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

  let payload: HostingPortalTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof payload.email !== "string" ||
    typeof payload.customerId !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  if (payload.exp < now) return null;
  if (!payload.customerId.startsWith("cus_")) return null;

  return payload;
}
