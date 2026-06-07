import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { VOICE_DEMO_OTP_TTL_MS } from "@/lib/voice-demo-constants";

export const VOICE_DEMO_PENDING_EMAIL_COOKIE = "voice_demo_pending_email";

type PendingEmailPayload = {
  email: string;
  exp: number;
};

function signingSecret(): string | null {
  return process.env.BALANCE_CAPTURE_SECRET?.trim() || null;
}

function signPayload(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

export function createPendingEmailToken(email: string, now = Date.now()): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const payload: PendingEmailPayload = {
    email: email.trim().toLowerCase(),
    exp: now + VOICE_DEMO_OTP_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signPayload(encoded, secret)}`;
}

export function verifyPendingEmailToken(token: string | undefined, now = Date.now()): string | null {
  const secret = signingSecret();
  if (!secret || !token) return null;

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

  let payload: PendingEmailPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload.email !== "string" || typeof payload.exp !== "number") return null;
  if (payload.exp < now) return null;
  return payload.email;
}

export function readPendingEmail(req: NextRequest): string | null {
  const cookie = req.cookies.get(VOICE_DEMO_PENDING_EMAIL_COOKIE)?.value;
  return verifyPendingEmailToken(cookie);
}

export function setPendingEmailCookie(res: NextResponse, email: string): boolean {
  const token = createPendingEmailToken(email);
  if (!token) return false;

  res.cookies.set(VOICE_DEMO_PENDING_EMAIL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VOICE_DEMO_OTP_TTL_MS / 1000,
  });
  return true;
}

export function clearPendingEmailCookie(res: NextResponse): void {
  res.cookies.set(VOICE_DEMO_PENDING_EMAIL_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
