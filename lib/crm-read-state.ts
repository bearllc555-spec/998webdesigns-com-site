import { crmVoiceDemoLeadsTable } from "@/lib/crm-item-source";
import { supabaseAdmin } from "@/lib/supabase";

export async function setCrmItemReadState(
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
  read: boolean
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
  const read_at = read ? new Date().toISOString() : null;

  const { error } = await supa.from(table).update({ read_at }).eq("id", id);
  if (error) {
    console.warn(`[crm-read] ${table} update failed:`, error.message);
    return false;
  }
  return true;
}
