"use client";

import { useState } from "react";
import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";
import { brandFieldClassName, brandFieldStyle } from "@/lib/demo-config/brand-field-styles";

type AestheticsCrmLoginFormProps = {
  brand: AestheticsDemoBrand;
};

export function AestheticsCrmLoginForm({ brand }: AestheticsCrmLoginFormProps) {
  const config = getDemoBrandConfigByVertical(brand);
  const fieldStyle = brandFieldStyle(config);
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
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm" style={{ color: config.palette.muted }}>
        Sign in with your email and demo password{" "}
        <strong style={{ color: config.palette.headline }}>{config.crmPassword}</strong>.
      </p>
      <div>
        <label htmlFor="crm-email" className="mb-1 block text-sm font-medium" style={{ color: config.palette.ink }}>
          Email
        </label>
        <input
          id="crm-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={brandFieldClassName}
          style={fieldStyle}
        />
      </div>
      <div>
        <label htmlFor="crm-password" className="mb-1 block text-sm font-medium" style={{ color: config.palette.ink }}>
          Password
        </label>
        <input
          id="crm-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={brandFieldClassName}
          style={fieldStyle}
        />
      </div>
      {error ? <p className="text-sm text-warn">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60"
        style={{ backgroundColor: config.palette.accent }}
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
