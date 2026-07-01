import { supabaseAdmin } from "@/lib/supabase";

/** Hard-delete a scorecard report (signals cascade). Removes row from CRM Reports inbox. */
export async function deleteScorecardReport(id: string): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const { error } = await supa.from("scorecard_reports").delete().eq("id", id);
  if (error) {
    console.warn("[scorecard-report] delete failed:", error.message);
    return false;
  }
  return true;
}
