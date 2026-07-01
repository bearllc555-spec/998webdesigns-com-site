import { supabaseAdmin } from "@/lib/supabase";

/** Public report token → site screenshot URL (service role; not exposed via anon RPC). */
export async function fetchSiteThumbnailByToken(token: string): Promise<string | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const { data, error } = await supa
    .from("scorecard_reports")
    .select("site_screenshot_url")
    .eq("token", token)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.warn("[site-thumbnail] query failed:", error.message);
    return null;
  }

  const url = (data?.site_screenshot_url as string | null)?.trim();
  return url || null;
}
