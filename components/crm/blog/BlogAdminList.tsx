"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CrmHeader } from "@/components/crm/CrmHeader";
import { CRM_PAGE_CONTAINER } from "@/lib/crm-layout";
import {
  STATUS_BADGE,
  STATUS_LABEL,
  STATUS_ORDER,
  formatDate,
  formatDateTime,
  type BlogDashboardPost,
} from "@/components/crm/blog/blog-admin-shared";

export function BlogAdminList() {
  const [posts, setPosts] = useState<BlogDashboardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/blog", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      const data = (await res.json()) as { posts: BlogDashboardPost[]; error?: string | null };
      if (data.error) setError(data.error);
      setPosts(data.posts ?? []);
    } catch {
      setError("Could not load posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNote = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/blog/note", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { note?: { note: string; updatedAt: string | null } };
      const value = data.note?.note ?? "";
      setNote(value);
      setSavedNote(value);
      setNoteUpdatedAt(data.note?.updatedAt ?? null);
      if (value.trim()) setNoteOpen(true);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    load();
    loadNote();
  }, [load, loadNote]);

  async function saveNote() {
    setNoteSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/blog/note", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save the team note.");
        return;
      }
      const value = data.note?.note ?? note;
      setSavedNote(value);
      setNoteUpdatedAt(data.note?.updatedAt ?? new Date().toISOString());
      setNotice("Team note saved.");
    } catch {
      setError("Could not save the team note.");
    } finally {
      setNoteSaving(false);
    }
  }

  const grouped = useMemo(() => {
    const map: Record<string, BlogDashboardPost[]> = {};
    for (const status of STATUS_ORDER) map[status] = [];
    for (const p of posts) (map[p.status] ??= []).push(p);
    return map;
  }, [posts]);

  async function act(id: string, action: "publish" | "unpublish") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/crm/blog/${id}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      await load();
    } catch {
      setError("Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/crm/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Delete failed.");
        return;
      }
      await load();
    } catch {
      setError("Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImporting(true);
      setError(null);
      setNotice(null);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/crm/blog/import", {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Import failed.");
          return;
        }
        // Zip import: multiple drafts -> reload list and summarize.
        if (Array.isArray(data.imported)) {
          const failedCount = Array.isArray(data.failed) ? data.failed.length : 0;
          let msg = `Imported ${data.count} draft${data.count === 1 ? "" : "s"} from the zip.`;
          if (failedCount > 0) {
            const detail = data.failed
              .map((f: { name: string; detail: string }) => `${f.name} (${f.detail})`)
              .join("; ");
            msg += ` ${failedCount} skipped: ${detail}`;
          }
          if (data.count > 0) setNotice(msg);
          else setError(msg);
          await load();
          return;
        }
        // Single file: jump straight into the editor.
        window.location.href = `/crm/blog/${data.post.id}`;
        return;
      } catch {
        setError("Import failed.");
      } finally {
        setImporting(false);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <CrmHeader
        title="Blog"
        subtitle="Stage, schedule, publish and track Field notes"
        onRefresh={load}
        refreshDisabled={loading}
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".md,.markdown,.mdx,.txt,.zip"
              className="hidden"
              onChange={onImport}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="rounded-full border border-rule px-4 py-2 text-sm text-ink-soft hover:border-accent/50 disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import .md / .zip"}
            </button>
            <Link
              href="/crm/blog/new"
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-deep"
            >
              New post
            </Link>
          </>
        }
      />

      <main className={`${CRM_PAGE_CONTAINER} py-8`}>
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
            {notice}
          </div>
        )}

        {/* Shared team note - internal, visible to all staff on this dashboard */}
        <div className="mb-8 rounded-xl border border-rule">
          <button
            type="button"
            onClick={() => setNoteOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            aria-expanded={noteOpen}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              Team note
              <span className="text-xs font-normal text-ink-soft">
                shared - staff only
                {noteUpdatedAt ? ` - updated ${formatDateTime(noteUpdatedAt)}` : ""}
                {note.trim() ? "" : " - empty"}
              </span>
            </span>
            <span className="text-xs text-ink-soft">{noteOpen ? "Hide" : "Show"}</span>
          </button>
          {noteOpen && (
            <div className="border-t border-rule p-4">
              <textarea
                className="h-40 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-accent"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="A shared note for the whole team: priorities, what is in progress, who is handling what, anything to keep everyone on the same page."
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveNote}
                  disabled={noteSaving || note === savedNote}
                  className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-deep disabled:opacity-50"
                >
                  {noteSaving ? "Saving..." : note === savedNote ? "Saved" : "Save note"}
                </button>
                <span className="text-xs text-ink-soft">
                  Visible to all staff in the dashboard. Never published.
                </span>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-ink-soft">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-ink-soft">No posts yet. Create one or import a markdown file.</p>
        ) : (
          <div className="space-y-10">
            {STATUS_ORDER.map((status) => {
              const rows = grouped[status] ?? [];
              if (rows.length === 0) return null;
              return (
                <section key={status}>
                  <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-medium">
                    {STATUS_LABEL[status]}
                    <span className="text-sm font-normal text-ink-soft">({rows.length})</span>
                  </h2>
                  <ul className="divide-y divide-rule rounded-xl border border-rule">
                    {rows.map((post) => (
                      <li
                        key={post.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[post.status]}`}
                            >
                              {STATUS_LABEL[post.status]}
                            </span>
                            <Link
                              href={`/crm/blog/${post.id}`}
                              className="truncate font-medium text-ink hover:text-accent"
                            >
                              {post.title}
                            </Link>
                          </div>
                          <p className="mt-1 text-xs text-ink-soft">
                            {post.status === "published" && post.publishedAt
                              ? `Published ${formatDate(post.publishedAt)}`
                              : post.status === "scheduled" && post.scheduledAt
                                ? `Scheduled for ${formatDateTime(post.scheduledAt)}`
                                : "Not published"}
                            {" · "}
                            {post.viewCount} view{post.viewCount === 1 ? "" : "s"}
                            {" · /"}
                            {post.slug}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm">
                          {post.status === "published" && (
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full border border-rule px-3 py-1.5 text-ink-soft hover:border-accent/50"
                            >
                              View
                            </a>
                          )}
                          <Link
                            href={`/crm/blog/${post.id}`}
                            className="rounded-full border border-rule px-3 py-1.5 text-ink-soft hover:border-accent/50"
                          >
                            Edit
                          </Link>
                          {post.status !== "published" ? (
                            <button
                              type="button"
                              onClick={() => act(post.id, "publish")}
                              disabled={busyId === post.id}
                              className="rounded-full bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-deep disabled:opacity-50"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => act(post.id, "unpublish")}
                              disabled={busyId === post.id}
                              className="rounded-full border border-rule px-3 py-1.5 text-ink-soft hover:border-accent/50 disabled:opacity-50"
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => remove(post.id, post.title)}
                            disabled={busyId === post.id}
                            className="rounded-full border border-rule px-3 py-1.5 text-red-600 hover:border-red-400 disabled:opacity-50 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
