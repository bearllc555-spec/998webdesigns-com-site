import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import {
  formatChatIdsForInput,
  formatLabelsForInput,
  loadTelegramConfig,
  maskBotToken,
  saveTelegramConfigFromCrm,
} from "@/lib/telegram-config";
import { resolveTelegramDestinations, verifyTelegramBotToken } from "@/lib/telegram-destinations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function crmRateLimit(req: NextRequest) {
  return enforceApiRateLimit(req, "/api/crm/feed");
}

export async function GET(req: NextRequest) {
  const rate = await crmRateLimit(req);
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await loadTelegramConfig();
  const { bot, destinations, configured } = await resolveTelegramDestinations(config);

  return NextResponse.json({
    configured,
    settings: {
      source: config.source,
      storedInDatabase: config.storedInDatabase,
      hasStoredToken: config.hasStoredToken,
      botTokenMasked: maskBotToken(config.botToken),
      chatIds: formatChatIdsForInput(config.chatIds),
      chatLabels: formatLabelsForInput(config.labels),
      updatedAt: config.updatedAt,
    },
    bot,
    destinations,
    setupHint: configured
      ? null
      : "Add your bot token and at least one chat id below, then save.",
  });
}

export async function PUT(req: NextRequest) {
  const rate = await crmRateLimit(req);
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { botToken?: string; chatIds?: string; chatLabels?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.chatIds !== "string") {
    return NextResponse.json({ error: "chatIds is required" }, { status: 400 });
  }

  const existing = await loadTelegramConfig();
  const tokenToVerify = body.botToken?.trim() || existing.botToken;
  if (!tokenToVerify) {
    return NextResponse.json({ error: "Bot token is required" }, { status: 400 });
  }

  const verified = await verifyTelegramBotToken(tokenToVerify);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  const saveResult = await saveTelegramConfigFromCrm({
    botToken: body.botToken,
    chatIds: body.chatIds,
    chatLabels: body.chatLabels,
  });

  if (!saveResult.ok) {
    const status = saveResult.reason === "table_missing" ? 503 : 500;
    return NextResponse.json({ error: saveResult.detail }, { status });
  }

  const config = saveResult.config ?? (await loadTelegramConfig());
  const { bot, destinations, configured } = await resolveTelegramDestinations(config);

  return NextResponse.json({
    ok: true,
    configured,
    settings: {
      source: config.source,
      storedInDatabase: config.storedInDatabase,
      hasStoredToken: config.hasStoredToken,
      botTokenMasked: maskBotToken(config.botToken),
      chatIds: formatChatIdsForInput(config.chatIds),
      chatLabels: formatLabelsForInput(config.labels),
      updatedAt: config.updatedAt,
    },
    bot: verified.bot ?? bot,
    destinations,
  });
}
