"use client";

import { useState } from "react";

type Props = {
  prospectId: string;
  intakeComplete: boolean;
};

export function CrmDiscoveryClosePanel({ prospectId, intakeComplete }: Props) {
  const [hostingChoice, setHostingChoice] = useState<"lifetime" | "monthly">("lifetime");
  const [paymentChannel, setPaymentChannel] = useState<"card" | "ach">("card");
  const [promoCode, setPromoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function sendCloseLink() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/discovery/close-invite", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          hostingChoice,
          paymentChannel,
          promoCode,
          addons: [],
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Failed to send.");
        return;
      }
      setMessage("Close link emailed.");
    } catch {
      setMessage("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (!intakeComplete) {
    return (
      <p className="text-sm text-ink-soft">Intake not complete — wait for the brief before sending a close link.</p>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-rule bg-bg p-4">
      <p className="text-sm font-medium text-ink">Send payment link</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-ink-soft">
          Hosting
          <select
            value={hostingChoice}
            onChange={(e) => setHostingChoice(e.target.value as "lifetime" | "monthly")}
            className="mt-1 w-full rounded border border-rule bg-bg px-2 py-1.5 text-ink"
          >
            <option value="lifetime">Lifetime ($2,996 day 31)</option>
            <option value="monthly">Monthly ($198/mo)</option>
          </select>
        </label>
        <label className="text-sm text-ink-soft">
          Payment channel
          <select
            value={paymentChannel}
            onChange={(e) => setPaymentChannel(e.target.value as "card" | "ach")}
            className="mt-1 w-full rounded border border-rule bg-bg px-2 py-1.5 text-ink"
          >
            <option value="card">Card</option>
            <option value="ach">ACH</option>
          </select>
        </label>
        <label className="text-sm text-ink-soft sm:col-span-2">
          Promo code (optional)
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="mt-1 w-full rounded border border-rule bg-bg px-2 py-1.5 text-ink"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={sendCloseLink}
        disabled={busy}
        className="mt-3 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Sending…" : "Email close link"}
      </button>
      {message && <p className="mt-2 text-sm text-ink-soft">{message}</p>}
    </div>
  );
}
