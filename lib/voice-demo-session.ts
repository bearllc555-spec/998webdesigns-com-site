import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { VOICE_DEMO_SESSION_COOKIE, VOICE_DEMO_SESSION_TTL_MS } from "@/lib/voice-demo-constants";
import {
  parseVoiceDemoVertical,
  type VoiceDemoVertical,
} from "@/lib/voice-demo-vertical";

export type VoiceDemoSessionPayload = {
  leadId: string;
  verified: boolean;
  vertical: VoiceDemoVertical;
  exp: number;
};

function signingSecret(): string | null {
  return process.env.BALANCE_CAPTURE_SECRET?.trim() || null;
}

function signPayload(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

export function createVoiceDemoSessionToken(
  leadId: string,
  verified: boolean,
  vertical: VoiceDemoVertical = "marketing",
  now = Date.now()
): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const payload: VoiceDemoSessionPayload = {
    leadId,
    verified,
    vertical,
    exp: now + VOICE_DEMO_SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = signPayload(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifyVoiceDemoSessionToken(
  token: string | undefined,
  now = Date.now()
): VoiceDemoSessionPayload | null {
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

  let payload: VoiceDemoSessionPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof payload.leadId !== "string" ||
    typeof payload.verified !== "boolean" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  payload.vertical = parseVoiceDemoVertical(payload.vertical);

  if (payload.exp < now) return null;
  return payload;
}

export function voiceDemoSessionCookieOptions(maxAgeSec = VOICE_DEMO_SESSION_TTL_MS / 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}

export function setVoiceDemoSessionCookie(
  res: NextResponse,
  leadId: string,
  verified: boolean,
  vertical: VoiceDemoVertical = "marketing"
): void {
  const token = createVoiceDemoSessionToken(leadId, verified, vertical);
  if (!token) return;
  res.cookies.set(VOICE_DEMO_SESSION_COOKIE, token, voiceDemoSessionCookieOptions());
}

export function clearVoiceDemoSessionCookie(res: NextResponse): void {
  res.cookies.set(VOICE_DEMO_SESSION_COOKIE, "", {
    ...voiceDemoSessionCookieOptions(0),
    maxAge: 0,
  });
}

export function readVoiceDemoSession(req: NextRequest): VoiceDemoSessionPayload | null {
  const cookie = req.cookies.get(VOICE_DEMO_SESSION_COOKIE)?.value;
  return verifyVoiceDemoSessionToken(cookie);
}

export async function readVoiceDemoSessionFromCookies(): Promise<VoiceDemoSessionPayload | null> {
  const jar = await cookies();
  return verifyVoiceDemoSessionToken(jar.get(VOICE_DEMO_SESSION_COOKIE)?.value);
}
