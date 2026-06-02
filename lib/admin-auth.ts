import { timingSafeEqual } from "crypto";

/** Constant-time Bearer token check for admin routes. */
export function verifyBearerSecret(
  authorizationHeader: string | null,
  secret: string
): boolean {
  if (!authorizationHeader?.startsWith("Bearer ")) return false;

  const token = authorizationHeader.slice(7);
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
