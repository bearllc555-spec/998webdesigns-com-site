"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FIXED_INPUT_CLASS,
  FixedFormField,
  MessageFormField,
} from "@/components/form-field-stack";

type Step = "details" | "verify" | "done";

export function BookDiscoveryForm() {
  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [prospectId, setProspectId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [website, setWebsite] = useState("");

  async function startDiscovery(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/discovery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, goal, smsConsent, website }),
      });
      const data = (await res.json()) as { ok?: boolean; prospectId?: string; error?: string };
      if (!res.ok || !data.prospectId) {
        setError(data.error ?? "Could not start. Try again.");
        return;
      }
      setProspectId(data.prospectId);
      setStep("verify");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/discovery/verify-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid code.");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 md:py-24">
        <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">Check your email</h1>
        <p className="mt-4 text-ink-soft">
          We sent a secure link to <strong>{email}</strong>. Open it to complete your project brief,
          then book a call. The link also confirms your email.
        </p>
        <p className="mt-6 text-sm text-slate">
          Prefer to skip the call?{" "}
          <Link href="/start" className="text-accent underline hover:text-accent-deep">
            Start checkout now
          </Link>
        </p>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 md:py-24">
        <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">Enter your code</h1>
        <p className="mt-4 text-ink-soft">We texted a 6-digit code to {phone}.</p>
        <form onSubmit={verifyCode} className="mt-8 space-y-5">
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium text-ink">
              Verification code<span className="ml-1 text-accent">*</span>
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${FIXED_INPUT_CLASS} border-rule`}
              required
            />
          </div>
          {error && <p className="text-sm text-warn">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-16 md:py-24">
      <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">Book a discovery call</h1>
      <p className="mt-4 text-ink-soft">
        Not ready to pay yet? Tell us what you need. We verify your phone by text, email you a brief,
        then hop on a call before sending a personalized checkout link.
      </p>
      <form onSubmit={startDiscovery} className="mt-8 space-y-5">
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />
        <FixedFormField
          id="fullName"
          label="Full name"
          value={fullName}
          onChange={setFullName}
          required
        />
        <FixedFormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />
        <FixedFormField
          id="phone"
          label="Mobile phone"
          value={phone}
          onChange={setPhone}
          required
        />
        <MessageFormField
          id="goal"
          label="What are you trying to accomplish?"
          value={goal}
          onChange={setGoal}
          rows={3}
        />
        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={smsConsent}
            onChange={(e) => setSmsConsent(e.target.checked)}
            className="mt-1"
            required
          />
          <span>
            I agree to receive SMS messages from 998 web designs, including a one-time verification
            code and occasional transactional messages related to my website project. Message
            frequency varies. Message and data rates may apply. Reply <strong>STOP</strong> to opt
            out. Reply <strong>HELP</strong> for help. See our{" "}
            <Link href="/legal/privacy" className="text-accent underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/legal/terms" className="text-accent underline">
              Terms of Service
            </Link>
            .
          </span>
        </label>
        {error && <p className="text-sm text-warn">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Sending code…" : "Text me a code"}
        </button>
      </form>
    </div>
  );
}
