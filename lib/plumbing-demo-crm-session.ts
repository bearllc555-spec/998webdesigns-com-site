import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { PLUMBING_DEMO_CRM_PASSWORD } from "@/lib/plumbing-demo-crm-copy";

export { PLUMBING_DEMO_CRM_PASSWORD } from "@/lib/plumbing-demo-crm-copy";

export const PLUMBING_DEMO_CRM_SESSION_COOKIE = "plumbing_demo_crm_session";

const SESSION_MARKER = "plumbing-demo-crm-v1";

function sessionSecret(): string {
  return (
    process.env.PLUMBING_DEMO_CRM_SESSION_SECRET?.trim() ||
    process.env.BALANCE_CAPTURE_SECRET?.trim() ||
    "998-plumbing-demo-crm-session-v1"
  );
}

export function plumbingDemoCrmSessionToken(): string {
  return createHmac("sha256", sessionSecret()).update(SESSION_MARKER).digest("hex");
}

export function verifyPlumbingDemoCrmSessionValue(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = plumbingDemoCrmSessionToken();
  const a = Buffer.from(cookieValue, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isValidPlumbingDemoCrmLogin(email: string, password: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return false;
  }
  return password === PLUMBING_DEMO_CRM_PASSWORD;
}

export async function isPlumbingDemoCrmAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifyPlumbingDemoCrmSessionValue(jar.get(PLUMBING_DEMO_CRM_SESSION_COOKIE)?.value);
}

export function isPlumbingDemoCrmRequestAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(PLUMBING_DEMO_CRM_SESSION_COOKIE)?.value;
  return verifyPlumbingDemoCrmSessionValue(cookie);
}

export function plumbingDemoCrmSessionCookieOptions(maxAgeSec = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
