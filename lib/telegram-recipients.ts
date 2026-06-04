export type TelegramRecipient = {
  chatId: string;
  label: string;
};

export function recipientsFromParallel(
  chatIds: string[],
  labels: string[]
): TelegramRecipient[] {
  return chatIds.map((chatId, i) => ({
    chatId,
    label: labels[i]?.trim() ?? "",
  }));
}

export function serializeRecipients(recipients: TelegramRecipient[]): {
  chatIds: string;
  chatLabels: string;
} {
  if (!recipients.length) {
    return { chatIds: "", chatLabels: "" };
  }
  return {
    chatIds: recipients.map((r) => r.chatId).join(", "),
    chatLabels: recipients.map((r) => r.label).join(", "),
  };
}

export function appendRecipient(
  recipients: TelegramRecipient[],
  chatId: string,
  label?: string
): TelegramRecipient[] {
  const id = chatId.trim();
  if (!id) return recipients;
  if (recipients.some((r) => r.chatId === id)) return recipients;
  return [...recipients, { chatId: id, label: label?.trim() ?? "" }];
}

export function removeRecipient(
  recipients: TelegramRecipient[],
  chatId: string
): TelegramRecipient[] {
  return recipients.filter((r) => r.chatId !== chatId);
}
