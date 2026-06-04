import {
  fetchCrmTelegramSettingsFromDb,
  saveCrmTelegramSettingsToDb,
  type SaveCrmTelegramSettingsResult,
} from "@/lib/crm-telegram-db";
import {
  getTelegramBotToken,
  getTelegramChatIds,
  getTelegramChatLabels,
  parseChatIdsFromRaw,
  parseLabelsFromRaw,
} from "@/lib/telegram-destinations";

export type TelegramConfigSource = "database" | "environment" | "none";

export type TelegramConfig = {
  source: TelegramConfigSource;
  botToken: string | null;
  chatIds: string[];
  labels: string[];
  storedInDatabase: boolean;
  hasStoredToken: boolean;
  updatedAt: string | null;
};

export function maskBotToken(token: string | null): string | null {
  if (!token) return null;
  if (token.length <= 8) return "••••••••";
  return `••••${token.slice(-4)}`;
}

export function formatChatIdsForInput(ids: string[]): string {
  return ids.join(", ");
}

export function formatLabelsForInput(labels: string[]): string {
  return labels.join(", ");
}

export async function loadTelegramConfig(): Promise<TelegramConfig> {
  const row = await fetchCrmTelegramSettingsFromDb();
  const envToken = getTelegramBotToken();
  const envIds = getTelegramChatIds();
  const envLabels = getTelegramChatLabels();

  const dbToken = row?.bot_token?.trim() || null;
  const dbIds = parseChatIdsFromRaw(row?.chat_ids ?? "");
  const dbLabels = parseLabelsFromRaw(row?.chat_labels ?? "");

  const botToken = dbToken || envToken;
  const chatIds = dbIds.length > 0 ? dbIds : envIds;
  const labels = row ? dbLabels : envLabels;

  let source: TelegramConfigSource = "none";
  if (botToken && chatIds.length > 0) {
    source = dbToken || dbIds.length > 0 ? "database" : "environment";
  }

  return {
    source,
    botToken,
    chatIds,
    labels,
    storedInDatabase: Boolean(row),
    hasStoredToken: Boolean(dbToken),
    updatedAt: row?.updated_at ?? null,
  };
}

export async function saveTelegramConfigFromCrm(input: {
  botToken?: string;
  chatIds: string;
  chatLabels?: string;
}): Promise<SaveCrmTelegramSettingsResult & { config?: TelegramConfig }> {
  const existing = await loadTelegramConfig();
  const chatIds = parseChatIdsFromRaw(input.chatIds);
  if (chatIds.length === 0) {
    return { ok: false, reason: "save_failed", detail: "At least one chat id is required" };
  }

  const nextToken = input.botToken?.trim()
    ? input.botToken.trim()
    : existing.botToken;

  if (!nextToken) {
    return { ok: false, reason: "save_failed", detail: "Bot token is required" };
  }

  const labelsRaw = input.chatLabels?.trim() ?? "";
  const saveResult = await saveCrmTelegramSettingsToDb({
    botToken: nextToken,
    chatIds: formatChatIdsForInput(chatIds),
    chatLabels: labelsRaw || null,
  });

  if (!saveResult.ok) return saveResult;

  return { ok: true, config: await loadTelegramConfig() };
}
