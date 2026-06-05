"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FixedFormField } from "@/components/form-field-stack";

const STATUS_MESSAGES: Record<string, string> = {
  sent: "If we find an active month-to-month hosting account for that email, we sent a secure link. Check your inbox (and spam).",
  done: "You returned from Stripe. Changes may take a minute to show in our system.",
  missing: "That link was incomplete. Request a new one below.",
  expired: "That link expired. Enter your email to get a fresh one.",
  ineligible: "We could not find an active month-to-month hosting account for that link.",
  stripe: "Stripe could not open the billing portal. Try again or email hello@998webdesigns.com.",
};

export function HostingManageForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const banner = useMemo(() => {
    if (sent) return STATUS_MESSAGES.sent;
    const portal = searchParams.get("portal");
    const err = searchParams.get("error");
    if (portal === "done") return STATUS_MESSAGES.done;
    if (err && STATUS_MESSAGES[err]) return STATUS_MESSAGES[err];
    return null;
  }, [searchParams, sent]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("That does not look like an email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/hosting/portal/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, website }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again or email hello@998webdesigns.com.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
          Hosting billing
        </p>
        <div className="mx-auto max-w-xl">
          <h1 className="mt-4 font-display text-3xl font-medium leading-tight md:text-4xl">
            manage month-to-month hosting.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Enter the email on your 998 account. We will send a one-time link to Stripe&apos;s
            secure billing portal — update your card, view invoices, or cancel hosting (effective
            at the end of your current billing period).
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            Lifetime hosting clients have no recurring subscription to manage. Questions?{" "}
            <a href="mailto:hello@998webdesigns.com" className="text-accent underline-offset-2 hover:underline">
              hello@998webdesigns.com
            </a>
          </p>

          {banner && (
            <p
              role="status"
              className="mt-8 rounded-xl border border-rule bg-rule-soft/40 px-4 py-3 text-sm leading-relaxed text-ink"
            >
              {banner}
            </p>
          )}

          <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-rule bg-bg p-6 md:p-8">
            <FixedFormField
              id="hosting-email"
              label="Email on your account"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
              error={error ?? undefined}
              disabled={submitting}
            />

            <div className="sr-only" aria-hidden="true">
              <label htmlFor="hosting-website">Website</label>
              <input
                id="hosting-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
            >
              {submitting ? "Sending link…" : "Email me a secure link"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
