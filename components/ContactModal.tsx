"use client";

import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ContactFormState = {
  name: string;
  email: string;
  businessName: string;
  message: string;
  website: string;
};

export type ContactPrefill = {
  name?: string;
  email?: string;
  businessName?: string;
  message?: string;
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
  website: "",
});

export function ContactModal({
  open,
  onOpenChange,
  prefill,
  title = "Get in touch",
}: ContactModalProps) {
  const [form, setForm] = useState<ContactFormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setForm(emptyForm());
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (val: boolean) => {
    onOpenChange(val);
    if (!val) {
      setTimeout(() => {
        setSubmitted(false);
        setForm(emptyForm());
      }, 300);
    }
  };

  useEffect(() => {
    if (!open) return;
    setForm({
      ...emptyForm(),
      name: prefill?.name?.trim() ?? "",
      email: prefill?.email?.trim() ?? "",
      businessName: prefill?.businessName?.trim() ?? "",
      message: prefill?.message?.trim() ?? "",
    });
    setErrors({});
    setSubmitError(null);
  }, [open, prefill?.name, prefill?.email, prefill?.businessName, prefill?.message]);

  useEffect(() => {
    if (!submitted || !canvasRef.current) return;
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
          <div className="relative flex flex-col items-center justify-center gap-4 py-10 text-center overflow-hidden">
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
              className="mt-2 rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90 transition"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <input type="hidden" value={form.website} onChange={(e) => set("website", e.target.value)} />

              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-ink mb-1">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg border border-rule bg-bg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={submitting}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-ink mb-1">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="w-full rounded-lg border border-rule bg-bg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={submitting}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="contact-business" className="block text-sm font-medium text-ink mb-1">
                  Business name <span className="text-slate">(optional)</span>
                </label>
                <input
                  id="contact-business"
                  type="text"
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  className="w-full rounded-lg border border-rule bg-bg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-ink mb-1">Message</label>
                <textarea
                  id="contact-message"
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-rule bg-bg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={submitting}
                />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              </div>

              {submitError && <p className="text-sm text-red-500">{submitError}</p>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="flex-1 rounded-lg border border-rule px-4 py-2 text-sm font-medium text-ink transition hover:bg-rule-soft"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

