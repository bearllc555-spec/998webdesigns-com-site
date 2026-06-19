"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { CrmHeader } from "@/components/crm/CrmHeader";
import { CRM_PAGE_CONTAINER } from "@/lib/crm-layout";
import {
  STATUS_LABEL,
  formatDate,
  formatDateTime,
  toDatetimeLocalValue,
  type BlogDashboardPost,
} from "@/components/crm/blog/blog-admin-shared";

type Props = { postId?: string };

type FormState = {
  title: string;
  slug: string;
  description: string;
  body: string;
  tagsInput: string;
  author: string;
  featured: boolean;
  ogImageUrl: string;
  staffNotes: string;
};

const EMPTY: FormState = {
  title: "",
  slug: "",
  description: "",
  body: "",
  tagsInput: "",
  author: "998 web designs",
  featured: false,
  ogImageUrl: "",
  staffNotes: "",
};

function fromPost(post: BlogDashboardPost): FormState {
  return {
    title: post.title,
    slug: post.slug,
    description: post.description,
    body: post.body,
    tagsInput: post.tags.join(", "),
    author: post.author,
    featured: post.featured,
    ogImageUrl: post.ogImageUrl ?? "",
    staffNotes: post.staffNotes ?? "",
  };
}

/** Pre-fill the schedule input from a scheduled post (local datetime); else blank. */
function scheduleLocalFromPost(post: BlogDashboardPost): string {
  if (post.status === "scheduled" && post.scheduledAt) {
    return toDatetimeLocalValue(new Date(post.scheduledAt));
  }
  return "";
}

export function BlogEditor({ postId }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [meta, setMeta] = useState<BlogDashboardPost | null>(null);
  const [id, setId] = useState<string | undefined>(postId);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/blog/${postId}`, { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (res.status === 404) {
        setError("Post not found.");
        return;
      }
      const data = (await res.json()) as { post: BlogDashboardPost };
      setMeta(data.post);
      setForm(fromPost(data.post));
      setScheduleAt(scheduleLocalFromPost(data.post));
      setId(data.post.id);
      if (data.post.staffNotes?.trim()) setNotesOpen(true);
    } catch {
      setError("Could not load post.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function payload() {
    return {
      title: form.title,
      slug: form.slug || undefined,
      description: form.description,
      body: form.body,
      tags: form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      author: form.author,
      featured: form.featured,
      ogImageUrl: form.ogImageUrl || null,
      staffNotes: form.staffNotes,
    };
  }

  /** Persist current fields. Returns the post id (creating it if new). */
  async function save(): Promise<string | null> {
    if (!form.title.trim()) {
      setError("Title is required.");
      return null;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(id ? `/api/crm/blog/${id}` : "/api/crm/blog", {
        method: id ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Save failed.");
        return null;
      }
      const post = data.post as BlogDashboardPost;
      setMeta(post);
      setForm(fromPost(post));
      if (!id) {
        setId(post.id);
        window.history.replaceState(null, "", `/crm/blog/${post.id}`);
      }
      setMessage("Saved.");
      return post.id;
    } catch {
      setError("Save failed.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function status(action: "publish" | "unpublish" | "archive" | "schedule", scheduledAt?: string) {
    const savedId = await save();
    if (!savedId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/blog/${savedId}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, scheduledAt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      const post = data.post as BlogDashboardPost;
      setMeta(post);
      setForm(fromPost(post));
      setScheduleAt(scheduleLocalFromPost(post));
      setMessage(
        action === "publish"
          ? "Published. Date auto-recorded."
          : action === "schedule"
            ? "Scheduled."
            : action === "unpublish"
              ? "Moved back to draft."
              : "Archived."
      );
    } catch {
      setError("Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function publishWithSchedule() {
    if (!scheduleAt) {
      setError("Pick a date and time to schedule.");
      return;
    }
    const iso = new Date(scheduleAt).toISOString();
    await status("schedule", iso);
  }

  async function remove() {
    if (!id) {
      window.location.href = "/crm/blog";
      return;
    }
    if (!window.confirm(`Delete "${form.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/crm/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Delete failed.");
        return;
      }
      window.location.href = "/crm/blog";
    } catch {
      setError("Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  function insertAtCursor(snippet: string) {
    const el = bodyRef.current;
    if (!el) {
      set("body", `${form.body}\n${snippet}\n`);
      return;
    }
    const start = el.selectionStart ?? form.body.length;
    const end = el.selectionEnd ?? form.body.length;
    const next = `${form.body.slice(0, start)}${snippet}${form.body.slice(end)}`;
    set("body", next);
  }

  async function onMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/crm/blog/media", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Upload failed.");
          return;
        }
        const alt = file.name.replace(/\.[^.]+$/, "");
        insertAtCursor(`\n![${alt}](${data.url})\n`);
        setMessage("Image uploaded and inserted.");
      } catch {
        setError("Upload failed.");
      } finally {
        setUploading(false);
      }
    }
    if (mediaRef.current) mediaRef.current.value = "";
  }

  const statusLine = meta
    ? meta.status === "published" && meta.publishedAt
      ? `${STATUS_LABEL[meta.status]} · ${formatDate(meta.publishedAt)} · ${meta.viewCount} views`
      : meta.status === "scheduled" && meta.scheduledAt
        ? `${STATUS_LABEL[meta.status]} for ${formatDateTime(meta.scheduledAt)}`
        : STATUS_LABEL[meta.status]
    : "New draft";

  // Schedule button state: green "Scheduled" when the input matches the saved
  // schedule; "Reschedule" once the date is edited; "Schedule" otherwise.
  const savedScheduleLocal =
    meta && meta.status === "scheduled" && meta.scheduledAt
      ? toDatetimeLocalValue(new Date(meta.scheduledAt))
      : "";
  const isScheduledSynced = Boolean(savedScheduleLocal) && scheduleAt === savedScheduleLocal;
  const scheduleLabel = busy
    ? "..."
    : isScheduledSynced
      ? "Scheduled"
      : meta?.status === "scheduled"
        ? "Reschedule"
        : "Schedule";

  const inputClass =
    "w-full rounded-lg border border-rule bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent";

  return (
    <>
      <CrmHeader
        title={id ? "Edit post" : "New post"}
        subtitle={statusLine}
        secondaryNavLink={{ href: "/crm/blog", label: "All posts" }}
        messagesHref="/crm/blog"
        actions={
          <button
            type="button"
            onClick={save}
            disabled={saving || busy}
            className="rounded-full border border-rule px-4 py-2 text-sm text-ink-soft hover:border-accent/50 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
        }
      />

      <main className={`${CRM_PAGE_CONTAINER} py-8`}>
        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-ink-soft">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Title
                </span>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Post title"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Slug {id ? "" : "(auto from title if blank)"}
                </span>
                <input
                  className={inputClass}
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="my-post-slug"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                Description (SEO / card)
              </span>
              <input
                className={inputClass}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="One sentence, ~160 chars."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Tags (comma-separated)
                </span>
                <input
                  className={inputClass}
                  value={form.tagsInput}
                  onChange={(e) => set("tagsInput", e.target.value)}
                  placeholder="websites, local-seo"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Author
                </span>
                <input
                  className={inputClass}
                  value={form.author}
                  onChange={(e) => set("author", e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="h-4 w-4 rounded border-rule text-accent"
                />
                <span className="text-sm text-ink">Featured</span>
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                OG image URL (optional)
              </span>
              <input
                className={inputClass}
                value={form.ogImageUrl}
                onChange={(e) => set("ogImageUrl", e.target.value)}
                placeholder="https://..."
              />
            </label>

            {/* Staff notes (internal only - never shown on the public site) */}
            <div className="rounded-xl border border-rule">
              <button
                type="button"
                onClick={() => setNotesOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                aria-expanded={notesOpen}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  Staff notes
                  <span className="text-xs font-normal text-ink-soft">
                    internal only{form.staffNotes.trim() ? "" : " - empty"}
                  </span>
                </span>
                <span className="text-xs text-ink-soft">{notesOpen ? "Hide" : "Show"}</span>
              </button>
              {notesOpen && (
                <div className="border-t border-rule p-4">
                  <textarea
                    className="h-40 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-accent"
                    value={form.staffNotes}
                    onChange={(e) => set("staffNotes", e.target.value)}
                    placeholder="Notes for the team: status, who is working on it, follow-ups, sources, anything to keep everyone on the same page."
                  />
                  <p className="mt-2 text-xs text-ink-soft">
                    Visible to staff in this editor only. Saved with the post; never published.
                  </p>
                </div>
              )}
            </div>

            {/* Editor + preview */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Markdown
                  </span>
                  <span>
                    <input
                      ref={mediaRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={onMedia}
                    />
                    <button
                      type="button"
                      onClick={() => mediaRef.current?.click()}
                      disabled={uploading}
                      className="rounded-full border border-rule px-3 py-1 text-xs text-ink-soft hover:border-accent/50 disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : "Upload image"}
                    </button>
                  </span>
                </div>
                <textarea
                  ref={bodyRef}
                  className="h-[28rem] w-full rounded-lg border border-rule bg-bg px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
                  value={form.body}
                  onChange={(e) => set("body", e.target.value)}
                  placeholder="Write in Markdown..."
                />
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Preview
                </span>
                <div className="h-[28rem] overflow-y-auto rounded-lg border border-rule bg-bg px-4 py-3">
                  {form.body.trim() ? (
                    <BlogPostBody content={form.body} />
                  ) : (
                    <p className="text-sm text-ink-soft">Preview appears here.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Lifecycle actions */}
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-rule bg-rule-soft/40 p-4">
              <button
                type="button"
                onClick={() => status("publish")}
                disabled={saving || busy}
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-deep disabled:opacity-50"
              >
                Publish now
              </button>

              <div className="flex flex-col gap-1">
                <div className="flex items-end gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                      Schedule for
                    </span>
                    <input
                      type="datetime-local"
                      className={inputClass}
                      value={scheduleAt}
                      min={toDatetimeLocalValue(new Date())}
                      onChange={(e) => setScheduleAt(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={publishWithSchedule}
                    disabled={saving || busy || !scheduleAt || isScheduledSynced}
                    className={
                      isScheduledSynced
                        ? "rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-100"
                        : "rounded-full border border-rule px-4 py-2 text-sm text-ink-soft hover:border-accent/50 disabled:opacity-50"
                    }
                  >
                    {scheduleLabel}
                  </button>
                </div>
                {savedScheduleLocal && meta?.scheduledAt && (
                  <span className="text-xs text-ink-soft">
                    Scheduled for {formatDateTime(meta.scheduledAt)}. Change the date and click
                    Reschedule to update.
                  </span>
                )}
              </div>

              {meta && meta.status !== "draft" && (
                <button
                  type="button"
                  onClick={() => status("unpublish")}
                  disabled={saving || busy}
                  className="rounded-full border border-rule px-4 py-2 text-sm text-ink-soft hover:border-accent/50 disabled:opacity-50"
                >
                  Move to draft
                </button>
              )}
              {meta && meta.status !== "archived" && (
                <button
                  type="button"
                  onClick={() => status("archive")}
                  disabled={saving || busy}
                  className="rounded-full border border-rule px-4 py-2 text-sm text-ink-soft hover:border-accent/50 disabled:opacity-50"
                >
                  Archive
                </button>
              )}

              <div className="ml-auto flex items-center gap-3">
                {meta?.status === "published" && (
                  <a
                    href={`/blog/${meta.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:text-accent-deep"
                  >
                    View live
                  </a>
                )}
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  className="rounded-full border border-rule px-4 py-2 text-sm text-red-600 hover:border-red-400 disabled:opacity-50 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>

            <p className="text-xs text-ink-soft">
              The publish date is set automatically when you publish (or when a scheduled post goes
              live) and recorded in the dashboard. <Link href="/crm/blog" className="text-accent hover:text-accent-deep">Back to all posts</Link>
            </p>
          </div>
        )}
      </main>
    </>
  );
}
