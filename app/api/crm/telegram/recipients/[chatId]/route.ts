import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { buildCrmTelegramStatusResponse } from "@/lib/crm-telegram-api";
import { removeTelegramRecipientFromCrm } from "@/lib/telegram-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = await params;
  const decoded = decodeURIComponent(chatId).trim();
  if (!decoded) {
    return NextResponse.json({ error: "Invalid chat id" }, { status: 400 });
  }

  const result = await removeTelegramRecipientFromCrm(decoded);
  if (!result.ok) {
    const status = result.reason === "table_missing" ? 503 : 500;
    return NextResponse.json({ error: result.detail }, { status });
  }

  const payload = await buildCrmTelegramStatusResponse(result.config);
  return NextResponse.json({ ok: true, ...payload });
}
