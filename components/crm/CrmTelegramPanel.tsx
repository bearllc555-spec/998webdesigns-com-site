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

type TelegramStatus = {
  configured: boolean;
  chatIdCount: number;
  labels: string[];
  bot: { username: string | null; displayName: string; link: string | null } | null;
  destinations: TelegramDestination[];
  setupHint: string | null;
};

export function CrmTelegramPanel() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/telegram", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      setStatus((await res.json()) as TelegramStatus);
    } catch {
      setError("Could not load Telegram settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const destCount = status?.destinations.length ?? 0;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title="Telegram"
        subtitle={
          status?.configured
            ? `Alerts forward to ${destCount} destination${destCount === 1 ? "" : "s"} simultaneously`
            : "Not fully configured"
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
        {error && <p className="text-sm text-warn">{error}</p>}

        {!loading && status && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-rule bg-bg p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium">Bot</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Lead, payment, and contact alerts are sent through this bot.
              </p>
              {status.bot ? (
                <p className="mt-3 text-sm">
                  {status.bot.link ? (
                    <a
                      href={status.bot.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      @{status.bot.username ?? status.bot.displayName}
                    </a>
                  ) : (
                    <span className="font-medium">{status.bot.displayName}</span>
                  )}
                </p>
              ) : (
                <p className="mt-3 text-sm text-warn">Bot token missing or invalid on server.</p>
              )}
            </section>

            <section className="rounded-2xl border border-rule bg-bg p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium">Forward to</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Every CRM alert is delivered to each destination below at the same time.
              </p>

              {!status.configured && status.setupHint && (
                <p className="mt-4 rounded-xl border border-warn/40 bg-warn-soft/30 p-4 text-sm text-ink">
                  {status.setupHint}
                </p>
              )}

              {status.destinations.length === 0 && status.configured && (
                <p className="mt-4 text-sm text-ink-soft">No chat ids resolved.</p>
              )}

              <ul className="mt-4 space-y-3">
                {status.destinations.map((d) => (
                  <li
                    key={d.chatId}
                    className="rounded-xl border border-rule px-4 py-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium">
                        {d.label ? (
                          <>
                            {d.label}
                            <span className="ml-2 font-normal text-ink-soft">
                              ({d.displayName})
                            </span>
                          </>
                        ) : (
                          d.displayName
                        )}
                      </p>
                      {d.type && (
                        <span className="text-xs uppercase tracking-wider text-slate">
                          {d.type}
                        </span>
                      )}
                    </div>
                    {d.username && (
                      <p className="mt-1 text-sm text-ink-soft">@{d.username}</p>
                    )}
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

            <section className="rounded-2xl border border-rule bg-bg p-5 text-sm text-ink-soft">
              <h2 className="font-display text-lg font-medium text-ink">Add another account</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                <li>Message the bot from the new Telegram account (or add the bot to a group).</li>
                <li>
                  Copy that chat id (via @userinfobot or bot getUpdates) and append it to{" "}
                  <code className="rounded bg-rule-soft px-1 text-xs">TELEGRAM_CHAT_ID</code> on
                  Vercel, comma-separated.
                </li>
                <li>
                  Optional: set matching names in{" "}
                  <code className="rounded bg-rule-soft px-1 text-xs">TELEGRAM_CHAT_LABELS</code>{" "}
                  (same order, comma-separated).
                </li>
                <li>Redeploy, then refresh this page.</li>
              </ol>
              <p className="mt-4">
                Example:{" "}
                <code className="block mt-1 break-all rounded bg-rule-soft px-2 py-1 text-xs">
                  TELEGRAM_CHAT_ID=123456789,-1009876543210
                </code>
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
