import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { fetchInternalScorecard } from "@/lib/scorecard/fetch-internal-report";
import {
  renderInternalScorecardBriefHtml,
  SCORECARD_BRIEF_HEADERS,
} from "@/lib/scorecard/render-internal-report";
import { scorecardNotFoundHtml } from "@/lib/scorecard/render-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bookingUrl(): string {
  return process.env.BOOKING_URL?.trim() || "https://998webdesigns.com/book";
}

function publicBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://998webdesigns.com";
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  if (!isCrmRequestAuthorized(req)) {
    const next = `/crm/scorecard/r/${token}`;
    const login = new URL("/crm/login", req.url);
    login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }

  if (!token || token.length < 16) {
    return new NextResponse(scorecardNotFoundHtml(), {
      status: 404,
      headers: SCORECARD_BRIEF_HEADERS,
    });
  }

  const bundle = await fetchInternalScorecard(token);
  if (!bundle) {
    return new NextResponse(scorecardNotFoundHtml(), {
      status: 404,
      headers: SCORECARD_BRIEF_HEADERS,
    });
  }

  const html = renderInternalScorecardBriefHtml(bundle, bookingUrl(), publicBase());
  return new NextResponse(html, { headers: SCORECARD_BRIEF_HEADERS });
}
