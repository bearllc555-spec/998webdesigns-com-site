import { loadTelegramConfig } from "@/lib/telegram-config";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendTelegramHtmlToChat(
  token: string,
  chatId: string,
  html: string
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`[telegram] sendMessage failed (${chatId}):`, res.status, body.slice(0, 200));
    return { ok: false, error: body.slice(0, 200) };
  }
  try {
    const parsed = JSON.parse(body) as { ok?: boolean; result?: { message_id?: number } };
    return { ok: true, messageId: parsed.result?.message_id };
  } catch {
    return { ok: true };
  }
}

export type TelegramSendResult = {
  delivered: boolean;
  chatIds: string[];
  failedChatIds: string[];
};

/** Telegram alert to every configured chat. Returns true if at least one send succeeded. */
export async function sendTelegramHtml(html: string): Promise<boolean> {
  const result = await sendTelegramHtmlDetailed(html);
  return result.delivered;
}

export async function sendTelegramHtmlDetailed(html: string): Promise<TelegramSendResult> {
  const { botToken, chatIds } = await loadTelegramConfig();
  if (!botToken || chatIds.length === 0) {
    console.warn("[telegram] bot token or chat id(s) missing - skip notify");
    return { delivered: false, chatIds: [], failedChatIds: chatIds };
  }

  try {
    const outcomes = await Promise.all(
      chatIds.map(async (chatId) => ({
        chatId,
        ...(await sendTelegramHtmlToChat(botToken, chatId, html)),
      }))
    );
    const deliveredIds = outcomes.filter((o) => o.ok).map((o) => o.chatId);
    const failedIds = outcomes.filter((o) => !o.ok).map((o) => o.chatId);
    if (deliveredIds.length > 0) {
      console.info("[telegram] delivered to", deliveredIds.join(", "));
    }
    if (failedIds.length > 0) {
      console.warn("[telegram] failed for", failedIds.join(", "));
    }
    return {
      delivered: deliveredIds.length > 0,
      chatIds: deliveredIds,
      failedChatIds: failedIds,
    };
  } catch (err) {
    console.error("[telegram] sendMessage error:", err);
    return { delivered: false, chatIds: [], failedChatIds: chatIds };
  }
}

export function telegramLine(label: string, value: string): string {
  return `<b>${escapeHtml(label)}</b> ${escapeHtml(value)}`;
}
