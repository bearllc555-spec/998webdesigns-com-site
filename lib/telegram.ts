import { getTelegramBotToken, getTelegramChatIds } from "@/lib/telegram-destinations";

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
): Promise<void> {
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
  if (!res.ok) {
    const body = await res.text();
    console.error(`[telegram] sendMessage failed (${chatId}):`, res.status, body.slice(0, 200));
  }
}

/** Fire-and-forget Telegram alert to every configured chat. Never throws to callers. */
export async function sendTelegramHtml(html: string): Promise<void> {
  const token = getTelegramBotToken();
  const chatIds = getTelegramChatIds();
  if (!token || chatIds.length === 0) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or chat id(s) missing — skip notify");
    return;
  }

  try {
    await Promise.allSettled(
      chatIds.map((chatId) => sendTelegramHtmlToChat(token, chatId, html))
    );
  } catch (err) {
    console.error("[telegram] sendMessage error:", err);
  }
}

export function telegramLine(label: string, value: string): string {
  return `<b>${escapeHtml(label)}</b> ${escapeHtml(value)}`;
}
