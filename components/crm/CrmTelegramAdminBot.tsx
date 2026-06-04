"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CrmTelegramShell } from "@/components/crm/telegram/CrmTelegramShell";
import { useCrmTelegramStatus } from "@/components/crm/telegram/useCrmTelegramStatus";

export function CrmTelegramAdminBot() {
  const router = useRouter();
  const { status, loading, message, error, setMessage, setError, applyStatus } =
    useCrmTelegramStatus();
  const [botToken, setBotToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function saveBot(e: React.FormEvent) {
    e.preventDefault();
    const token = botToken.trim();
    if (!token && !status?.settings.hasStoredToken) {
      setError("Bot token is required.");
      return;
    }
    if (!token) {
      router.push("/crm/telegram/admin");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/crm/telegram/bot", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: token }),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not save bot.");
        return;
      }
      applyStatus(data);
      setBotToken("");
      setMessage("Bot saved.");
      router.push("/crm/telegram/admin");
    } catch {
      setError("Could not save bot.");
    } finally {
      setSaving(false);
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

  return (
    <CrmTelegramShell
      title="Configure Bot"
      subtitle="Token from @BotFather"
      backHref="/crm/telegram/admin"
      backLabel="Admin"
      loading={loading}
      error={error}
      message={message}
    >
      {status && (
        <section className="rounded-2xl border border-rule bg-bg p-5 shadow-sm">
          {status.bot && (
            <p className="mb-4 text-sm">
              Connected:{" "}
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

          <form onSubmit={saveBot} className="grid gap-4">
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
                disabled={testing || !status.configured}
                onClick={sendTest}
                className="rounded-full border border-rule px-5 py-2 text-sm font-medium hover:border-accent/50 disabled:opacity-60"
              >
                {testing ? "Sending…" : "Send test alert"}
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-ink-soft">
            Create a bot at{" "}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              @BotFather
            </a>
            , then paste the token here.
          </p>
        </section>
      )}
    </CrmTelegramShell>
  );
}
