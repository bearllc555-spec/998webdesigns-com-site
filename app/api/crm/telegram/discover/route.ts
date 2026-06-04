import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { loadTelegramConfig } from "@/lib/telegram-config";
import {
  fetchTelegramRecentChats,
  verifyTelegramBotToken,
} from "@/lib/telegram-destinations";

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

  let body: { botToken?: string } = {};
  try {
    const raw = await req.text();
    if (raw) body = JSON.parse(raw) as { botToken?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const config = await loadTelegramConfig();
  const token = body.botToken?.trim() || config.botToken;
  if (!token) {
    return NextResponse.json({ error: "Enter a bot token first" }, { status: 400 });
  }

  const verified = await verifyTelegramBotToken(token);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  const recentChats = await fetchTelegramRecentChats(token);

  return NextResponse.json({
    bot: verified.bot,
    recentChats,
    hint:
      recentChats.length === 0
        ? "No chats yet. Open your bot in Telegram, tap Start, send a message, then discover again."
        : null,
  });
}
