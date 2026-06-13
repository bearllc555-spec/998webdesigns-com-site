"use client";

import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FixedFormField, MessageFormField } from "@/components/form-field-stack";
import type { ContactPrefill } from "@/lib/contact-prefill";

export type { ContactPrefill } from "@/lib/contact-prefill";

type ContactFormState = {
  name: string;
  email: string;
  businessName: string;
  message: string;
};

type ContactModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: ContactPrefill;
  title?: string;
};

const emptyForm = (): ContactFormState => ({
  name: "",
  email: "",
  businessName: "",
  message: "",
});

function buildForm(prefill?: ContactPrefill): ContactFormState {
  return {
    ...emptyForm(),
    name: prefill?.name?.trim() ?? "",
    email: prefill?.email?.trim() ?? "",
    businessName: prefill?.businessName?.trim() ?? "",
    message: prefill?.message?.trim() ?? "",
  };
};

function ContactFormPanel({
  prefill,
  title,
  onClose,
  onSubmitted,
}: {
  prefill?: ContactPrefill;
  title: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [form, setForm] = useState(() => buildForm(prefill));
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof ContactFormState>(k: K, v: ContactFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Partial<Record<keyof ContactFormState, string>> = {};
    if (!form.name.trim()) e.name = "Your name, please.";
    if (!form.email.trim()) e.email = "Email, please.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "That doesn't look like an email.";
    if (!form.message.trim()) e.message = "Tell us what's on your mind.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          businessName: form.businessName,
          message: form.message,
        }),
      });

      const data = (await res.json()) as { error?: string; sent?: boolean };
      if (!res.ok || !data.sent) {
        throw new Error(data.error || "Failed to send message");
      }

      onSubmitted();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="text-ink-soft">
          Send a message and we&apos;ll reply by email.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        {/* Bot trap — not read into JSON; bots that POST extra fields are caught server-side */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          defaultValue=""
          className="absolute -z-10 h-0 w-0 opacity-0 pointer-events-none"
        />

        <FixedFormField
          id="contact-name"
          label="Name"
          value={form.name}
          onChange={(v) => set("name", v)}
          required
          error={errors.name}
          disabled={submitting}
          autoComplete="name"
        />

        <FixedFormField
          id="contact-company"
          label="Company"
          value={form.businessName}
          onChange={(v) => set("businessName", v)}
          optionalHint
          disabled={submitting}
          autoComplete="organization"
        />

        <FixedFormField
          id="contact-email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => set("email", v)}
          required
          error={errors.email}
          disabled={submitting}
          autoComplete="email"
        />

        <MessageFormField
          id="contact-message"
          label="Message"
          value={form.message}
          onChange={(v) => set("message", v)}
          required
          error={errors.message}
          disabled={submitting}
        />

        {submitError && (
          <p role="alert" className="text-sm text-warn">
            {submitError}
          </p>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-rule px-4 py-2 text-sm font-medium text-ink transition hover:bg-rule-soft"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </>
  );
}

export function ContactModal({
  open,
  onOpenChange,
  prefill,
  title = "Get in touch",
}: ContactModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const formKey = `${prefill?.email ?? ""}|${prefill?.name ?? ""}|${prefill?.businessName ?? ""}|${prefill?.message ?? ""}`;

  const handleClose = (val: boolean) => {
    onOpenChange(val);
    if (!val) {
      setTimeout(() => setSubmitted(false), 300);
    }
  };

  useEffect(() => {
    if (!submitted || !canvasRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const myConfetti = confetti.create(canvasRef.current, { resize: true, useWorker: false });
    const colors = ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#ffffff"];
    myConfetti({
      particleCount: 120,
      spread: 80,
      startVelocity: 30,
      origin: { x: 0.5, y: 0.6 },
      colors,
      ticks: 200,
    });
    return () => myConfetti.reset();
  }, [submitted]);

  return (
    <Dialog open={open} onOpenChange={submitted ? () => {} : handleClose}>
      <DialogContent className="w-full max-w-md border-rule bg-bg text-ink" showCloseButton={!submitted}>
        {submitted ? (
          <div className="relative flex flex-col items-center justify-center gap-4 overflow-hidden py-10 text-center">
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft">
              <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Message sent!</h2>
              <p className="mt-1 text-sm text-ink-soft">Thanks! We&apos;ll get back to you soon.</p>
            </div>
            <button
              onClick={() => handleClose(false)}
              className="mt-2 rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
            >
              Close
            </button>
          </div>
        ) : (
          open && (
            <ContactFormPanel
              key={formKey}
              prefill={prefill}
              title={title}
              onClose={() => handleClose(false)}
              onSubmitted={() => setSubmitted(true)}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
