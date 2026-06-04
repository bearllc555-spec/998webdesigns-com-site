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
import {
  appendRecipient,
  recipientsFromParallel,
  removeRecipient,
  updateRecipient,
  serializeRecipients,
  type TelegramRecipient,
} from "@/lib/telegram-recipients";

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

export function configToRecipients(config: TelegramConfig): TelegramRecipient[] {
  return recipientsFromParallel(config.chatIds, config.labels);
}

export async function persistTelegramRecipients(input: {
  botToken?: string;
  recipients: TelegramRecipient[];
  requireAtLeastOne?: boolean;
}): Promise<SaveCrmTelegramSettingsResult & { config?: TelegramConfig }> {
  const existing = await loadTelegramConfig();
  if (input.requireAtLeastOne && input.recipients.length === 0) {
    return { ok: false, reason: "save_failed", detail: "At least one recipient is required" };
  }

  const nextToken = input.botToken?.trim()
    ? input.botToken.trim()
    : existing.botToken;

  if (!nextToken) {
    return { ok: false, reason: "save_failed", detail: "Bot token is required" };
  }

  const { chatIds, chatLabels } = serializeRecipients(input.recipients);
  const saveResult = await saveCrmTelegramSettingsToDb({
    botToken: nextToken,
    chatIds,
    chatLabels: chatLabels || null,
  });

  if (!saveResult.ok) return saveResult;

  return { ok: true, config: await loadTelegramConfig() };
}

export async function saveTelegramConfigFromCrm(input: {
  botToken?: string;
  chatIds: string;
  chatLabels?: string;
}): Promise<SaveCrmTelegramSettingsResult & { config?: TelegramConfig }> {
  const chatIds = parseChatIdsFromRaw(input.chatIds);
  const labels = parseLabelsFromRaw(input.chatLabels ?? "");
  return persistTelegramRecipients({
    botToken: input.botToken,
    recipients: recipientsFromParallel(chatIds, labels),
    requireAtLeastOne: true,
  });
}

export async function addTelegramRecipientFromCrm(input: {
  botToken?: string;
  chatId: string;
  label?: string;
}): Promise<SaveCrmTelegramSettingsResult & { config?: TelegramConfig }> {
  const existing = await loadTelegramConfig();
  const recipients = configToRecipients(existing);
  const merged = appendRecipient(recipients, input.chatId, input.label);
  return persistTelegramRecipients({
    botToken: input.botToken,
    recipients: merged,
    requireAtLeastOne: true,
  });
}

export async function removeTelegramRecipientFromCrm(
  chatId: string
): Promise<SaveCrmTelegramSettingsResult & { config?: TelegramConfig }> {
  const existing = await loadTelegramConfig();
  const recipients = removeRecipient(configToRecipients(existing), chatId);
  return persistTelegramRecipients({
    recipients,
    requireAtLeastOne: false,
  });
}

export async function saveTelegramBotTokenFromCrm(
  botToken: string
): Promise<SaveCrmTelegramSettingsResult & { config?: TelegramConfig }> {
  const existing = await loadTelegramConfig();
  return persistTelegramRecipients({
    botToken,
    recipients: configToRecipients(existing),
    requireAtLeastOne: false,
  });
}

export async function updateTelegramRecipientFromCrm(
  oldChatId: string,
  input: { chatId?: string; label?: string }
): Promise<SaveCrmTelegramSettingsResult & { config?: TelegramConfig }> {
  const existing = await loadTelegramConfig();
  const recipients = configToRecipients(existing);
  const current = recipients.find((r) => r.chatId === oldChatId);
  if (!current) {
    return { ok: false, reason: "save_failed", detail: "Recipient not found" };
  }

  const nextChatId = input.chatId?.trim() || current.chatId;
  const nextLabel = input.label !== undefined ? input.label.trim() : current.label;
  const updated = updateRecipient(recipients, oldChatId, {
    chatId: nextChatId,
    label: nextLabel,
  });

  return persistTelegramRecipients({
    recipients: updated,
    requireAtLeastOne: false,
  });
}

