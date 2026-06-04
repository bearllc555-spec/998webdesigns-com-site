"use client";

import Link from "next/link";
import { useState } from "react";
import { CrmTelegramShell } from "@/components/crm/telegram/CrmTelegramShell";
import { TelegramEntityCard } from "@/components/crm/telegram/TelegramEntityCard";
import { cardTitle } from "@/components/crm/telegram/types";
import { useCrmTelegramStatus } from "@/components/crm/telegram/useCrmTelegramStatus";

export function CrmTelegramHome() {
  const { status, loading, message, error, setMessage, setError, load } = useCrmTelegramStatus();
  const [testing, setTesting] = useState(false);

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

  const destCount = status?.destinations.length ?? 0;
  const botName = status?.bot
    ? `@${status.bot.username ?? status.bot.displayName}`
    : null;

  return (
    <CrmTelegramShell
      title="Telegram"
      subtitle={
        status?.configured
          ? `${destCount} recipient${destCount === 1 ? "" : "s"} receive every alert`
          : "Open Admin to configure"
      }
      loading={loading}
      error={error}
      message={message}
      actions={
        <>
          <Link
            href="/crm/telegram/admin"
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-deep"
          >
            Admin
          </Link>
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-rule px-4 py-2 text-sm font-medium hover:border-accent/50"
          >
            Refresh
          </button>
        </>
      }
    >
      {status && (
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-lg font-medium">Bot.</h2>
            <ul className="mt-4 grid gap-4">
              <TelegramEntityCard
                kind="bot"
                title={status.bot?.displayName ?? "Not configured"}
              >
                {status.bot ? (
                  <>
                    {botName && (
                      <p>
                        <a
                          href={status.bot.link ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-accent hover:underline"
                        >
                          {botName}
                        </a>
                      </p>
                    )}
                    {status.settings.hasStoredToken && status.settings.botTokenMasked && (
                      <p className="font-mono text-xs">Token {status.settings.botTokenMasked}</p>
                    )}
                    {status.bot.link && (
                      <a
                        href={status.bot.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-accent hover:underline"
                      >
                        Open in Telegram
                      </a>
                    )}
                  </>
                ) : (
                  <p>
                    <Link href="/crm/telegram/admin/bot" className="text-accent hover:underline">
                      Configure bot in Admin
                    </Link>
                  </p>
                )}
              </TelegramEntityCard>
            </ul>
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-medium">Recipients.</h2>
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
              <p className="mt-3 text-sm text-ink-soft">{status.setupHint}</p>
            )}

            {destCount === 0 && (
              <p className="mt-3 text-sm text-ink-soft">
                No recipients yet.{" "}
                <Link href="/crm/telegram/admin/users" className="text-accent hover:underline">
                  Add users in Admin
                </Link>
                .
              </p>
            )}

            <ul className="mt-4 grid gap-4">
              {status.destinations.map((d) => (
                <TelegramEntityCard key={d.chatId} kind={d.type ?? "recipient"} title={cardTitle(d)}>
                  {d.label && d.displayName !== d.label && <p>Telegram: {d.displayName}</p>}
                  {d.username && <p>@{d.username}</p>}
                  <p className="break-all font-mono text-xs">Chat ID: {d.chatId}</p>
                  {d.link && (
                    <a
                      href={d.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-accent hover:underline"
                    >
                      Open in Telegram
                    </a>
                  )}
                </TelegramEntityCard>
              ))}
            </ul>
          </section>
        </div>
      )}
    </CrmTelegramShell>
  );
}
