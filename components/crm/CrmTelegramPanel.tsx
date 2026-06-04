"use client";

import { useCallback, useEffect, useState } from "react";
import { CrmHeader } from "@/components/crm/CrmHeader";

type TelegramDestination = {
  chatId: string;
  label: string | null;
  type: string | null;
  displayName: string;
  username: string | null;
  link: string | null;
};

type TelegramSettings = {
  source: string;
  storedInDatabase: boolean;
  hasStoredToken: boolean;
  botTokenMasked: string | null;
  chatIds: string;
  chatLabels: string;
  updatedAt: string | null;
};

type TelegramRecentChat = {
  chatId: string;
  type: string;
  displayName: string;
  username: string | null;
};

type TelegramStatus = {
  configured: boolean;
  settings: TelegramSettings;
  bot: { username: string | null; displayName: string; link: string | null } | null;
  destinations: TelegramDestination[];
  setupHint: string | null;
};

type PendingDelete = {
  chatId: string;
  label: string;
  step: 1 | 2;
};

function cardTitle(d: TelegramDestination): string {
  return d.label?.trim() || d.displayName;
}

export function CrmTelegramPanel() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newChatId, setNewChatId] = useState("");
  const [recentChats, setRecentChats] = useState<TelegramRecentChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyStatus = useCallback((data: TelegramStatus) => {
    setStatus(data);
    setBotToken("");
    setNewLabel("");
    setNewChatId("");
    setRecentChats([]);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/crm/telegram", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      applyStatus((await res.json()) as TelegramStatus);
    } catch {
      setError("Could not load Telegram settings.");
    } finally {
      setLoading(false);
    }
  }, [applyStatus]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveNewRecipient(e: React.FormEvent) {
    e.preventDefault();
    const chatId = newChatId.trim();
    if (!chatId) {
      setError("Chat ID is required.");
      return;
    }
    if (!status?.settings.hasStoredToken && !botToken.trim()) {
      setError("Bot token is required before adding the first recipient.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: {
        addRecipient: { chatId: string; label?: string };
        botToken?: string;
      } = {
        addRecipient: { chatId, label: newLabel.trim() || undefined },
      };
      if (botToken.trim()) payload.botToken = botToken.trim();

      const res = await fetch("/api/crm/telegram", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      applyStatus(data as TelegramStatus);
      setAdminOpen(false);
      setMessage("Recipient saved.");
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
        body: JSON.stringify(botToken.trim() ? { botToken: botToken.trim() } : {}),
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

  async function sendTest() {
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/crm/telegram/test", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Test failed.");
        return;
      }
      setMessage(`Test sent to ${data.sentTo} destination(s).`);
    } catch {
      setError("Could not send test.");
    } finally {
      setTesting(false);
    }
  }

  async function confirmDeleteRecipient() {
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
      applyStatus(data as TelegramStatus);
      setPendingDelete(null);
      setMessage("Recipient removed.");
    } catch {
      setError("Could not delete recipient.");
    } finally {
      setDeleting(false);
    }
  }

  const destCount = status?.destinations.length ?? 0;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title="Telegram"
        subtitle={
          status?.configured
            ? `${destCount} recipient${destCount === 1 ? "" : "s"} receive every alert`
            : "Add recipients in Admin"
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setPendingDelete(null);
                setAdminOpen((o) => !o);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                adminOpen
                  ? "bg-accent text-white"
                  : "border border-rule hover:border-accent/50"
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={load}
              className="rounded-full border border-rule px-4 py-2 text-sm font-medium hover:border-accent/50"
            >
              Refresh
            </button>
          </>
        }
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 pb-24 md:px-8">
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}
        {error && (
          <p className="mb-4 rounded-xl border border-warn/40 bg-warn-soft/30 px-4 py-3 text-sm text-warn">
            {error}
          </p>
        )}
        {message && !error && (
          <p className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-ink">
            {message}
          </p>
        )}

        {!loading && status && (
          <div className="space-y-6">
            {status.bot && (
              <p className="text-sm text-ink-soft">
                Bot:{" "}
                <a
                  href={status.bot.link ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  @{status.bot.username ?? status.bot.displayName}
                </a>
                {status.settings.hasStoredToken && status.settings.botTokenMasked && (
                  <span className="ml-2 text-xs">· token {status.settings.botTokenMasked}</span>
                )}
              </p>
            )}

            {adminOpen && (
              <section className="rounded-2xl border border-accent/40 bg-bg p-5 shadow-md">
                <h2 className="font-display text-lg font-medium">Admin configuration</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  Add a recipient, then Save. This panel closes automatically.
                </p>

                <form onSubmit={saveNewRecipient} className="mt-5 grid gap-4">
                  <label className="block text-sm font-medium">
                    Bot token
                    <input
                      type="password"
                      autoComplete="off"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder={
                        status.settings.hasStoredToken
                          ? `Saved ${status.settings.botTokenMasked ?? ""} — paste only to replace`
                          : "Paste token from @BotFather"
                      }
                      className="mt-1 w-full rounded-xl border border-rule bg-bg px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    Name (label)
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Anthony"
                      className="mt-1 w-full rounded-xl border border-rule bg-bg px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    Chat ID
                    <input
                      type="text"
                      value={newChatId}
                      onChange={(e) => setNewChatId(e.target.value)}
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
                    <button
                      type="button"
                      onClick={() => setAdminOpen(false)}
                      className="rounded-full border border-rule px-5 py-2 text-sm hover:border-accent/50"
                    >
                      Cancel
                    </button>
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
                            setNewChatId(c.chatId);
                            if (!newLabel.trim()) setNewLabel(c.displayName);
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
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-medium">Recipients</h2>
              <button
                type="button"
                disabled={testing || !status.configured}
                onClick={sendTest}
                className="rounded-full border border-rule px-4 py-2 text-sm font-medium hover:border-accent/50 disabled:opacity-60"
              >
                {testing ? "Sending…" : "Send test alert"}
              </button>
            </div>

            {!status.configured && status.setupHint && (
              <p className="text-sm text-ink-soft">{status.setupHint}</p>
            )}

            {destCount === 0 && (
              <p className="text-sm text-ink-soft">No recipients yet. Click Admin to add one.</p>
            )}

            <ul className="grid gap-4 sm:grid-cols-1">
              {status.destinations.map((d) => {
                const isDeleting =
                  pendingDelete?.chatId === d.chatId;
                const title = cardTitle(d);

                return (
                  <li
                    key={d.chatId}
                    className="rounded-2xl border border-rule bg-bg p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate">
                          {d.type ?? "recipient"}
                        </p>
                        <p className="mt-1 font-display text-xl font-medium text-ink">{title}</p>
                        {d.label && d.displayName !== d.label && (
                          <p className="mt-1 text-sm text-ink-soft">Telegram: {d.displayName}</p>
                        )}
                        {d.username && (
                          <p className="mt-1 text-sm text-ink-soft">@{d.username}</p>
                        )}
                        <p className="mt-2 break-all font-mono text-xs text-ink-soft">
                          Chat ID: {d.chatId}
                        </p>
                        {d.link && (
                          <a
                            href={d.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm text-accent hover:underline"
                          >
                            Open in Telegram
                          </a>
                        )}
                      </div>
                      {!isDeleting && (
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDelete({
                              chatId: d.chatId,
                              label: title,
                              step: 1,
                            })
                          }
                          className="shrink-0 rounded-full border border-warn/40 px-3 py-1 text-xs font-medium text-warn hover:bg-warn-soft/40"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {isDeleting && pendingDelete && (
                      <div className="mt-4 rounded-xl border border-warn/40 bg-warn-soft/30 p-4">
                        {pendingDelete.step === 1 ? (
                          <p className="text-sm font-medium text-ink">
                            Remove <span className="text-ink">{pendingDelete.label}</span> from
                            alerts?
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-warn">
                            Final confirmation — remove {pendingDelete.label} permanently?
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={confirmDeleteRecipient}
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
          </div>
        )}
      </main>
    </div>
  );
}
