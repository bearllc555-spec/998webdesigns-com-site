import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { buildCrmTelegramStatusResponse } from "@/lib/crm-telegram-api";
import {
  addTelegramRecipientFromCrm,
  loadTelegramConfig,
  saveTelegramConfigFromCrm,
} from "@/lib/telegram-config";
import { verifyTelegramBotToken } from "@/lib/telegram-destinations";

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

  return NextResponse.json(await buildCrmTelegramStatusResponse());
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

  let body: {
    botToken?: string;
    chatIds?: string;
    chatLabels?: string;
    addRecipient?: { chatId: string; label?: string };
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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

  let saveResult;
  if (body.addRecipient?.chatId) {
    const chatId = body.addRecipient.chatId.trim();
    if (!chatId) {
      return NextResponse.json({ error: "Chat id is required" }, { status: 400 });
    }
    saveResult = await addTelegramRecipientFromCrm({
      botToken: body.botToken,
      chatId,
      label: body.addRecipient.label,
    });
  } else if (typeof body.chatIds === "string") {
    saveResult = await saveTelegramConfigFromCrm({
      botToken: body.botToken,
      chatIds: body.chatIds,
      chatLabels: body.chatLabels,
    });
  } else {
    return NextResponse.json(
      { error: "Provide addRecipient or chatIds" },
      { status: 400 }
    );
  }

  if (!saveResult.ok) {
    const status = saveResult.reason === "table_missing" ? 503 : 500;
    return NextResponse.json({ error: saveResult.detail }, { status });
  }

  const payload = await buildCrmTelegramStatusResponse(saveResult.config);
  return NextResponse.json({
    ok: true,
    ...payload,
    bot: verified.bot ?? payload.bot,
  });
}
