import {
  configToRecipients,
  formatChatIdsForInput,
  formatLabelsForInput,
  loadTelegramConfig,
  maskBotToken,
  type TelegramConfig,
} from "@/lib/telegram-config";
import { resolveTelegramDestinations } from "@/lib/telegram-destinations";

export async function buildCrmTelegramStatusResponse(config?: TelegramConfig) {
  const cfg = config ?? (await loadTelegramConfig());
  const { bot, destinations, configured } = await resolveTelegramDestinations(cfg);
  const recipients = configToRecipients(cfg);

  return {
    configured,
    settings: {
      source: cfg.source,
      storedInDatabase: cfg.storedInDatabase,
      hasStoredToken: cfg.hasStoredToken,
      botTokenMasked: maskBotToken(cfg.botToken),
      chatIds: formatChatIdsForInput(cfg.chatIds),
      chatLabels: formatLabelsForInput(cfg.labels),
      updatedAt: cfg.updatedAt,
    },
    recipients,
    bot,
    destinations,
    setupHint: configured
      ? null
      : "Open Admin, add your bot token and at least one recipient, then Save.",
  };
}
