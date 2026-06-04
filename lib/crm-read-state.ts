import { supabaseAdmin } from "@/lib/supabase";

export async function setCrmItemReadState(
  source: "lead" | "contact",
  id: string,
  read: boolean
): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const table = source === "lead" ? "wd_leads" : "contact_submissions";
  const read_at = read ? new Date().toISOString() : null;

  const { error } = await supa.from(table).update({ read_at }).eq("id", id);
  if (error) {
    console.warn(`[crm-read] ${table} update failed:`, error.message);
    return false;
  }
  return true;
}
