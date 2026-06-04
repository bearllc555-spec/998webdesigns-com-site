export type TelegramDestination = {
  chatId: string;
  label: string | null;
  type: string | null;
  displayName: string;
  username: string | null;
  link: string | null;
};

export type TelegramSettings = {
  source: string;
  storedInDatabase: boolean;
  hasStoredToken: boolean;
  botTokenMasked: string | null;
  chatIds: string;
  chatLabels: string;
  updatedAt: string | null;
};

export type TelegramStatus = {
  configured: boolean;
  settings: TelegramSettings;
  bot: { username: string | null; displayName: string; link: string | null } | null;
  destinations: TelegramDestination[];
  setupHint: string | null;
};

export function cardTitle(d: TelegramDestination): string {
  return d.label?.trim() || d.displayName;
}
