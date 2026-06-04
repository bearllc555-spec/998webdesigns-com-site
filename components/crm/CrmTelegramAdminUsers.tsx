"use client";

import { useState } from "react";
import { CrmTelegramShell } from "@/components/crm/telegram/CrmTelegramShell";
import { cardTitle } from "@/components/crm/telegram/types";
import { useCrmTelegramStatus } from "@/components/crm/telegram/useCrmTelegramStatus";

type TelegramRecentChat = {
  chatId: string;
  type: string;
  displayName: string;
  username: string | null;
};

type PendingDelete = {
  chatId: string;
  label: string;
  step: 1 | 2;
};

export function CrmTelegramAdminUsers() {
  const { status, loading, message, error, setMessage, setError, applyStatus, load } =
    useCrmTelegramStatus();

  const [formLabel, setFormLabel] = useState("");
  const [formChatId, setFormChatId] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [recentChats, setRecentChats] = useState<TelegramRecentChat[]>([]);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  function resetForm() {
    setFormLabel("");
    setFormChatId("");
    setEditingChatId(null);
    setRecentChats([]);
  }

  function startEdit(chatId: string, label: string, displayName: string) {
    setEditingChatId(chatId);
    setFormChatId(chatId);
    setFormLabel(label || displayName);
    setPendingDelete(null);
  }

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    const chatId = formChatId.trim();
    if (!chatId) {
      setError("Chat ID is required.");
      return;
    }
    if (!status?.settings.hasStoredToken) {
      setError("Configure the bot first.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      let res: Response;
      if (editingChatId) {
        res = await fetch(
          `/api/crm/telegram/recipients/${encodeURIComponent(editingChatId)}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId,
              label: formLabel.trim() || undefined,
            }),
          }
        );
      } else {
        res = await fetch("/api/crm/telegram", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addRecipient: { chatId, label: formLabel.trim() || undefined },
          }),
        });
      }

      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      applyStatus(data);
      resetForm();
      setMessage(editingChatId ? "User updated." : "User added.");
    } catch {
      setError("Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function discoverChats() {
    setDiscovering(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/telegram/discover", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Discover failed.");
        setRecentChats([]);
        return;
      }
      setRecentChats(data.recentChats ?? []);
      if (data.hint) setMessage(data.hint);
    } catch {
      setError("Could not discover chats.");
    } finally {
      setDiscovering(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.step === 1) {
      setPendingDelete({ ...pendingDelete, step: 2 });
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/crm/telegram/recipients/${encodeURIComponent(pendingDelete.chatId)}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Delete failed.");
        return;
      }
      applyStatus(data);
      if (editingChatId === pendingDelete.chatId) resetForm();
      setPendingDelete(null);
      setMessage("User removed.");
    } catch {
      setError("Could not delete user.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <CrmTelegramShell
      title="Users"
      subtitle={editingChatId ? "Edit recipient" : "Add or manage recipients"}
      backHref="/crm/telegram/admin"
      backLabel="Admin"
      loading={loading}
      error={error}
      message={message}
      actions={
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-rule px-4 py-2 text-sm font-medium hover:border-accent/50"
        >
          Refresh
        </button>
      }
    >
      {status && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-accent/30 bg-bg p-5 shadow-sm">
            <h2 className="font-display text-lg font-medium">
              {editingChatId ? "Edit user" : "Add user"}
            </h2>
            <form onSubmit={saveUser} className="mt-4 grid gap-4">
              <label className="block text-sm font-medium">
                Name (label)
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="your name"
                  className="mt-1 w-full rounded-xl border border-rule bg-bg px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-medium">
                Chat ID
                <input
                  type="text"
                  value={formChatId}
                  onChange={(e) => setFormChatId(e.target.value)}
                  placeholder="123456789"
                  required
                  className="mt-1 w-full rounded-xl border border-rule bg-bg px-3 py-2 font-mono text-sm"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={discovering}
                  onClick={discoverChats}
                  className="rounded-full border border-rule px-5 py-2 text-sm font-medium hover:border-accent/50 disabled:opacity-60"
                >
                  {discovering ? "Discovering…" : "Discover chats"}
                </button>
                {editingChatId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-rule px-5 py-2 text-sm hover:border-accent/50"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            {recentChats.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-rule pt-4">
                {recentChats.map((c) => (
                  <li
                    key={c.chatId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rule px-3 py-2 text-sm"
                  >
                    <span>
                      {c.displayName}
                      <span className="ml-2 font-mono text-xs text-ink-soft">{c.chatId}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormChatId(c.chatId);
                        if (!formLabel.trim()) setFormLabel(c.displayName);
                      }}
                      className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:border-accent/50"
                    >
                      Use
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-lg font-medium">All users</h2>
            {status.destinations.length === 0 && (
              <p className="mt-2 text-sm text-ink-soft">No users configured yet.</p>
            )}
            <ul className="mt-4 grid gap-4">
              {status.destinations.map((d) => {
                const title = cardTitle(d);
                const isDeleting = pendingDelete?.chatId === d.chatId;
                return (
                  <li
                    key={d.chatId}
                    className="rounded-2xl border border-rule bg-bg p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-medium">{title}</p>
                        <p className="mt-1 break-all font-mono text-xs text-ink-soft">
                          {d.chatId}
                        </p>
                      </div>
                      {!isDeleting && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              startEdit(d.chatId, d.label ?? "", d.displayName)
                            }
                            className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:border-accent/50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({ chatId: d.chatId, label: title, step: 1 })
                            }
                            className="rounded-full border border-warn/40 px-3 py-1 text-xs font-medium text-warn hover:bg-warn-soft/40"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {isDeleting && pendingDelete && (
                      <div className="mt-4 rounded-xl border border-warn/40 bg-warn-soft/30 p-4">
                        <p className="text-sm font-medium text-ink">
                          {pendingDelete.step === 1
                            ? `Remove ${pendingDelete.label} from alerts?`
                            : `Permanently delete ${pendingDelete.label}?`}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={confirmDelete}
                            className="rounded-full bg-warn px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                          >
                            {deleting
                              ? "Removing…"
                              : pendingDelete.step === 1
                                ? "Continue"
                                : "Delete permanently"}
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => setPendingDelete(null)}
                            className="rounded-full border border-rule px-4 py-2 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </CrmTelegramShell>
  );
}
