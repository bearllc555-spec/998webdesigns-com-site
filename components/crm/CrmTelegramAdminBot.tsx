"use client";

import { useState } from "react";
import { CrmTelegramShell } from "@/components/crm/telegram/CrmTelegramShell";
import { useCrmTelegramStatus } from "@/components/crm/telegram/useCrmTelegramStatus";

type PendingDelete = { step: 1 | 2 };

export function CrmTelegramAdminBot() {
  const { status, loading, message, error, setMessage, setError, applyStatus, load } =
    useCrmTelegramStatus();
  const [botToken, setBotToken] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const hasStoredBot = Boolean(status?.settings.hasStoredToken);
  const showBotCard = hasStoredBot && status?.bot && !editing;
  const showForm = editing || !hasStoredBot;

  function startEdit() {
    setEditing(true);
    setBotToken("");
    setPendingDelete(null);
    setError(null);
    setMessage(null);
  }

  function cancelEdit() {
    setEditing(false);
    setBotToken("");
    setPendingDelete(null);
  }

  async function saveBot(e: React.FormEvent) {
    e.preventDefault();
    const token = botToken.trim();
    if (!token) {
      setError("Bot token is required.");
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
      setEditing(false);
      setMessage("Bot saved.");
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

  async function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.step === 1) {
      setPendingDelete({ step: 2 });
      return;
    }

    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/crm/telegram/bot", {
        method: "DELETE",
        credentials: "include",
      });
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
      setPendingDelete(null);
      setEditing(false);
      setBotToken("");
      setMessage("Bot token removed from CRM.");
    } catch {
      setError("Could not delete bot.");
    } finally {
      setDeleting(false);
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
          {showBotCard && status.bot && (
            <section className="rounded-2xl border border-rule bg-bg p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate">bot</p>
                  <p className="mt-1 font-display text-xl font-medium text-ink">
                    {status.bot.displayName}
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    <a
                      href={status.bot.link ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      @{status.bot.username ?? status.bot.displayName}
                    </a>
                  </p>
                  {status.settings.botTokenMasked && (
                    <p className="mt-1 font-mono text-xs text-ink-soft">
                      Token {status.settings.botTokenMasked}
                    </p>
                  )}
                </div>
                {!pendingDelete && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startEdit}
                      className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:border-accent/50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ step: 1 })}
                      className="rounded-full border border-warn/40 px-3 py-1 text-xs font-medium text-warn hover:bg-warn-soft/40"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      disabled={testing || !status.configured}
                      onClick={sendTest}
                      className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:border-accent/50 disabled:opacity-60"
                    >
                      {testing ? "Sending…" : "Send Test"}
                    </button>
                  </div>
                )}
              </div>

              {pendingDelete && (
                <div className="mt-4 rounded-xl border border-warn/40 bg-warn-soft/30 p-4">
                  <p className="text-sm font-medium text-ink">
                    {pendingDelete.step === 1
                      ? "Remove the saved bot token from CRM?"
                      : "Permanently remove the bot token from CRM? Recipients stay saved."}
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
            </section>
          )}

          {showForm && (
            <section className="rounded-2xl border border-accent/30 bg-bg p-5 shadow-sm">
              <h2 className="font-display text-lg font-medium">
                {editing ? "Edit bot" : "Add bot"}
              </h2>
              <form onSubmit={saveBot} className="mt-4 grid gap-4">
                <label className="block text-sm font-medium">
                  Bot token
                  <input
                    type="password"
                    autoComplete="off"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder={
                      hasStoredBot
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
                  {hasStoredBot && (
                    <>
                      <button
                        type="button"
                        disabled={testing || !status.configured}
                        onClick={sendTest}
                        className="rounded-full border border-rule px-5 py-2 text-sm font-medium hover:border-accent/50 disabled:opacity-60"
                      >
                        {testing ? "Sending…" : "Send Test"}
                      </button>
                      {editing && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-full border border-rule px-5 py-2 text-sm hover:border-accent/50"
                        >
                          Cancel edit
                        </button>
                      )}
                    </>
                  )}
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

          {showBotCard && !showForm && (
            <p className="text-xs text-ink-soft">
              Use Edit to replace the token, or Delete to clear it from CRM (recipients are kept).
            </p>
          )}
        </div>
      )}
    </CrmTelegramShell>
  );
}
