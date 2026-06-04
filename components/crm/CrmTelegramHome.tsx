"use client";

import Link from "next/link";
import { CrmTelegramShell } from "@/components/crm/telegram/CrmTelegramShell";
import { cardTitle } from "@/components/crm/telegram/types";
import { useCrmTelegramStatus } from "@/components/crm/telegram/useCrmTelegramStatus";
import { useState } from "react";

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
            </p>
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
            <p className="text-sm text-ink-soft">
              No recipients yet.{" "}
              <Link href="/crm/telegram/admin/users" className="text-accent hover:underline">
                Add users in Admin
              </Link>
              .
            </p>
          )}

          <ul className="grid gap-4">
            {status.destinations.map((d) => (
              <li
                key={d.chatId}
                className="rounded-2xl border border-rule bg-bg p-5 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-slate">
                  {d.type ?? "recipient"}
                </p>
                <p className="mt-1 font-display text-xl font-medium text-ink">{cardTitle(d)}</p>
                {d.label && d.displayName !== d.label && (
                  <p className="mt-1 text-sm text-ink-soft">Telegram: {d.displayName}</p>
                )}
                {d.username && <p className="mt-1 text-sm text-ink-soft">@{d.username}</p>}
                <p className="mt-2 break-all font-mono text-xs text-ink-soft">Chat ID: {d.chatId}</p>
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
        </div>
      )}
    </CrmTelegramShell>
  );
}
