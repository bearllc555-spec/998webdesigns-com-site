import "server-only";

import { supabaseAdmin } from "@/lib/supabase";

export const BLOG_MEDIA_BUCKET = "blog-media";

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function safeStem(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image"
  );
}

export async function uploadBlogMedia(
  file: File
): Promise<{ ok: true; url: string; path: string } | { ok: false; detail: string }> {
  if (!ALLOWED.has(file.type)) {
    return { ok: false, detail: `Unsupported type: ${file.type || "unknown"}` };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, detail: "File exceeds 10MB" };
  }

  const supa = supabaseAdmin();
  if (!supa) return { ok: false, detail: "Supabase not configured" };

  const ext = EXT[file.type] ?? "bin";
  const stem = safeStem(file.name);
  const objectPath = `${new Date().getFullYear()}/${Date.now()}-${stem}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supa.storage
    .from(BLOG_MEDIA_BUCKET)
    .upload(objectPath, bytes, { contentType: file.type, upsert: false });

  if (error) {
    if (/bucket.*not found/i.test(error.message)) {
      return {
        ok: false,
        detail:
          "blog-media bucket missing - POST /api/admin/migrate-blog-media-bucket with BALANCE_CAPTURE_SECRET",
      };
    }
    return { ok: false, detail: error.message };
  }

  const { data } = supa.storage.from(BLOG_MEDIA_BUCKET).getPublicUrl(objectPath);
  return { ok: true, url: data.publicUrl, path: objectPath };
}
