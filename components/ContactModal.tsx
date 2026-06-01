"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ContactFormState = {
  name: string;
  email: string;
  businessName: string;
  message: string;
  website: string;
};

type ContactModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const [form, setForm] = useState<ContactFormState>({
    name: "",
    email: "",
    businessName: "",
    message: "",
    website: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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

      setForm({ name: "", email: "", businessName: "", message: "", website: "" });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (val: boolean) => {
    onOpenChange(val);
    if (!val) setTimeout(() => setSubmitted(false), 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md bg-white">
        {submitted ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
              <DialogTitle>Get in touch</DialogTitle>
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
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
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
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
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
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
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
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  disabled={submitting}
                />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              </div>

              {submitError && <p className="text-sm text-red-500">{submitError}</p>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-ink border border-rule rounded-lg hover:bg-bg transition"
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

