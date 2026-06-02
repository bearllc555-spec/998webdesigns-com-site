import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, pruneRateLimitStore } from "@/lib/rate-limit";

const LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/leads": { limit: 5, windowMs: 60_000 },
  "/api/contact": { limit: 10, windowMs: 60_000 },
};

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (req.method !== "POST" || !(path in LIMITS)) {
    return NextResponse.next();
  }

  pruneRateLimitStore();

  const config = LIMITS[path];
  const key = `${path}:${clientIp(req)}`;
  const { allowed, retryAfterSec } = checkRateLimit(key, config);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec ?? 60),
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/leads", "/api/contact"],
};
