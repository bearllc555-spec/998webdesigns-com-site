import { createHmac, timingSafeEqual } from "crypto";

export type SiteforgeTokenPurpose = "approve" | "changes";

export type SiteforgeTokenPayload = {
  jobId: string;
  purpose: SiteforgeTokenPurpose;
  exp: number;
};

const APPROVE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const CHANGES_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function signingSecret(): string | null {
  return (
    process.env.SITEFORGE_APPROVAL_SECRET?.trim() ||
    process.env.BALANCE_CAPTURE_SECRET?.trim() ||
    null
  );
}

function signPayload(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

function createToken(
  jobId: string,
  purpose: SiteforgeTokenPurpose,
  ttlMs: number,
  now = Date.now()
): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  const payload: SiteforgeTokenPayload = {
    jobId,
    purpose,
    exp: now + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signPayload(encoded, secret)}`;
}

export function createSiteforgeApproveToken(jobId: string, now = Date.now()): string | null {
  return createToken(jobId, "approve", APPROVE_TTL_MS, now);
}

export function createSiteforgeChangesToken(jobId: string, now = Date.now()): string | null {
  return createToken(jobId, "changes", CHANGES_TTL_MS, now);
}

export function verifySiteforgeToken(
  token: string,
  expectedPurpose: SiteforgeTokenPurpose,
  now = Date.now()
): SiteforgeTokenPayload | null {
  const secret = signingSecret();
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

  let payload: SiteforgeTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof payload.jobId !== "string" ||
    payload.purpose !== expectedPurpose ||
    typeof payload.exp !== "number" ||
    payload.exp < now
  ) {
    return null;
  }

  return payload;
}
