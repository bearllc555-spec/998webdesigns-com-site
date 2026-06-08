"use client";

import { useEffect, useState } from "react";
import { checkoutDueTodayCents, formatCheckoutUsd } from "@/lib/checkout-pricing";
import { designPaymentScheduleLines } from "@/lib/design-payment-schedule";
import { hostingChoiceLabel } from "@/lib/hosting";
import type { DiscoveryCloseDraft } from "@/lib/discovery-types";

type ClosePayload = {
  fullName: string;
  businessName: string;
  closeDraft: DiscoveryCloseDraft;
};

export function CloseCheckoutClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClosePayload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing checkout token.");
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/discovery/close-checkout?token=${encodeURIComponent(token)}`);
        const json = (await res.json()) as ClosePayload & { error?: string };
        if (!res.ok) {
          setError(json.error ?? "Invalid link.");
          return;
        }
        setData(json);
      } catch {
        setError("Could not load checkout.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function payNow() {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/discovery/close-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !json.checkoutUrl) {
        setError(json.error ?? "Checkout failed.");
        return;
      }
      window.location.href = json.checkoutUrl;
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-ink-soft">Loading your checkout…</p>;
  if (error && !data) return <p className="text-warn">{error}</p>;
  if (!data) return null;

  const paymentOption = data.closeDraft.paymentOption ?? "deposit";
  const due = formatCheckoutUsd(
    checkoutDueTodayCents(
      data.closeDraft.hostingChoice,
      data.closeDraft.paymentChannel,
      data.closeDraft.promoCode,
      paymentOption
    )
  );
  const scheduleLines =
    paymentOption === "deposit"
      ? designPaymentScheduleLines(data.closeDraft.promoCode, data.closeDraft.hostingChoice)
      : [];

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">Your checkout</h1>
      <p className="mt-4 text-ink-soft">
        Hi {data.fullName} — here is the package we configured for{" "}
        <strong>{data.businessName}</strong> on our call.
      </p>
      <ul className="mt-8 space-y-2 text-sm text-ink-soft">
        <li>
          <strong className="text-ink">Hosting:</strong>{" "}
          {hostingChoiceLabel(data.closeDraft.hostingChoice)}
        </li>
        <li>
          <strong className="text-ink">Payment method:</strong>{" "}
          {data.closeDraft.paymentChannel === "ach" ? "Bank (ACH)" : "Card"}
        </li>
        <li>
          <strong className="text-ink">Design payment:</strong>{" "}
          {paymentOption === "deposit" ? "50% deposit today" : "Pay in full today"}
        </li>
        {data.closeDraft.addons.length > 0 && (
          <li>
            <strong className="text-ink">Add-ons:</strong> {data.closeDraft.addons.join(", ")}
          </li>
        )}
        {data.closeDraft.promoCode && (
          <li>
            <strong className="text-ink">Promo:</strong> {data.closeDraft.promoCode}
          </li>
        )}
        <li>
          <strong className="text-ink">Due today:</strong> {due}
        </li>
        {scheduleLines.length > 0 && (
          <li>
            <strong className="text-ink">Balance schedule:</strong>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {scheduleLines.slice(1).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </li>
        )}
      </ul>
      {error && <p className="mt-4 text-sm text-warn">{error}</p>}
      <button
        type="button"
        onClick={payNow}
        disabled={busy}
        className="mt-8 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Opening Stripe…" : "Continue to secure payment"}
      </button>
    </div>
  );
}
