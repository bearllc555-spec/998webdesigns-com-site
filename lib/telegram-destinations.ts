import { loadTelegramConfig, type TelegramConfig } from "@/lib/telegram-config";

/** Comma- or semicolon-separated chat ids in TELEGRAM_CHAT_ID and/or TELEGRAM_CHAT_IDS. */
export function parseChatIdsFromRaw(raw: string): string[] {
  const ids: string[] = [];
  for (const segment of raw.split(/[,;]+/)) {
    const id = segment.trim();
    if (id) ids.push(id);
  }
  return [...new Set(ids)];
}

export function parseLabelsFromRaw(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
}

/** Env-only chat ids (fallback when CRM DB has none). */
export function getTelegramChatIds(): string[] {
  const rawParts = [
    process.env.TELEGRAM_CHAT_ID,
    process.env.TELEGRAM_CHAT_IDS,
  ].filter((v): v is string => Boolean(v?.trim()));

  const ids: string[] = [];
  for (const raw of rawParts) {
    ids.push(...parseChatIdsFromRaw(raw));
  }
  return [...new Set(ids)];
}

export function getTelegramChatLabels(): string[] {
  return parseLabelsFromRaw(process.env.TELEGRAM_CHAT_LABELS ?? "");
}

export function getTelegramBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token || null;
}

/** Env-only check (tests). Runtime uses loadTelegramConfig(). */
export function isTelegramNotifyConfiguredFromEnv(): boolean {
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

export type TelegramApiResult<T> = { ok: true; result: T } | { ok: false; error?: string };

export async function telegramApi<T>(
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
    const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!data.ok || data.result === undefined) {
      return { ok: false, error: data.description };
    }
    return { ok: true, result: data.result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "request failed" };
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

type TelegramUpdate = {
  update_id: number;
  message?: { chat: TelegramChat };
  edited_message?: { chat: TelegramChat };
  channel_post?: { chat: TelegramChat };
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

export async function verifyTelegramBotToken(
  token: string
): Promise<
  | { ok: true; bot: { username: string | null; displayName: string; link: string | null } }
  | { ok: false; error: string }
> {
  const me = await telegramApi<TelegramUser>(token, "getMe");
  if (!me.ok) return { ok: false, error: me.error ?? "Invalid bot token" };
  return {
    ok: true,
    bot: {
      username: me.result.username ?? null,
      displayName: me.result.first_name,
      link: me.result.username ? `https://t.me/${me.result.username}` : null,
    },
  };
}

export type TelegramRecentChat = {
  chatId: string;
  type: string;
  displayName: string;
  username: string | null;
};

export async function fetchTelegramRecentChats(token: string): Promise<TelegramRecentChat[]> {
  const updates = await telegramApi<TelegramUpdate[]>(token, "getUpdates", { limit: "50" });
  if (!updates.ok) return [];

  const byId = new Map<string, TelegramRecentChat>();
  for (const u of updates.result) {
    const chat = u.message?.chat ?? u.edited_message?.chat ?? u.channel_post?.chat;
    if (!chat || chat.type === "private" && chat.id === 0) continue;
    const chatId = String(chat.id);
    byId.set(chatId, {
      chatId,
      type: chat.type,
      displayName: displayNameFromChat(chat),
      username: chat.username ?? null,
    });
  }
  return [...byId.values()];
}

export async function resolveTelegramDestinations(
  config?: TelegramConfig
): Promise<{
  bot: { username: string | null; displayName: string; link: string | null } | null;
  destinations: TelegramChatResolved[];
  configured: boolean;
}> {
  const cfg = config ?? (await loadTelegramConfig());
  const token = cfg.botToken;
  const chatIds = cfg.chatIds;
  const labels = cfg.labels;
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
