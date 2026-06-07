import { createHash } from "crypto";
import { VOICE_DEMO_OTP_TTL_MS } from "@/lib/voice-demo-constants";
import { normalizeVerificationCode } from "@/lib/voice-demo-code";

export function hashVerificationCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function verificationExpiresAt(now = Date.now()): string {
  return new Date(now + VOICE_DEMO_OTP_TTL_MS).toISOString();
}

export function isVerificationExpired(expiresAt: string | null, now = Date.now()): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < now;
}

export function codesMatch(storedHash: string | null, submitted: string): boolean {
  if (!storedHash) return false;
  const normalized = normalizeVerificationCode(submitted);
  if (normalized.length < 4) return false;
  const hash = hashVerificationCode(normalized);
  return hash === storedHash;
}
