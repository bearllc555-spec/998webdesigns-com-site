import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { crmAdminSecret } from "@/lib/crm-admin-secret";
import { CRM_SESSION_COOKIE } from "@/lib/crm-session-constants";

export { CRM_SESSION_COOKIE } from "@/lib/crm-session-constants";
const SESSION_MARKER = "crm-v1";

export function crmSessionToken(secret: string): string {
  return createHmac("sha256", secret).update(SESSION_MARKER).digest("hex");
}

export function verifyCrmSessionValue(
  cookieValue: string | undefined,
  secret: string
): boolean {
  if (!cookieValue) return false;
  const expected = crmSessionToken(secret);
  const a = Buffer.from(cookieValue, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isCrmAuthenticated(): Promise<boolean> {
  const secret = crmAdminSecret();
  if (!secret) return false;
  const jar = await cookies();
  return verifyCrmSessionValue(jar.get(CRM_SESSION_COOKIE)?.value, secret);
}

export function isCrmRequestAuthorized(req: NextRequest): boolean {
  const secret = crmAdminSecret();
  if (!secret) return false;
  if (verifyBearerSecret(req.headers.get("authorization"), secret)) return true;
  const cookie = req.cookies.get(CRM_SESSION_COOKIE)?.value;
  return verifyCrmSessionValue(cookie, secret);
}

export function crmSessionCookieOptions(maxAgeSec = 60 * 60 * 24 * 14) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
