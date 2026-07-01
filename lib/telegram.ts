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
): Promise<boolean> {
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
    return false;
  }
  return true;
}

/** Telegram alert to every configured chat. Returns true if at least one send succeeded. */
export async function sendTelegramHtml(html: string): Promise<boolean> {
  const { botToken, chatIds } = await loadTelegramConfig();
  if (!botToken || chatIds.length === 0) {
    console.warn("[telegram] bot token or chat id(s) missing - skip notify");
    return false;
  }

  try {
    const results = await Promise.all(
      chatIds.map((chatId) => sendTelegramHtmlToChat(botToken, chatId, html))
    );
    return results.some(Boolean);
  } catch (err) {
    console.error("[telegram] sendMessage error:", err);
    return false;
  }
}

export function telegramLine(label: string, value: string): string {
  return `<b>${escapeHtml(label)}</b> ${escapeHtml(value)}`;
}
