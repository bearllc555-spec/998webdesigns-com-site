"use client";

import { useState, type FormEvent } from "react";

type Props = {
  token: string;
  businessName: string;
  previewUrl: string | null;
  status: string;
};

export function ChangesClient({ token, businessName, previewUrl, status }: Props) {
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(status === "changes_requested");
  const [error, setError] = useState<string | null>(null);

  if (status === "paid" || status === "delivered") {
    return (
      <p className="text-ink/80">
        This project is already paid. Email us if you need post-payment revisions.
      </p>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-ink/80">
          Got it — we recorded your change request for <strong>{businessName}</strong>.
          We&apos;ll revise the mockup and email you again.
        </p>
        {previewUrl ? (
          <a
            href={previewUrl}
            className="inline-flex text-accent underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Open current preview
          </a>
        ) : null}
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/siteforge/changes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, feedback }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not save. Please try again.");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="text-ink/80 leading-relaxed">
        Tell us what to change on the <strong>{businessName}</strong> mockup. We&apos;ll
        revise and send a fresh preview.
      </p>

      {previewUrl ? (
        <a
          href={previewUrl}
          className="inline-flex text-sm font-medium text-accent underline underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          Open current mockup
        </a>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Requested changes</span>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={6}
          required
          minLength={8}
          maxLength={4000}
          className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink outline-none focus:border-accent"
          placeholder="e.g. Swap the hero photo, make the phone number larger, add a services section…"
        />
      </label>

      <button
        type="submit"
        disabled={busy || feedback.trim().length < 8}
        className="inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-semibold text-bg disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send change request"}
      </button>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
