import "server-only";

import { supabaseAdmin } from "@/lib/supabase";

export const BLOG_DASHBOARD_NOTE_ID = "default";

export type BlogDashboardNote = {
  note: string;
  updatedAt: string | null;
};

function isMissingTable(error: { code?: string; message?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("blog_dashboard_note") ||
    msg.includes("schema cache")
  );
}

/** Read the shared dashboard note. Returns empty note if the table is missing. */
export async function getBlogDashboardNote(): Promise<BlogDashboardNote> {
  const supa = supabaseAdmin();
  if (!supa) return { note: "", updatedAt: null };

  const { data, error } = await supa
    .from("blog_dashboard_note")
    .select("note, updated_at")
    .eq("id", BLOG_DASHBOARD_NOTE_ID)
    .maybeSingle();

  if (error) {
    if (!isMissingTable(error)) {
      console.warn("[blog-dashboard-note] fetch failed:", error.message);
    }
    return { note: "", updatedAt: null };
  }

  const row = data as { note: string; updated_at: string } | null;
  return { note: row?.note ?? "", updatedAt: row?.updated_at ?? null };
}

export type SaveBlogDashboardNoteResult =
  | { ok: true; note: BlogDashboardNote }
  | { ok: false; reason: "not_configured" | "table_missing" | "save_failed"; detail: string };

export async function saveBlogDashboardNote(note: string): Promise<SaveBlogDashboardNoteResult> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, reason: "not_configured", detail: "Supabase not configured" };

  const updatedAt = new Date().toISOString();
  const { data, error } = await supa
    .from("blog_dashboard_note")
    .upsert(
      { id: BLOG_DASHBOARD_NOTE_ID, note, updated_at: updatedAt },
      { onConflict: "id" }
    )
    .select("note, updated_at")
    .single();

  if (error) {
    if (isMissingTable(error)) {
      return {
        ok: false,
        reason: "table_missing",
        detail:
          "blog_dashboard_note table missing - POST /api/admin/migrate-blog-authoring with BALANCE_CAPTURE_SECRET",
      };
    }
    return { ok: false, reason: "save_failed", detail: error.message };
  }

  const row = data as { note: string; updated_at: string };
  return { ok: true, note: { note: row.note ?? "", updatedAt: row.updated_at ?? null } };
}
