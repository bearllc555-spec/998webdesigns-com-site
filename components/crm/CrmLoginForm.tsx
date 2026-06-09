"use client";

import { useState } from "react";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/crm/login")) {
    return "/crm";
  }
  return raw;
}

type CrmLoginFormProps = {
  /** Used when the URL has no `?next=` param (e.g. demo CRM at a fixed path). */
  redirectTo?: string;
};

export function CrmLoginForm({ redirectTo = "/crm" }: CrmLoginFormProps) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        setError("Invalid secret.");
        return;
      }
      const next = safeNextPath(
        new URLSearchParams(window.location.search).get("next") ?? redirectTo
      );
      window.location.href = next;
    } catch {
      setError("Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-4">
      <label className="block text-sm font-medium text-ink">
        Admin secret
        <input
          type="password"
          autoComplete="current-password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="mt-2 w-full rounded-xl border border-rule bg-bg px-4 py-3 text-sm"
          placeholder="Paste CRM_ADMIN_SECRET"
          required
        />
      </label>
      {error && <p className="text-sm text-warn">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-accent px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
