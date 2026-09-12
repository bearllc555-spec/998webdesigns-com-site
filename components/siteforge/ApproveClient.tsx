"use client";

import { useState } from "react";
import { formatCheckoutUsd } from "@/lib/checkout-pricing";
import { designDepositCents, designTotalCents } from "@/lib/design-payment-schedule";

type Props = {
  token: string;
  businessName: string;
  previewUrl: string | null;
  status: string;
  alreadyPaid: boolean;
};

export function ApproveClient({
  token,
  businessName,
  previewUrl,
  status,
  alreadyPaid,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deposit = designDepositCents();
  const total = designTotalCents();

  if (alreadyPaid || status === "paid" || status === "delivered") {
    return (
      <div className="space-y-4">
        <p className="text-ink/80">
          Payment received for <strong>{businessName}</strong>. We&apos;ll move your site to
          launch next.
        </p>
        {previewUrl ? (
          <a
            href={previewUrl}
            className="inline-flex text-accent underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Open mockup preview
          </a>
        ) : null}
      </div>
    );
  }

  async function onApprove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/siteforge/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.error || "Checkout failed. Please try again.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-ink/80 leading-relaxed">
        Approve the mockup for <strong>{businessName}</strong> and pay the{" "}
        {formatCheckoutUsd(deposit)} deposit ({formatCheckoutUsd(total)} total design fee).
      </p>

      {previewUrl ? (
        <p>
          <a
            href={previewUrl}
            className="inline-flex rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-bg"
            target="_blank"
            rel="noreferrer"
          >
            Review mockup
          </a>
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Redirecting to secure checkout…" : "Approve & pay deposit"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <p className="text-sm text-ink/60">
        Want tweaks first? Use the request-changes link from your email — we&apos;ll revise
        before you pay.
      </p>
    </div>
  );
}
