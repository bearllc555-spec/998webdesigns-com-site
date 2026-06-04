import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { buildCrmTelegramStatusResponse } from "@/lib/crm-telegram-api";
import { clearTelegramBotTokenFromCrm, saveTelegramBotTokenFromCrm } from "@/lib/telegram-config";
import { verifyTelegramBotToken } from "@/lib/telegram-destinations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { botToken?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.botToken?.trim();
  if (!token) {
    return NextResponse.json({ error: "Bot token is required" }, { status: 400 });
  }

  const verified = await verifyTelegramBotToken(token);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  const saveResult = await saveTelegramBotTokenFromCrm(token);
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

export async function DELETE(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clearResult = await clearTelegramBotTokenFromCrm();
  if (!clearResult.ok) {
    const status = clearResult.reason === "table_missing" ? 503 : 400;
    return NextResponse.json({ error: clearResult.detail }, { status });
  }

  const payload = await buildCrmTelegramStatusResponse(clearResult.config);
  return NextResponse.json({ ok: true, ...payload });
}
