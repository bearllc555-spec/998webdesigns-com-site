"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ContactPref = "email" | "phone" | "text" | "";
type Redesign = "new" | "redesign";

type PaymentOption = "deposit" | "full";

type FormState = {
  // Step 1
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  contactPref: ContactPref;
  // Step 2
  industry: string;
  yearsInBusiness: string;
  existingUrl: string;
  whatYouDo: string;
  whoYouServe: string;
  // Step 3
  projectType: Redesign | "";
  visitorActions: string[];
  pages: string[];
  pagesOther: string;
  brandAssets: string[];
  inspirationUrls: string;
  avoidances: string;
  // Step 4
  startDate: string;
  hostingChoice: "lifetime" | "monthly" | "later" | "";
  notes: string;
  paymentOption: PaymentOption;
  // Honeypot
  website: string;
};

const initial: FormState = {
  fullName: "", businessName: "", email: "", phone: "", contactPref: "",
  industry: "", yearsInBusiness: "", existingUrl: "", whatYouDo: "", whoYouServe: "",
  projectType: "", visitorActions: [], pages: [], pagesOther: "", brandAssets: [],
  inspirationUrls: "", avoidances: "",
  startDate: "", hostingChoice: "", notes: "", paymentOption: "deposit",
  website: "",
};

const STEP_LABELS = ["About you", "Your business", "The project", "Logistics"];

const ACTIONS = ["Call", "Book", "Buy", "Request a quote", "Learn", "Other"];
const PAGES = ["Home", "About", "Services", "Portfolio", "Pricing", "Blog", "Contact"];
const ASSETS = ["Logo", "Photos", "Brand colors", "Existing copy"];

export function LeadForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggle = (k: "visitorActions" | "pages" | "brandAssets", v: string) => {
    setForm((f) => {
      const has = f[k].includes(v);
      return { ...f, [k]: has ? f[k].filter((x) => x !== v) : [...f[k], v] };
    });
  };

  const validateStep = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (step === 0) {
      if (!form.fullName.trim()) e.fullName = "Your name, please.";
      if (!form.businessName.trim()) e.businessName = "Business name, please.";
      if (!form.email.trim()) e.email = "Email, please.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = "That doesn't look like an email.";
      if (!form.contactPref) e.contactPref = "Please select one.";
    }
    if (step === 1) {
      if (!form.industry.trim()) e.industry = "Tell us your industry.";
      if (!form.whatYouDo.trim()) e.whatYouDo = "One sentence about what you do.";
      if (!form.whoYouServe.trim()) e.whoYouServe = "Who's your customer?";
    }
    if (step === 2) {
      if (!form.projectType) e.projectType = "Pick one.";
    }
    if (step === 3) {
      if (!form.hostingChoice) e.hostingChoice = "Pick a hosting preference.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, 3));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    if (form.website) return; // honeypot tripped — silently no-op
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Submit failed (${res.status})`);
      const data = await res.json();
      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        router.push("/thanks");
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Try again, or email hello@998webdesigns.com."
      );
      setSubmitting(false);
    }
  };

  return (
    <section id="start" className="border-b border-rule bg-rule-soft/60">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Start your site
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight md:text-5xl">
            tell us about your business.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Detailed by design. The better the brief, the better the site. Four short steps.
          </p>
        </div>

        {/* Progress */}
        <ol className="mt-12 grid grid-cols-4 gap-2" aria-label="Form progress">
          {STEP_LABELS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="flex flex-col gap-2">
                <div
                  className={`h-1.5 rounded-full ${done || active ? "bg-accent" : "bg-rule"}`}
                  aria-current={active ? "step" : undefined}
                />
                <span
                  className={`text-xs font-medium uppercase tracking-wider ${
                    active ? "text-ink" : "text-slate"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")} {label}
                </span>
              </li>
            );
          })}
        </ol>

        <form
          onSubmit={submit}
          className="mt-10 rounded-2xl border border-rule bg-bg p-6 shadow-sm md:p-8"
          noValidate
        >
          {/* Honeypot — hidden from real users */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -z-10 h-0 w-0 opacity-0"
          />

          {step === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full name" required error={errors.fullName}>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  autoComplete="name"
                  className={inputCls(errors.fullName)}
                />
              </Field>
              <Field label="Business name" required error={errors.businessName}>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  autoComplete="organization"
                  className={inputCls(errors.businessName)}
                />
              </Field>
              <Field label="Email" required error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  autoComplete="email"
                  className={inputCls(errors.email)}
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  autoComplete="tel"
                  className={inputCls()}
                />
              </Field>
              <Field label="Best way to reach you (select one)" className="md:col-span-2" error={errors.contactPref}>
                <div className="flex gap-2">
                  {(["email", "phone", "text"] as const).map((opt) => (
                    <label
                      key={opt}
                      className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium capitalize transition ${
                        form.contactPref === opt
                          ? "border-accent bg-accent text-on-accent"
                          : "border-rule bg-bg text-ink-soft hover:border-accent/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="contactPref"
                        value={opt}
                        checked={form.contactPref === opt}
                        onChange={() => set("contactPref", opt)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Industry" required error={errors.industry}>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => set("industry", e.target.value)}
                  placeholder="e.g. plumbing, dental, retail"
                  className={inputCls(errors.industry)}
                />
              </Field>
              <Field label="Years in business">
                <input
                  type="text"
                  value={form.yearsInBusiness}
                  onChange={(e) => set("yearsInBusiness", e.target.value)}
                  placeholder="e.g. 3"
                  className={inputCls()}
                />
              </Field>
              <Field label="Existing website URL (if any)" className="md:col-span-2">
                <input
                  type="url"
                  value={form.existingUrl}
                  onChange={(e) => set("existingUrl", e.target.value)}
                  placeholder="www."
                  className={inputCls()}
                />
              </Field>
              <Field label="One sentence: what does your business do?" required error={errors.whatYouDo} className="md:col-span-2">
                <textarea
                  rows={2}
                  value={form.whatYouDo}
                  onChange={(e) => set("whatYouDo", e.target.value)}
                  className={inputCls(errors.whatYouDo)}
                />
              </Field>
              <Field label="Who is your customer?" required error={errors.whoYouServe} className="md:col-span-2">
                <textarea
                  rows={2}
                  value={form.whoYouServe}
                  onChange={(e) => set("whoYouServe", e.target.value)}
                  className={inputCls(errors.whoYouServe)}
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6">
              <Field label="Is this a redesign or a new design? (select one)" required error={errors.projectType}>
                <div className="flex gap-2">
                  {([
                    ["new", "Brand-new design"],
                    ["redesign", "Redesign existing site"],
                  ] as const).map(([val, label]) => (
                    <label
                      key={val}
                      className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        form.projectType === val
                          ? "border-accent bg-accent text-on-accent"
                          : "border-rule bg-bg text-ink-soft hover:border-accent/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="projectType"
                        value={val}
                        checked={form.projectType === val}
                        onChange={() => set("projectType", val)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="What do you want visitors to do on the site?">
                <CheckGroup options={ACTIONS} value={form.visitorActions} onToggle={(v) => toggle("visitorActions", v)} />
              </Field>

              <Field label="Pages you need">
                <CheckGroup options={PAGES} value={form.pages} onToggle={(v) => toggle("pages", v)} />
                <input
                  type="text"
                  value={form.pagesOther}
                  onChange={(e) => set("pagesOther", e.target.value)}
                  placeholder="Other pages, comma separated"
                  className={`${inputCls()} mt-3`}
                />
              </Field>

              <Field label="Brand assets you have">
                <CheckGroup options={ASSETS} value={form.brandAssets} onToggle={(v) => toggle("brandAssets", v)} />
                <p className="mt-2 text-xs text-slate">
                  We&rsquo;ll email you a secure upload link after you submit.
                </p>
              </Field>

              <Field label="Three websites you like the look of">
                <textarea
                  rows={3}
                  value={form.inspirationUrls}
                  onChange={(e) => set("inspirationUrls", e.target.value)}
                  placeholder={"www.\nwww.\nwww."}
                  className={inputCls()}
                />
              </Field>

              <Field label="Anything you specifically don't want?">
                <textarea
                  rows={2}
                  value={form.avoidances}
                  onChange={(e) => set("avoidances", e.target.value)}
                  className={inputCls()}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-5">
              <Field label="Payment option (select one)">
                <div className="grid gap-2 md:grid-cols-2">
                  <label
                    className={`cursor-pointer rounded-xl border px-4 py-4 transition ${
                      form.paymentOption === "deposit"
                        ? "border-accent bg-accent text-on-accent"
                        : "border-rule bg-bg text-ink-soft hover:border-accent/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      value="deposit"
                      checked={form.paymentOption === "deposit"}
                      onChange={() => set("paymentOption", "deposit")}
                      className="sr-only"
                    />
                    <span className="block text-sm font-medium">$499 Deposit</span>
                    <span className={`block text-xs mt-1 ${form.paymentOption === "deposit" ? "text-on-accent/70" : "text-slate"}`}>
                      $499 balance held on your card for 7 days
                    </span>
                  </label>
                  <label
                    className={`cursor-pointer rounded-xl border px-4 py-4 transition ${
                      form.paymentOption === "full"
                        ? "border-accent bg-accent text-on-accent"
                        : "border-rule bg-bg text-ink-soft hover:border-accent/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      value="full"
                      checked={form.paymentOption === "full"}
                      onChange={() => set("paymentOption", "full")}
                      className="sr-only"
                    />
                    <span className="block text-sm font-medium">$998 Pay in Full</span>
                    <span className={`block text-xs mt-1 ${form.paymentOption === "full" ? "text-on-accent/70" : "text-slate"}`}>
                      No balance due — you&apos;re all set
                    </span>
                  </label>
                </div>
              </Field>

              <Field label="Preferred start date">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className={inputCls()}
                />
              </Field>

              <Field label="Hosting preference (select one)" required error={errors.hostingChoice}>
                <div className="grid gap-2 md:grid-cols-3">
                  {([
                    ["lifetime", "Ten Year $998"],
                    ["monthly", "Month-to-month $98"],
                    ["later", "Decide later"],
                  ] as const).map(([val, label]) => (
                    <label
                      key={val}
                      className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        form.hostingChoice === val
                          ? "border-accent bg-accent text-on-accent"
                          : "border-rule bg-bg text-ink-soft hover:border-accent/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="hostingChoice"
                        value={val}
                        checked={form.hostingChoice === val}
                        onChange={() => set("hostingChoice", val)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Anything else we should know?">
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className={inputCls()}
                />
              </Field>
            </div>
          )}

          {submitError && (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-rule bg-rule-soft p-3 text-sm text-ink"
            >
              {submitError}
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-rule pt-6 md:flex-row md:items-center">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0 || submitting}
              className="rounded-full border border-rule px-5 py-2.5 text-sm font-medium text-ink-soft transition hover:border-ink-soft hover:text-ink disabled:opacity-30"
            >
              &larr; Back
            </button>

            {step < 3 ? (
                <button
                type="button"
                onClick={(e) => next(e)}
                className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:bg-accent-deep"
              >
                Continue &rarr;
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:bg-accent-deep disabled:opacity-60"
              >
                {submitting ? "Redirecting to payment..." : form.paymentOption === "full" ? "Continue to pay $998" : "Continue to pay $499 deposit"}
              </button>
            )}
          </div>
        </form>

        {step === 3 && (
          <p className="mt-6 text-center text-xs text-slate">
            You&rsquo;ll be redirected to Stripe to complete payment securely.
            {form.paymentOption === "deposit" &&
              " We'll place a 7-day hold on your card for the $499 balance, captured upon site approval."}
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */

function Field({
  label, children, required, error, className = "",
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wider text-slate">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </span>
      {children}
      {error && <span className="text-xs text-warn">{error}</span>}
    </label>
  );
}

function CheckGroup({
  options, value, onToggle,
}: {
  options: string[];
  value: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            aria-pressed={on}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              on
                ? "border-accent bg-accent text-on-accent"
                : "border-rule bg-bg text-ink-soft hover:border-accent/50"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function inputCls(error?: string) {
  return [
    "w-full rounded-xl border bg-bg px-4 py-3 text-base text-ink",
    "placeholder:text-slate transition focus:outline-none focus:ring-2 focus:ring-accent/30",
    error ? "border-warn" : "border-rule focus:border-ink-soft",
  ].join(" ");
}
