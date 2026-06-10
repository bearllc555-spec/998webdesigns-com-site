"use client";

import { useEffect, useState } from "react";
import {
  ADDON_OPTIONS,
  formatAddonSummary,
  GROWTH_PACK_ID,
  isAddonVisuallySelected,
  toggleAddonSelection,
} from "@/lib/addons";
import { HOSTING_MONTHLY_PRICE_MO_LABEL } from "@/lib/hosting-policy";
import { checkoutDueTodayCents, formatCheckoutUsd } from "@/lib/checkout-pricing";
import { designPaymentScheduleLines } from "@/lib/design-payment-schedule";
import type { DiscoveryCloseDraft } from "@/lib/discovery-types";
import { hostingChoiceLabel } from "@/lib/hosting";

type Props = {
  prospectId: string;
  phone: string | null;
  email: string;
  phoneVerified: boolean;
  intakeComplete: boolean;
  businessName: string;
  closeDraft?: DiscoveryCloseDraft | null;
};

function formatPhoneDisplay(e164: string | null): string {
  if (!e164) return "";
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return e164;
}

export function CrmDiscoveryClosePanel({
  prospectId,
  phone,
  email,
  phoneVerified,
  intakeComplete,
  businessName: initialBusinessName,
  closeDraft,
}: Props) {
  const [hostingChoice, setHostingChoice] = useState<"ten_year" | "monthly">(
    closeDraft?.hostingChoice ?? "ten_year"
  );
  const [paymentChannel, setPaymentChannel] = useState<"card" | "ach">(
    closeDraft?.paymentChannel ?? "card"
  );
  const [promoCode, setPromoCode] = useState(closeDraft?.promoCode ?? "");
  const [addons, setAddons] = useState<string[]>(closeDraft?.addons ?? []);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [closeUrl, setCloseUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBusinessName(initialBusinessName);
  }, [initialBusinessName]);

  useEffect(() => {
    if (!closeDraft) return;
    setHostingChoice(closeDraft.hostingChoice);
    setPaymentChannel(closeDraft.paymentChannel);
    setPromoCode(closeDraft.promoCode);
    setAddons(closeDraft.addons);
  }, [closeDraft]);

  function toggleAddon(value: string) {
    setAddons((current) => toggleAddonSelection(current, value));
  }

  const dueToday = formatCheckoutUsd(
    checkoutDueTodayCents(hostingChoice, paymentChannel, promoCode, "deposit")
  );
  const scheduleLines = designPaymentScheduleLines(promoCode, hostingChoice);

  async function sendCloseLink() {
    if (!sendEmail && !sendSms) {
      setMessage("Choose email, SMS, or both.");
      return;
    }
    if (!intakeComplete && !businessName.trim()) {
      setMessage("Enter a business name before sending.");
      return;
    }

    setBusy(true);
    setMessage("");
    setCopied(false);
    try {
      const res = await fetch("/api/discovery/close-invite", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          hostingChoice,
          paymentChannel,
          paymentOption: "deposit",
          promoCode,
          addons,
          sendEmail,
          sendSms,
          businessName: intakeComplete ? undefined : businessName.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; closeUrl?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Failed to send.");
        if (data.closeUrl) setCloseUrl(data.closeUrl);
        return;
      }
      if (data.closeUrl) setCloseUrl(data.closeUrl);
      const parts = [sendEmail && "Email", sendSms && "SMS"].filter(Boolean);
      setMessage(`${parts.join(" + ")} sent.`);
    } catch {
      setMessage("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCloseLink() {
    if (!closeUrl) return;
    try {
      await navigator.clipboard.writeText(closeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage("Could not copy link.");
    }
  }

  if (!phoneVerified) {
    return (
      <p className="text-sm text-ink-soft">
        Phone not verified yet — complete SMS verification on /book before sending a checkout link.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-rule bg-bg p-4">
      <p className="text-sm font-medium text-ink">Build checkout (on-call)</p>
      <p className="mt-1 text-xs text-ink-soft">
        {email}
        {phone ? ` · ${formatPhoneDisplay(phone)}` : ""}
      </p>

      {!intakeComplete && (
        <label className="mt-3 block text-sm text-ink-soft">
          Business name
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="mt-1 w-full rounded border border-rule bg-bg px-2 py-1.5 text-ink"
            placeholder="Client business name"
          />
        </label>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-ink-soft">
          Hosting
          <select
            value={hostingChoice}
            onChange={(e) => setHostingChoice(e.target.value as "ten_year" | "monthly")}
            className="mt-1 w-full rounded border border-rule bg-bg px-2 py-1.5 text-ink"
          >
            <option value="ten_year">10-year ($2,996 day 31)</option>
            <option value="monthly">Monthly ({HOSTING_MONTHLY_PRICE_MO_LABEL})</option>
          </select>
        </label>
        <label className="text-sm text-ink-soft">
          Payment channel
          <select
            value={paymentChannel}
            onChange={(e) => setPaymentChannel(e.target.value as "card" | "ach")}
            className="mt-1 w-full rounded border border-rule bg-bg px-2 py-1.5 text-ink"
          >
            <option value="card">Card</option>
            <option value="ach">ACH</option>
          </select>
        </label>
        <div className="text-sm text-ink-soft">
          <p className="font-medium text-ink">Design payment</p>
          <p className="mt-1">50 / 40 / 10 schedule (50% deposit at checkout)</p>
        </div>
        <label className="text-sm text-ink-soft sm:col-span-2">
          Promo code (optional)
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="mt-1 w-full rounded border border-rule bg-bg px-2 py-1.5 text-ink"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-ink">Add-ons (optional)</legend>
        <div className="mt-2 rounded border border-accent/30 bg-accent/[0.04] p-3">
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={addons.includes(GROWTH_PACK_ID)}
              onChange={() => toggleAddon(GROWTH_PACK_ID)}
              className="mt-0.5 accent-[#2563eb]"
            />
            <span>
              <span className="font-medium text-ink">Growth Pack</span>
              <span className="block text-xs text-ink-soft">
                SEO + Google Profile + Blog · $647 setup · $399/mo
              </span>
            </span>
          </label>
        </div>
        <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
          {ADDON_OPTIONS.map((addon) => (
            <label key={addon.id} className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={isAddonVisuallySelected(addon.value, addons)}
                onChange={() => toggleAddon(addon.value)}
                className="mt-0.5 accent-[#2563eb]"
              />
              <span>
                <span className="text-ink">{addon.label}</span>{" "}
                <span className="text-xs text-ink-soft">{addon.pricing}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 rounded border border-rule bg-rule-soft/30 p-3 text-sm">
        <p>
          <strong className="text-ink">Due today:</strong> {dueToday}
        </p>
        <ul className="mt-2 space-y-1 text-xs text-ink-soft">
          {scheduleLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-soft">
          Hosting: {hostingChoiceLabel(hostingChoice)} · Add-ons: {formatAddonSummary(addons)}
        </p>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-ink">Send checkout link</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="accent-[#2563eb]"
            />
            Email
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
              className="accent-[#2563eb]"
            />
            SMS
          </label>
        </div>
      </fieldset>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={sendCloseLink}
          disabled={busy}
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send checkout"}
        </button>
        {closeUrl && (
          <button
            type="button"
            onClick={copyCloseLink}
            className="rounded border border-rule px-3 py-1.5 text-sm font-medium hover:border-accent/50"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        )}
      </div>
      {message && <p className="mt-2 text-sm text-ink-soft">{message}</p>}
      {closeUrl && (
        <p className="mt-2 break-all text-xs text-ink-soft">{closeUrl}</p>
      )}
    </div>
  );
}
