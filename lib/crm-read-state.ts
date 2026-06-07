import { supabaseAdmin } from "@/lib/supabase";

export async function setCrmItemReadState(
  source: "lead" | "client" | "contact" | "discovery" | "sms" | "voice_demo",
  id: string,
  read: boolean
): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const table =
    source === "lead" || source === "client"
      ? "wd_leads"
      : source === "contact"
        ? "contact_submissions"
        : source === "sms"
          ? "inbound_sms"
          : source === "voice_demo"
            ? "voice_demo_leads"
            : "discovery_prospects";
  const read_at = read ? new Date().toISOString() : null;

  const { error } = await supa.from(table).update({ read_at }).eq("id", id);
  if (error) {
    console.warn(`[crm-read] ${table} update failed:`, error.message);
    return false;
  }
  return true;
}
