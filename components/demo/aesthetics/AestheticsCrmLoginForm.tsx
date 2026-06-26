"use client";

import { useState } from "react";
import { FIXED_INPUT_CLASS } from "@/components/form-field-stack";
import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";

type AestheticsCrmLoginFormProps = {
  brand: AestheticsDemoBrand;
};

export function AestheticsCrmLoginForm({ brand }: AestheticsCrmLoginFormProps) {
  const config = getDemoBrandConfigByVertical(brand);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/demo/${brand === "clinical" ? "clinical" : "wellness"}/crm/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Sign in failed.");
        return;
      }
      window.location.href = config.crmRoute;
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
      <p className="text-sm text-ink-soft">
        Sign in with your email and demo password <strong>{config.crmPassword}</strong>.
      </p>
      <div>
        <label htmlFor="crm-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="crm-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIXED_INPUT_CLASS}
        />
      </div>
      <div>
        <label htmlFor="crm-password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="crm-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={FIXED_INPUT_CLASS}
        />
      </div>
      {error && <p className="text-sm text-warn">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-on-accent disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
