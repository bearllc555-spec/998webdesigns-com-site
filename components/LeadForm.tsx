"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GROWTH_PACK_ID,
  getSelectedAddons,
  hasGrowthPack,
  isAddonVisuallySelected,
  isGrowthPackMember,
} from "@/lib/addons";
import { checkoutDueTodayCents, formatCheckoutUsd } from "@/lib/checkout-pricing";
import type { PaymentChannel } from "@/lib/validate-lead";
import { FixedFormField } from "@/components/form-field-stack";

type ContactPref = "email" | "phone" | "text" | "";
type Redesign = "new" | "redesign";

type PaymentOption = "full";

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
  hostingChoice: "ten_year" | "monthly" | "later" | "";
  notes: string;
  paymentOption: PaymentOption;
  paymentChannel: PaymentChannel;
  addons: string[];
  // Honeypot
  website: string;
};

const initial: FormState = {
  fullName: "", businessName: "", email: "", phone: "", contactPref: "",
  industry: "", yearsInBusiness: "", existingUrl: "", whatYouDo: "", whoYouServe: "",
  projectType: "", visitorActions: [], pages: [], pagesOther: "", brandAssets: [],
  inspirationUrls: "", avoidances: "",
  startDate: "", hostingChoice: "", notes: "", paymentOption: "full",
  paymentChannel: "card",
  addons: [],
  website: "",
};

const STEP_LABELS = ["About you", "Your business", "The project", "Add-ons", "Logistics"];

const ADDON_OPTIONS = [
  { id: "addon-chatbot", value: "ai-chatbot", label: "AI Chatbot", pricing: "$299 setup · $79/mo" },
  {
    id: "addon-receptionist",
    value: "ai-receptionist",
    label: "AI Receptionist",
    pricing: "$399 setup · $149/mo",
  },
  { id: "addon-social", value: "social-media", label: "Social Media Management", pricing: "$199 setup · $299/mo" },
  { id: "addon-email-sms", value: "email-sms", label: "Email & SMS", pricing: "$149 setup · $149/mo" },
  { id: "addon-blog", value: "blog-writing", label: "Blog Writing & Local Posts", pricing: "$199 setup · $199/mo" },
  { id: "addon-seo", value: "hyper-local-seo", label: "Hyper-Local SEO", pricing: "$299 setup · $249/mo" },
  { id: "addon-gmb", value: "google-profile", label: "Google Profile Optimization", pricing: "$149 setup · $79/mo" },
  { id: "addon-booking", value: "booking-calendar", label: "Booking Calendar", pricing: "$99 setup · $29/mo" },
] as const;

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

  const syncAddonsFromStorage = () => {
    setForm((prev) => ({ ...prev, addons: getSelectedAddons() }));
  };

  const goToStep = (target: number) => {
    if (target === 3) syncAddonsFromStorage();
    setStep(target);
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggle = (k: "visitorActions" | "pages" | "brandAssets", v: string) => {
    setForm((f) => {
      const has = f[k].includes(v);
      return { ...f, [k]: has ? f[k].filter((x) => x !== v) : [...f[k], v] };
    });
  };

  const toggleAddon = (value: string) => {
    setForm((f) => {
      let addons = f.addons;

      if (value === GROWTH_PACK_ID) {
        if (addons.includes(GROWTH_PACK_ID)) {
          addons = addons.filter((x) => x !== GROWTH_PACK_ID);
        } else {
          addons = [
            ...addons.filter((x) => !isGrowthPackMember(x)),
            GROWTH_PACK_ID,
          ];
        }
      } else if (addons.includes(value)) {
        addons = addons.filter((x) => x !== value);
      } else if (isGrowthPackMember(value) && hasGrowthPack(addons)) {
        addons = addons.filter((x) => x !== GROWTH_PACK_ID);
      } else if (isGrowthPackMember(value)) {
        addons = [
          ...addons.filter((x) => x !== GROWTH_PACK_ID),
          value,
        ];
      } else {
        addons = [...addons, value];
      }

      return { ...f, addons };
    });
  };

  const validateStep = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (step === 0) {
      if (!form.fullName.trim()) e.fullName = "Your name, please.";
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
    if (step === 4) {
      if (!form.hostingChoice) e.hostingChoice = "Pick a hosting preference.";
      if (!form.paymentChannel) e.paymentChannel = "Pick how you want to pay.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!validateStep()) return;
    goToStep(Math.min(step + 1, 4));
  };
  const prev = () => goToStep(Math.max(step - 1, 0));

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
        body: JSON.stringify({ ...form, addons: getSelectedAddons() }),
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
            Detailed by design. The better the brief, the better the site. Five short steps.
          </p>
        </div>

        {/* Progress */}
        <ol className="mt-12 grid grid-cols-5 gap-2" aria-label="Form progress">
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
            <div className="grid gap-5">
              <div className="grid gap-4">
                <FixedFormField
                  id="lead-full-name"
                  label="Name"
                  value={form.fullName}
                  onChange={(v) => set("fullName", v)}
                  required
                  error={errors.fullName}
                  autoComplete="name"
                />
                <FixedFormField
                  id="lead-company"
                  label="Company"
                  value={form.businessName}
                  onChange={(v) => set("businessName", v)}
                  optionalHint
                  autoComplete="organization"
                />
                <FixedFormField
                  id="lead-email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  required
                  error={errors.email}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
              <Field label="Phone (optional)">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  autoComplete="tel"
                  className={inputCls()}
                />
              </Field>
              <Field label="Best way to reach you (select one)" error={errors.contactPref}>
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
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Industry" required error={errors.industry}>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => set("industry", e.target.value)}
                  placeholder="e.g. service, retail, trades"
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
            <div className="mt-8">
              <p className="mb-1 font-display text-lg font-semibold text-ink">
                Want any add-ons at launch?{" "}
                <span className="text-sm font-normal text-ink-soft">(optional)</span>
              </p>

              <div className="mb-5 rounded-xl border-2 border-accent/30 bg-accent/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="addons"
                    id="addon-growth-pack"
                    value={GROWTH_PACK_ID}
                    checked={form.addons.includes(GROWTH_PACK_ID)}
                    onChange={() => toggleAddon(GROWTH_PACK_ID)}
                    className="mt-1 accent-[#2563eb]"
                  />
                  <label htmlFor="addon-growth-pack" className="cursor-pointer">
                    <span className="mb-0.5 block text-xs font-medium uppercase tracking-widest text-accent">
                      Most Popular
                    </span>
                    <span className="block font-display text-base font-medium text-ink">
                      Growth Pack — Hyper-Local SEO + Google Profile Optimization + Blog Writing &amp; Local Posts
                    </span>
                    <span className="text-sm text-ink-soft">
                      $647 setup · $399/mo{" "}
                      <span className="font-medium text-ink">(save $128/mo)</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                {ADDON_OPTIONS.map((addon) => (
                  <div key={addon.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="addons"
                      id={addon.id}
                      value={addon.value}
                      checked={isAddonVisuallySelected(addon.value, form.addons)}
                      onChange={() => toggleAddon(addon.value)}
                      className="mt-1 accent-[#2563eb]"
                    />
                    <label htmlFor={addon.id} className="cursor-pointer">
                      <span className="font-medium text-ink">{addon.label}</span>{" "}
                      <span className="text-sm text-ink-soft">{addon.pricing}</span>
                    </label>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm text-ink-soft">
                <strong>Your estimated delivery:</strong> 7 business days for your site. Add-ons go live 1–3 business days after. Full-stack builds (3+ add-ons): up to 14 business days.
              </p>

              <p className="mt-2 text-xs text-ink-soft">
                Add-on timelines begin when all required client materials are received. Most add-ons go live within 1–3 business days of site delivery.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-5">
              <Field label="Payment" required error={errors.paymentChannel}>
                <div className="rounded-xl border border-rule bg-bg px-4 py-4">
                  <span className="block text-sm font-medium text-ink">
                    $1,998 design — paid in full to start
                    {form.hostingChoice === "ten_year" ? " (+ $1,349 ten-year hosting at checkout)" : ""}
                  </span>
                  <span className="mt-1 block text-xs text-ink-soft">
                    Full payment before your project enters the queue. Card payments include a 3%
                    processing fee on the design fee
                    {form.hostingChoice === "ten_year" ? " and ten-year hosting" : ""}
                    {form.hostingChoice === "monthly"
                      ? "; month-to-month hosting is list price"
                      : ""}
                    .
                  </span>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {([
                    ["card", "Credit or debit card", "Includes 3% processing on eligible items"],
                    ["ach", "Pay by bank instead", "List price — no 3% processing fee"],
                  ] as const).map(([val, title, hint]) => {
                    const channel = val as PaymentChannel;
                    const total =
                      form.hostingChoice &&
                      formatCheckoutUsd(
                        checkoutDueTodayCents(form.hostingChoice, channel)
                      );
                    return (
                      <label
                        key={val}
                        className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
                          form.paymentChannel === val
                            ? "border-accent bg-accent/[0.06]"
                            : "border-rule bg-bg hover:border-accent/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentChannel"
                          value={val}
                          checked={form.paymentChannel === val}
                          onChange={() => set("paymentChannel", channel)}
                          className="sr-only"
                        />
                        <span className="block text-sm font-medium text-ink">{title}</span>
                        <span className="mt-1 block text-xs text-ink-soft">{hint}</span>
                        {total && (
                          <span className="mt-2 block text-sm font-medium text-accent">
                            Checkout total: {total}
                          </span>
                        )}
                      </label>
                    );
                  })}
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
                    ["ten_year", "Ten Year $1,349"],
                    ["monthly", "Month-to-month $198"],
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

            {step < 4 ? (
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
                disabled={submitting || !form.hostingChoice}
                className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:bg-accent-deep disabled:opacity-60"
              >
                {submitting
                  ? "Redirecting to payment..."
                  : form.hostingChoice
                    ? `Continue to pay ${formatCheckoutUsd(
                        checkoutDueTodayCents(form.hostingChoice, form.paymentChannel)
                      )}`
                    : "Continue to payment"}
              </button>
            )}
          </div>
        </form>

        {step === 4 && (
          <p className="mt-6 text-center text-xs text-slate">
            You&rsquo;ll be redirected to Stripe. Card is the default; bank transfer is available if
            you prefer list price with no 3% fee. Sales tax is not collected at checkout.
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
