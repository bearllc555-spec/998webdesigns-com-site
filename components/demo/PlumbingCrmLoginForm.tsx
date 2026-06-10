"use client";

import { useState } from "react";
import { FIXED_INPUT_CLASS } from "@/components/form-field-stack";
import { clearPlumbingDemoCrmSessionStore } from "@/lib/plumbing-demo-crm-session-store";

export function PlumbingCrmLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/plumbers/crm/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Invalid email or password.");
        return;
      }
      clearPlumbingDemoCrmSessionStore();
      window.location.href = "/demo/plumbers/crm";
    } catch {
      setError("Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <label className="block text-sm font-medium text-ink">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-2 ${FIXED_INPUT_CLASS}`}
          placeholder="you@company.com"
          required
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-2 ${FIXED_INPUT_CLASS}`}
          placeholder="Demo password"
          required
        />
      </label>
      {error && <p className="text-sm text-warn">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-accent px-4 py-3 text-sm font-medium text-on-accent disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
