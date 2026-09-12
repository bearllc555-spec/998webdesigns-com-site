"use client";

import { useState } from "react";
import { formatCheckoutUsd } from "@/lib/checkout-pricing";
import { designDepositCents, designTotalCents } from "@/lib/design-payment-schedule";

type Props = {
  token: string;
  businessName: string;
  conceptImageUrl: string | null;
  previewUrl: string | null;
  status: string;
  alreadyPaid: boolean;
};

const PAID_STATUSES = new Set([
  "paid",
  "build_queued",
  "mockup_generating",
  "mockup_ready",
  "delivered",
]);

export function ApproveClient({
  token,
  businessName,
  conceptImageUrl,
  previewUrl,
  status,
  alreadyPaid,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deposit = designDepositCents();
  const total = designTotalCents();
  const visual = conceptImageUrl || previewUrl;

  if (alreadyPaid || PAID_STATUSES.has(status)) {
    return (
      <div className="space-y-4">
        <p className="text-ink/80">
          Deposit received for <strong>{businessName}</strong>. We&apos;re building your site
          next and will email when the draft is live.
        </p>
        {visual ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visual}
            alt={`${businessName} concept`}
            className="w-full rounded-md border border-ink/10"
          />
        ) : null}
        {previewUrl && previewUrl !== conceptImageUrl ? (
          <a
            href={previewUrl}
            className="inline-flex text-accent underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Open HTML site preview
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
        Approve this concept for <strong>{businessName}</strong> and pay the{" "}
        {formatCheckoutUsd(deposit)} deposit ({formatCheckoutUsd(total)} total design fee).
        We build the real site after payment.
      </p>

      {visual ? (
        <a href={visual} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={visual}
            alt={`${businessName} website concept`}
            className="w-full rounded-md border border-ink/10"
          />
        </a>
      ) : (
        <p className="text-sm text-ink/60">Concept image is still loading — check back shortly.</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Redirecting to secure checkout…" : "Approve concept & pay deposit"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <p className="text-sm text-ink/60">
        Want tweaks first? Use the request-changes link from your email — we&apos;ll revise the
        concept before you pay.
      </p>
    </div>
  );
}
