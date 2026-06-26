import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";

export function aestheticsCrmSessionCookie(brand: AestheticsDemoBrand): string {
  return `${brand}_demo_crm_session`;
}

function sessionMarker(brand: AestheticsDemoBrand): string {
  return `${brand}-demo-crm-v1`;
}

function sessionSecret(): string {
  return (
    process.env.AESTHETICS_DEMO_CRM_SESSION_SECRET?.trim() ||
    process.env.BALANCE_CAPTURE_SECRET?.trim() ||
    "998-aesthetics-demo-crm-session-v1"
  );
}

export function aestheticsDemoCrmSessionToken(brand: AestheticsDemoBrand): string {
  return createHmac("sha256", sessionSecret()).update(sessionMarker(brand)).digest("hex");
}

export function verifyAestheticsDemoCrmSessionValue(
  brand: AestheticsDemoBrand,
  cookieValue: string | undefined
): boolean {
  if (!cookieValue) return false;
  const expected = aestheticsDemoCrmSessionToken(brand);
  const a = Buffer.from(cookieValue, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isValidAestheticsDemoCrmLogin(
  brand: AestheticsDemoBrand,
  email: string,
  password: string
): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return false;
  }
  return password === getDemoBrandConfigByVertical(brand).crmPassword;
}

export async function isAestheticsDemoCrmAuthenticated(
  brand: AestheticsDemoBrand
): Promise<boolean> {
  const jar = await cookies();
  return verifyAestheticsDemoCrmSessionValue(
    brand,
    jar.get(aestheticsCrmSessionCookie(brand))?.value
  );
}

export function isAestheticsDemoCrmRequestAuthorized(
  brand: AestheticsDemoBrand,
  req: NextRequest
): boolean {
  const cookie = req.cookies.get(aestheticsCrmSessionCookie(brand))?.value;
  return verifyAestheticsDemoCrmSessionValue(brand, cookie);
}

export function aestheticsDemoCrmSessionCookieOptions(maxAgeSec = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
