"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

type ContactPref = "email" | "phone" | "text";
type Redesign = "new" | "redesign";

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
  // Honeypot
  website: string;
};

const initial: FormState = {
  fullName: "", businessName: "", email: "", phone: "", contactPref: "email",
  industry: "", yearsInBusiness: "", existingUrl: "", whatYouDo: "", whoYouServe: "",
  projectType: "", visitorActions: [], pages: [], pagesOther: "", brandAssets: [],
  inspirationUrls: "", avoidances: "",
  startDate: "", hostingChoice: "", notes: "",
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
    }
    if (step === 1) {
      if (!form.industry.trim()) e.industry = "Tell us your industry.";
      if (!form.whatYouDo.trim()) e.whatYouDo = "One sentence about what you do.";
      if (!form.whoYouServe.trim()) e.whoYouServe = "Who's your customer?";
    }
    if (step === 2) {
      if (!form.projectType) e.projectType = "Pick one.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
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
      const supabase = getSupabaseClient();
      if (!supabase) {
        setSubmitError(
          "Connection to our database is not available. Please email hello@998webdesigns.com with your details."
        );
        setSubmitting(false);
        return;
      }
      // Static-export build: write directly to Supabase from the browser.
      // The publishable (anon) key is designed for this. Insert is the only allowed op via RLS.
      const { website: _hp, ...payload } = form;
      const { error } = await supabase.from("wd_leads").insert({
        email: payload.email,
        business_name: payload.businessName,
        full_name: payload.fullName,
        payload,
        submitted_at: new Date().toISOString(),
      });
      if (error) {
        console.warn("[leads] supabase insert failed:", error.message, payload);
        setSubmitError(
          "We couldn't save your brief. Please try again, or email hello@998webdesigns.com and we'll pick it up manually."
        );
        setSubmitting(false);
        return;
      }
      router.push("/thanks");
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
            Tell us about your business.
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
              <Field label="Best way to reach you" className="md:col-span-2">
                <div className="flex gap-2">
                  {(["email", "phone", "text"] as const).map((opt) => (
                    <label
                      key={opt}
                      className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium capitalize transition ${
                        form.contactPref === opt
                          ? "border-ink bg-ink text-bg"
                          : "border-rule bg-bg text-ink-soft hover:border-ink-soft"
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
                  placeholder="www.yourwebsite.com"
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
              <Field label="Is this a redesign or a new design?" required error={errors.projectType}>
                <div className="flex gap-2">
                  {([
                    ["new", "Brand-new design"],
                    ["redesign", "Redesign existing site"],
                  ] as const).map(([val, label]) => (
                    <label
                      key={val}
                      className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        form.projectType === val
                          ? "border-ink bg-ink text-bg"
                          : "border-rule bg-bg text-ink-soft hover:border-ink-soft"
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

              <Field label="Pages/Sections you need">
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
              <Field label="Preferred start date">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className={inputCls()}
                />
              </Field>

              <Field label="Hosting choice">
                <p className="mb-3 text-sm leading-relaxed text-ink-soft">
                  First month of hosting is $0 with every site. Starting month two: $98/month or
                  $1,799 lifetime — or decide later.
                </p>
                <div className="grid gap-2 md:grid-cols-3">
                  {([
                    ["lifetime", "Lifetime $1,799"],
                    ["monthly", "Month-to-month $98"],
                    ["later", "Decide later"],
                  ] as const).map(([val, label]) => (
                    <label
                      key={val}
                      className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        form.hostingChoice === val
                          ? "border-ink bg-ink text-bg"
                          : "border-rule bg-bg text-ink-soft hover:border-ink-soft"
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
                onClick={next}
                className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-bg transition hover:bg-ink-soft"
              >
                Continue &rarr;
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-bg shadow-sm transition hover:bg-accent-deep disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send it — I'll get my deposit invoice"}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate">
          We&rsquo;ll send the $499 deposit invoice the moment you submit. No deposit charges until you act on the invoice.
        </p>
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
                ? "border-ink bg-ink text-bg"
                : "border-rule bg-bg text-ink-soft hover:border-ink-soft"
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
