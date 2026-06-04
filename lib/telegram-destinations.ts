/** Comma- or semicolon-separated chat ids in TELEGRAM_CHAT_ID and/or TELEGRAM_CHAT_IDS. */
export function getTelegramChatIds(): string[] {
  const rawParts = [
    process.env.TELEGRAM_CHAT_ID,
    process.env.TELEGRAM_CHAT_IDS,
  ].filter((v): v is string => Boolean(v?.trim()));

  const ids: string[] = [];
  for (const raw of rawParts) {
    for (const segment of raw.split(/[,;]+/)) {
      const id = segment.trim();
      if (id) ids.push(id);
    }
  }
  return [...new Set(ids)];
}

/** Optional labels in TELEGRAM_CHAT_LABELS — same order as combined chat id list. */
export function getTelegramChatLabels(): string[] {
  const raw = process.env.TELEGRAM_CHAT_LABELS?.trim();
  if (!raw) return [];
  return raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
}

export function getTelegramBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token || null;
}

export function isTelegramNotifyConfigured(): boolean {
  return Boolean(getTelegramBotToken() && getTelegramChatIds().length > 0);
}

export type TelegramChatResolved = {
  chatId: string;
  label: string | null;
  type: string | null;
  displayName: string;
  username: string | null;
  link: string | null;
};

type TelegramApiResult<T> = { ok: true; result: T } | { ok: false };

async function telegramApi<T>(
  token: string,
  method: string,
  params?: Record<string, string>
): Promise<TelegramApiResult<T>> {
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  try {
    const res = await fetch(url.toString(), { method: "GET" });
    const data = (await res.json()) as { ok: boolean; result?: T };
    if (!data.ok || data.result === undefined) return { ok: false };
    return { ok: true, result: data.result };
  } catch {
    return { ok: false };
  }
}

type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
};

type TelegramChat = {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

function displayNameFromChat(chat: TelegramChat): string {
  if (chat.title) return chat.title;
  const parts = [chat.first_name, chat.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (chat.username) return `@${chat.username}`;
  return String(chat.id);
}

function linkFromChat(chat: TelegramChat): string | null {
  if (chat.username) return `https://t.me/${chat.username}`;
  return null;
}

export async function resolveTelegramDestinations(): Promise<{
  bot: { username: string | null; displayName: string; link: string | null } | null;
  destinations: TelegramChatResolved[];
  configured: boolean;
}> {
  const token = getTelegramBotToken();
  const chatIds = getTelegramChatIds();
  const labels = getTelegramChatLabels();
  const configured = Boolean(token && chatIds.length > 0);

  if (!token || chatIds.length === 0) {
    return { bot: null, destinations: [], configured: false };
  }

  const me = await telegramApi<TelegramUser>(token, "getMe");
  const bot = me.ok
    ? {
        username: me.result.username ?? null,
        displayName: me.result.first_name,
        link: me.result.username ? `https://t.me/${me.result.username}` : null,
      }
    : null;

  const destinations: TelegramChatResolved[] = [];
  for (let i = 0; i < chatIds.length; i++) {
    const chatId = chatIds[i];
    const label = labels[i] ?? null;
    const chatRes = await telegramApi<TelegramChat>(token, "getChat", { chat_id: chatId });
    if (chatRes.ok) {
      const chat = chatRes.result;
      destinations.push({
        chatId,
        label,
        type: chat.type,
        displayName: displayNameFromChat(chat),
        username: chat.username ?? null,
        link: linkFromChat(chat),
      });
    } else {
      destinations.push({
        chatId,
        label,
        type: null,
        displayName: label ?? `Chat ${chatId}`,
        username: null,
        link: null,
      });
    }
  }

  return { bot, destinations, configured };
}
