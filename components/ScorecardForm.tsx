"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScorecardSuccess } from "@/components/ScorecardSuccess";
import { SCORECARD_ESTIMATE_SEC } from "@/lib/scorecard/estimate";
import {
  SCORECARD_INDUSTRY_OPTIONS,
  type ScorecardIndustryValue,
} from "@/lib/scorecard/industries";
import { SiteVersionPill } from "@/components/SiteVersionPill";

export function ScorecardForm() {
  const searchParams = useSearchParams();
  const [domain, setDomain] = useState(() => searchParams.get("d") ?? "");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState<ScorecardIndustryValue | "">("");
  const [industryOther, setIndustryOther] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pendingJob, setPendingJob] = useState<{ jobId: string; email: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setPendingJob(null);

    try {
      const res = await fetch("/api/scorecard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          email,
          phone,
          domain,
          industry,
          industryOther: industry === "other" ? industryOther : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        jobId?: string;
        email?: string;
      };
      if (res.ok && data.jobId) {
        setPendingJob({
          jobId: data.jobId,
          email: data.email ?? email.trim().toLowerCase(),
        });
      } else if (res.ok) {
        setMessage({
          kind: "err",
          text: "Report queued but we lost track of it — check your email in a minute.",
        });
        setSubmitting(false);
      } else {
        setMessage({
          kind: "err",
          text: data.error ?? "Something went wrong. Please try again in a moment.",
        });
        setSubmitting(false);
      }
    } catch {
      setMessage({ kind: "err", text: "Network error. Please try again." });
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-black/15 bg-white px-3.5 py-3 text-[15px] text-[#1a1a1a] caret-[#1a1a1a] placeholder:text-[#6b6b66] [color-scheme:light] focus:border-transparent focus:outline focus:outline-2 focus:outline-[#0c447c] autofill:bg-white autofill:text-[#1a1a1a]";

  return (
    <main className="min-h-[70vh] bg-[#f7f6f2] px-5 py-12">
      <div className="scorecard-form mx-auto max-w-md rounded-2xl bg-white p-8 text-[#1a1a1a] shadow-sm [color-scheme:light]">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">How does your website score?</h1>
        <p className="mt-2 text-[15px] text-[#6b6b66]">
          A free, sourced scorecard — mobile speed, security, SEO, and your Google reviews. We
          email you the report.
        </p>

        {!pendingJob ? (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label="Name" required>
              <input
                className={inputClass}
                name="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Company" required>
              <input
                className={inputClass}
                name="company"
                required
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </Field>
            <Field label="Email" required>
              <input
                className={inputClass}
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                className={inputClass}
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="Industry" required>
              <select
                className={inputClass}
                name="industry"
                required
                value={industry}
                onChange={(e) => {
                  const next = e.target.value as ScorecardIndustryValue | "";
                  setIndustry(next);
                  if (next !== "other") setIndustryOther("");
                }}
              >
                <option value="" disabled>
                  Select your industry…
                </option>
                {SCORECARD_INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            {industry === "other" ? (
              <Field label="Describe your industry" required>
                <input
                  className={inputClass}
                  name="industryOther"
                  required
                  placeholder="e.g. garage door, dental, law firm"
                  value={industryOther}
                  onChange={(e) => setIndustryOther(e.target.value)}
                />
              </Field>
            ) : null}
            <Field label="Your website" required>
              <input
                className={inputClass}
                name="domain"
                required
                placeholder="yourbusiness.com"
                autoComplete="url"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </Field>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-[#111] py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Get my free scorecard"}
            </button>
          </form>
        ) : (
          <ScorecardSuccess
            jobId={pendingJob.jobId}
            email={pendingJob.email}
            estimateSec={SCORECARD_ESTIMATE_SEC}
          />
        )}

        {message ? (
          <p
            className={`mt-5 rounded-lg px-4 py-3 text-sm ${
              message.kind === "ok"
                ? "bg-[#e1f5ee] text-[#0f6e56]"
                : "bg-[#fcebeb] text-[#a32d2d]"
            }`}
          >
            {message.text}
          </p>
        ) : null}

        {!pendingJob ? (
          <p className="mt-4 text-center text-xs text-[#6b6b66]">
            We&apos;ll email your report. No spam — one report, then it&apos;s up to you.
          </p>
        ) : null}
      </div>
      <p className="mt-6 flex justify-center">
        <SiteVersionPill />
      </p>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-[#1a1a1a]">
        {label}
        {required ? <span className="text-[#a32d2d]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
