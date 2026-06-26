import { NextRequest, NextResponse } from "next/server";
import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import {
  aestheticsCrmSessionCookie,
  aestheticsDemoCrmSessionCookieOptions,
  aestheticsDemoCrmSessionToken,
  isAestheticsDemoCrmRequestAuthorized,
  isValidAestheticsDemoCrmLogin,
} from "@/lib/aesthetics-demo-crm/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createSessionRoute(brand: AestheticsDemoBrand) {
  return {
    async POST(req: NextRequest) {
      const rate = await enforceApiRateLimit(req, `/api/demo/${brand}/crm/session`);
      if (!rate.allowed) {
        const body = rateLimitResponse(rate.retryAfterSec);
        return NextResponse.json(
          { error: body.error },
          { status: body.status, headers: body.headers }
        );
      }

      let email = "";
      let password = "";
      try {
        const body = (await req.json()) as { email?: string; password?: string };
        email = typeof body.email === "string" ? body.email : "";
        password = typeof body.password === "string" ? body.password : "";
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }

      if (!isValidAestheticsDemoCrmLogin(brand, email, password)) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }

      const res = NextResponse.json({ ok: true });
      res.cookies.set(
        aestheticsCrmSessionCookie(brand),
        aestheticsDemoCrmSessionToken(brand),
        aestheticsDemoCrmSessionCookieOptions()
      );
      return res;
    },

    async DELETE(req: NextRequest) {
      if (!isAestheticsDemoCrmRequestAuthorized(brand, req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const res = NextResponse.json({ ok: true });
      res.cookies.set(aestheticsCrmSessionCookie(brand), "", {
        ...aestheticsDemoCrmSessionCookieOptions(0),
        maxAge: 0,
      });
      return res;
    },
  };
}

const routes = createSessionRoute("clinical");
export const POST = routes.POST;
export const DELETE = routes.DELETE;
