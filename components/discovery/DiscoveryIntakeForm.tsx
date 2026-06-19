"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FIXED_INPUT_CLASS,
  FixedFormField,
  MessageFormField,
} from "@/components/form-field-stack";

export function DiscoveryIntakeForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [whatYouDo, setWhatYouDo] = useState("");
  const [whoYouServe, setWhoYouServe] = useState("");
  const [projectType, setProjectType] = useState<"new" | "redesign" | "">("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing link token.");
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/discovery/intake?token=${encodeURIComponent(token)}`);
        const data = (await res.json()) as {
          ok?: boolean;
          fullName?: string;
          email?: string;
          companyName?: string;
          goal?: string;
          intakeSubmitted?: boolean;
          error?: string;
        };
        if (!res.ok) {
          setError(data.error ?? "Invalid link.");
          return;
        }
        setFullName(data.fullName ?? "");
        setEmail(data.email ?? "");
        if (data.companyName) setBusinessName(data.companyName);
        if (data.goal) setNotes(data.goal);
        if (data.intakeSubmitted) setAlreadyDone(true);
      } catch {
        setError("Could not load your session.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function submitIntake(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/discovery/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          businessName,
          industry,
          whatYouDo,
          whoYouServe,
          projectType,
          notes,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      router.push(`/book/schedule?token=${encodeURIComponent(token)}`);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-xl px-5 py-16 text-ink-soft">Loading…</p>;
  }

  if (error && !fullName) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <p className="text-warn">{error}</p>
      </div>
    );
  }

  if (alreadyDone) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 md:py-24">
        <h1 className="font-display text-3xl font-medium text-ink">Brief already received</h1>
        <p className="mt-4 text-ink-soft">
          Thanks, {fullName}. We have your project details on file.
        </p>
        <Link
          href={`/book/schedule?token=${encodeURIComponent(token)}`}
          className="mt-6 inline-block text-accent underline"
        >
          Book your call
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-16 md:py-24">
      <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">Your project brief</h1>
      <p className="mt-4 text-ink-soft">
        Hi {fullName} - tell us about the business ({email}). This takes about 3 minutes.
      </p>
      <form onSubmit={submitIntake} className="mt-8 space-y-5">
        <FixedFormField
          id="businessName"
          label="Business name"
          value={businessName}
          onChange={setBusinessName}
          required
        />
        <FixedFormField
          id="industry"
          label="Industry"
          value={industry}
          onChange={setIndustry}
          required
        />
        <MessageFormField
          id="whatYouDo"
          label="What does your business do?"
          value={whatYouDo}
          onChange={setWhatYouDo}
          required
          rows={3}
        />
        <MessageFormField
          id="whoYouServe"
          label="Who do you serve?"
          value={whoYouServe}
          onChange={setWhoYouServe}
          required
          rows={2}
        />
        <div>
          <label htmlFor="projectType" className="mb-1 block text-sm font-medium text-ink">
            Project type<span className="ml-1 text-accent">*</span>
          </label>
          <select
            id="projectType"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as "new" | "redesign")}
            className={`${FIXED_INPUT_CLASS} border-rule`}
            required
          >
            <option value="">Select…</option>
            <option value="new">Brand new site</option>
            <option value="redesign">Redesign existing site</option>
          </select>
        </div>
        <MessageFormField
          id="notes"
          label="Anything else?"
          value={notes}
          onChange={setNotes}
          rows={3}
        />
        {error && <p className="text-sm text-warn">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Continue to scheduling"}
        </button>
      </form>
    </div>
  );
}
