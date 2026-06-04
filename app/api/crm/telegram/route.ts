import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import {
  getTelegramChatIds,
  getTelegramChatLabels,
  isTelegramNotifyConfigured,
  resolveTelegramDestinations,
} from "@/lib/telegram-destinations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatIds = getTelegramChatIds();
  const labels = getTelegramChatLabels();
  const { bot, destinations, configured } = await resolveTelegramDestinations();

  return NextResponse.json({
    configured: isTelegramNotifyConfigured(),
    chatIdCount: chatIds.length,
    labels,
    bot,
    destinations,
    setupHint: configured
      ? null
      : "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID on Vercel (comma-separate multiple chat ids). Message the bot from each account first.",
  });
}
