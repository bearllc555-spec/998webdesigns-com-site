import { supabaseAdmin } from "@/lib/supabase";

export type ContactSubmissionInsert = {
  name: string;
  email: string;
  business_name: string | null;
  message: string;
  submitted_at: string;
  ip: string | null;
};

export type ContactInsertResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "not_configured" | "table_missing" | "insert_failed"; detail: string };

export async function insertContactSubmission(
  row: ContactSubmissionInsert
): Promise<ContactInsertResult> {
  const supa = supabaseAdmin();
  if (!supa) {
    return {
      ok: false,
      reason: "not_configured",
      detail: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  try {
    const { data, error } = await supa
      .from("contact_submissions")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      if (isMissingContactTable(error)) {
        console.error(
          "[contact] contact_submissions table missing - run supabase/contact-submissions.sql in Supabase SQL editor"
        );
        return { ok: false, reason: "table_missing", detail: error.message };
      }
      console.warn("[contact] contact_submissions insert failed:", error.message);
      return { ok: false, reason: "insert_failed", detail: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[contact] Supabase client error:", detail);
    return { ok: false, reason: "insert_failed", detail };
  }
}

export async function deleteContactSubmission(id: string): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return false;

  const { error } = await supa.from("contact_submissions").delete().eq("id", id);
  if (error) {
    console.warn("[contact] contact_submissions delete failed:", error.message);
    return false;
  }
  return true;
}

function isMissingContactTable(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? "";
  const msg = error.message ?? "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    /contact_submissions/i.test(msg) ||
    /schema cache/i.test(msg)
  );
}
