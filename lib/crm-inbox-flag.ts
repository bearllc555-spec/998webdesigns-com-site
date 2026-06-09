import { crmVoiceDemoLeadsTable } from "@/lib/crm-item-source";
import { supabaseAdmin } from "@/lib/supabase";

/** CRM inbox triage flag (null = outline star placeholder). */
export type CrmInboxFlag = "star" | "check" | "alert";

export function isCrmInboxFlag(value: unknown): value is CrmInboxFlag {
  return value === "star" || value === "check" || value === "alert";
}

export function nextCrmInboxFlag(current: CrmInboxFlag | null): CrmInboxFlag | null {
  if (current === null) return "star";
  if (current === "star") return "check";
  if (current === "check") return "alert";
  return null;
}

export function crmInboxFlagLabel(flag: CrmInboxFlag | null): string {
  if (flag === "star") return "Starred";
  if (flag === "check") return "Done";
  if (flag === "alert") return "Needs attention";
  return "No flag";
}

export async function setCrmItemInboxFlag(
  source:
    | "lead"
    | "client"
    | "contact"
    | "discovery"
    | "sms"
    | "voice_demo"
    | "plumbing_demo"
    | "blog",
  id: string,
  flag: CrmInboxFlag | null
): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const voiceDemoTable = crmVoiceDemoLeadsTable(source);
  const table =
    source === "lead" || source === "client"
      ? "wd_leads"
      : source === "contact"
        ? "contact_submissions"
        : source === "sms"
          ? "inbound_sms"
          : voiceDemoTable
            ? voiceDemoTable
            : source === "blog"
              ? "blog_posts"
              : "discovery_prospects";
  const inbox_flag = flag;

  const { error } = await supa.from(table).update({ inbox_flag }).eq("id", id);
  if (error) {
    console.warn(`[crm-flag] ${table} update failed:`, error.message);
    return false;
  }
  return true;
}
