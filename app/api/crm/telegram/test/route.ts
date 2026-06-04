import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { sendTelegramHtml, telegramLine } from "@/lib/telegram";
import { loadTelegramConfig } from "@/lib/telegram-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await loadTelegramConfig();
  if (!config.botToken || config.chatIds.length === 0) {
    return NextResponse.json(
      { error: "Save bot token and chat ids before sending a test." },
      { status: 400 }
    );
  }

  const html = [
    "<b>998 CRM test</b>",
    telegramLine("Site", "998webdesigns.com"),
    telegramLine("Destinations", String(config.chatIds.length)),
    "If you see this, Telegram alerts are working.",
  ].join("\n");

  await sendTelegramHtml(html);

  return NextResponse.json({
    ok: true,
    sentTo: config.chatIds.length,
  });
}
