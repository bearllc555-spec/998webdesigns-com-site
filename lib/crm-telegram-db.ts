import { supabaseAdmin } from "@/lib/supabase";

export const CRM_TELEGRAM_SETTINGS_ID = "default";

export type CrmTelegramSettingsRow = {
  bot_token: string | null;
  chat_ids: string;
  chat_labels: string | null;
  updated_at: string;
};

function isMissingTable(error: { code?: string; message?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("crm_telegram_settings")
  );
}

export async function fetchCrmTelegramSettingsFromDb(): Promise<CrmTelegramSettingsRow | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const { data, error } = await supa
    .from("crm_telegram_settings")
    .select("bot_token, chat_ids, chat_labels, updated_at")
    .eq("id", CRM_TELEGRAM_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    if (!isMissingTable(error)) {
      console.warn("[crm-telegram] fetch failed:", error.message);
    }
    return null;
  }

  return data as CrmTelegramSettingsRow | null;
}

export type SaveCrmTelegramSettingsInput = {
  botToken: string | null;
  chatIds: string;
  chatLabels: string | null;
};

export type SaveCrmTelegramSettingsResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "table_missing" | "save_failed"; detail: string };

export async function saveCrmTelegramSettingsToDb(
  input: SaveCrmTelegramSettingsInput
): Promise<SaveCrmTelegramSettingsResult> {
  const supa = supabaseAdmin();
  if (!supa) {
    return { ok: false, reason: "not_configured", detail: "Supabase not configured" };
  }

  const { error } = await supa.from("crm_telegram_settings").upsert(
    {
      id: CRM_TELEGRAM_SETTINGS_ID,
      bot_token: input.botToken,
      chat_ids: input.chatIds,
      chat_labels: input.chatLabels,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    if (isMissingTable(error)) {
      return {
        ok: false,
        reason: "table_missing",
        detail: "Run supabase/schema.sql or apply migration crm_telegram_settings",
      };
    }
    return { ok: false, reason: "save_failed", detail: error.message };
  }

  return { ok: true };
}
