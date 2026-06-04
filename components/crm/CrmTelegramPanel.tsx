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

function mergeChatId(current: string, chatId: string): string {
  const parts = current
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.includes(chatId)) return current;
  return parts.length ? `${current}, ${chatId}` : chatId;
}

export function CrmTelegramPanel() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [botToken, setBotToken] = useState("");
  const [chatIds, setChatIds] = useState("");
  const [chatLabels, setChatLabels] = useState("");
  const [recentChats, setRecentChats] = useState<TelegramRecentChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyStatus = useCallback((data: TelegramStatus) => {
    setStatus(data);
    setChatIds(data.settings.chatIds);
    setChatLabels(data.settings.chatLabels);
    setBotToken("");
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

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: { chatIds: string; chatLabels: string; botToken?: string } = {
        chatIds,
        chatLabels,
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
        setError(data.error ?? "Could not save settings.");
        return;
      }
      applyStatus(data as TelegramStatus);
      setMessage("Settings saved. Alerts will use this configuration.");
    } catch {
      setError("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function discoverChats() {
    setDiscovering(true);
    setError(null);
    setMessage(null);
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
      else if ((data.recentChats?.length ?? 0) > 0) {
        setMessage(`Found ${data.recentChats.length} chat(s). Click Add to include them.`);
      }
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
      setMessage(`Test sent to ${data.sentTo} destination(s). Check Telegram.`);
    } catch {
      setError("Could not send test.");
    } finally {
      setTesting(false);
    }
  }

  const destCount = status?.destinations.length ?? 0;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title="Telegram"
        subtitle={
          status?.configured
            ? `Alerts forward to ${destCount} destination${destCount === 1 ? "" : "s"} simultaneously`
            : "Configure your bot below"
        }
        actions={
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-rule px-4 py-2 text-sm font-medium hover:border-accent/50"
          >
            Refresh
          </button>
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
            <section className="rounded-2xl border border-accent/30 bg-bg p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium">Configure bot</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Saved in Supabase (CRM settings). Vercel env vars are only used until you save
                here.
              </p>
              {status.settings.storedInDatabase && status.settings.updatedAt && (
                <p className="mt-2 text-xs text-ink-soft">
                  Last saved{" "}
                  {new Date(status.settings.updatedAt).toLocaleString("en-US", {
                    timeZone: "America/New_York",
                  })}{" "}
                  ET · source: {status.settings.source}
                </p>
              )}

              <form onSubmit={saveSettings} className="mt-5 grid gap-4">
                <label className="block text-sm font-medium">
                  Bot token
                  <input
                    type="password"
                    autoComplete="off"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder={
                      status.settings.hasStoredToken
                        ? `Saved ${status.settings.botTokenMasked ?? ""} — paste to replace`
                        : "Paste token from @BotFather"
                    }
                    className="mt-1 w-full rounded-xl border border-rule bg-bg px-3 py-2 text-sm"
                  />
                </label>

                <label className="block text-sm font-medium">
                  Chat IDs (comma-separated)
                  <textarea
                    value={chatIds}
                    onChange={(e) => setChatIds(e.target.value)}
                    rows={3}
                    placeholder="123456789, -1009876543210"
                    className="mt-1 w-full rounded-xl border border-rule bg-bg px-3 py-2 font-mono text-sm"
                  />
                </label>

                <label className="block text-sm font-medium">
                  Labels (optional, same order)
                  <input
                    type="text"
                    value={chatLabels}
                    onChange={(e) => setChatLabels(e.target.value)}
                    placeholder="Anthony, Ops group"
                    className="mt-1 w-full rounded-xl border border-rule bg-bg px-3 py-2 text-sm"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save settings"}
                  </button>
                  <button
                    type="button"
                    disabled={discovering}
                    onClick={discoverChats}
                    className="rounded-full border border-rule px-5 py-2 text-sm font-medium hover:border-accent/50 disabled:opacity-60"
                  >
                    {discovering ? "Discovering…" : "Discover recent chats"}
                  </button>
                  <button
                    type="button"
                    disabled={testing || !status.configured}
                    onClick={sendTest}
                    className="rounded-full border border-rule px-5 py-2 text-sm font-medium hover:border-accent/50 disabled:opacity-60"
                  >
                    {testing ? "Sending…" : "Send test alert"}
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
                        onClick={() => setChatIds((prev) => mergeChatId(prev, c.chatId))}
                        className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:border-accent/50"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 text-xs text-ink-soft">
                1. Create a bot with{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  @BotFather
                </a>
                . 2. Message your bot (Start). 3. Discover chats or paste chat ids. 4. Save, then
                send a test.
              </p>
            </section>

            <section className="rounded-2xl border border-rule bg-bg p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium">Bot</h2>
              {status.bot ? (
                <p className="mt-3 text-sm">
                  <a
                    href={status.bot.link ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent hover:underline"
                  >
                    @{status.bot.username ?? status.bot.displayName}
                  </a>
                </p>
              ) : (
                <p className="mt-3 text-sm text-warn">Save a valid bot token to connect.</p>
              )}
            </section>

            <section className="rounded-2xl border border-rule bg-bg p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium">Forward to</h2>
              {!status.configured && status.setupHint && (
                <p className="mt-3 text-sm text-ink-soft">{status.setupHint}</p>
              )}
              <ul className="mt-4 space-y-3">
                {status.destinations.map((d) => (
                  <li key={d.chatId} className="rounded-xl border border-rule px-4 py-3">
                    <p className="font-medium">
                      {d.label ? (
                        <>
                          {d.label}
                          <span className="ml-2 font-normal text-ink-soft">({d.displayName})</span>
                        </>
                      ) : (
                        d.displayName
                      )}
                    </p>
                    <p className="mt-1 break-all text-xs text-ink-soft">Chat ID: {d.chatId}</p>
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
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
