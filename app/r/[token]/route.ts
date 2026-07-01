import { NextRequest, NextResponse } from "next/server";
import { notifyScorecardReadyOnce } from "@/lib/scorecard/crm-ready-notify";
import { supabasePublic } from "@/lib/supabase";
import {
  renderScorecardReportHtml,
  scorecardNotFoundHtml,
  SCORECARD_REPORT_HEADERS,
} from "@/lib/scorecard/render-report";
import type { ScorecardReportPayload } from "@/lib/scorecard/types";

export const runtime = "nodejs";

function bookingUrl(): string {
  return process.env.BOOKING_URL?.trim() || "https://998webdesigns.com/book";
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token || token.length < 16) {
    return new NextResponse(scorecardNotFoundHtml(), {
      status: 404,
      headers: SCORECARD_REPORT_HEADERS,
    });
  }

  const supa = supabasePublic();
  if (!supa) {
    return new NextResponse(scorecardNotFoundHtml(), {
      status: 404,
      headers: SCORECARD_REPORT_HEADERS,
    });
  }

  const { data, error } = await supa.rpc("get_report_by_token", { p_token: token });
  if (error || !data) {
    return new NextResponse(scorecardNotFoundHtml(), {
      status: 404,
      headers: SCORECARD_REPORT_HEADERS,
    });
  }

  const payload = data as ScorecardReportPayload | null;
  if (!payload?.report) {
    return new NextResponse(scorecardNotFoundHtml(), {
      status: 404,
      headers: SCORECARD_REPORT_HEADERS,
    });
  }

  const report = payload.report;
  if (report.id) {
    void notifyScorecardReadyOnce({
      reportId: report.id,
      token,
      domain: report.domain,
      score: report.score,
      verdict: report.verdict,
      businessName: report.business_name,
    }).catch((err) => console.warn("[scorecard/report] ready notify failed:", err));
  }

  const html = renderScorecardReportHtml(
    report,
    payload.signals ?? [],
    bookingUrl(),
    report.site_screenshot_url?.trim() ? undefined : token
  );

  return new NextResponse(html, { headers: SCORECARD_REPORT_HEADERS });
}
