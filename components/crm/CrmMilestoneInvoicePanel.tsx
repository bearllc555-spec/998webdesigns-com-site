"use client";

import { useState } from "react";
import { formatCheckoutUsd } from "@/lib/checkout-pricing";
import {
  canSendMilestoneInvoice,
  isMilestonePaid,
  leadUsesDepositSchedule,
  milestoneCheckoutTotalCents,
  milestoneLabel,
  parseDesignMilestones,
  type DesignMilestoneKey,
} from "@/lib/design-milestone-payments";
import type { PaymentChannel } from "@/lib/validate-lead";

type Props = {
  leadId: string;
  status: string | null;
  payload: Record<string, unknown> | null;
  phone: string | null;
  email: string;
  onSent?: () => void;
};

function milestoneStatusLabel(key: DesignMilestoneKey, paid: boolean, sent: boolean): string {
  if (paid) return "Paid";
  if (sent) return "Invoice sent — awaiting payment";
  return "Not sent";
}

export function CrmMilestoneInvoicePanel({ leadId, status, payload, phone, email, onSent }: Props) {
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>(
    payload?.paymentChannel === "ach" ? "ach" : "card"
  );
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(Boolean(phone));
  const [busyKey, setBusyKey] = useState<DesignMilestoneKey | null>(null);
  const [message, setMessage] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [copied, setCopied] = useState(false);

  if (!leadUsesDepositSchedule(status, payload)) return null;

  const promoCode = typeof payload?.promoCode === "string" ? payload.promoCode : "";
  const milestones = parseDesignMilestones(payload);
  const m2Paid = isMilestonePaid(milestones, "milestone2");
  const m3Paid = isMilestonePaid(milestones, "milestone3");
  const m2Sent = Boolean(milestones.milestone2?.sentAt);
  const m3Sent = Boolean(milestones.milestone3?.sentAt);

  async function sendInvoice(milestone: DesignMilestoneKey) {
    if (!sendEmail && !sendSms) {
      setMessage("Choose email, SMS, or both.");
      return;
    }

    setBusyKey(milestone);
    setMessage("");
    setCopied(false);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/milestone-invoice`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestone: milestone === "milestone2" ? 2 : 3,
          paymentChannel,
          sendEmail,
          sendSms,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; checkoutUrl?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Could not send invoice.");
        if (data.checkoutUrl) setCheckoutUrl(data.checkoutUrl);
        return;
      }
      setCheckoutUrl(data.checkoutUrl ?? "");
      setMessage(
        milestone === "milestone2"
          ? "40% invoice sent."
          : "10% invoice sent."
      );
      onSent?.();
    } catch {
      setMessage("Network error.");
    } finally {
      setBusyKey(null);
    }
  }

  async function copyLink() {
    if (!checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
    } catch {
      setMessage("Could not copy link.");
    }
  }

  const m2Eligible = canSendMilestoneInvoice(status, payload, "milestone2").ok;
  const m3Eligible = canSendMilestoneInvoice(status, payload, "milestone3").ok;

  return (
    <div className="mt-4 rounded-xl border border-rule bg-rule-soft/20 p-4">
      <h3 className="font-display text-base font-medium text-ink">Design balance invoices</h3>
      <p className="mt-1 text-xs text-ink-soft">
        50% deposit collected — send the 40% and 10% milestones manually when due.
      </p>

      <ul className="mt-4 space-y-3 text-sm">
        <li className="rounded-lg border border-rule bg-bg p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-ink">{milestoneLabel("milestone2")}</p>
              <p className="text-xs text-ink-soft">
                Due today if invoiced:{" "}
                {formatCheckoutUsd(
                  milestoneCheckoutTotalCents("milestone2", paymentChannel, promoCode)
                )}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Status: {milestoneStatusLabel("milestone2", m2Paid, m2Sent)}
              </p>
            </div>
            <button
              type="button"
              disabled={!m2Eligible || busyKey !== null}
              onClick={() => sendInvoice("milestone2")}
              className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {busyKey === "milestone2" ? "Sending…" : "Send 40% invoice"}
            </button>
          </div>
        </li>
        <li className="rounded-lg border border-rule bg-bg p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-ink">{milestoneLabel("milestone3")}</p>
              <p className="text-xs text-ink-soft">
                Due today if invoiced:{" "}
                {formatCheckoutUsd(
                  milestoneCheckoutTotalCents("milestone3", paymentChannel, promoCode)
                )}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Status: {milestoneStatusLabel("milestone3", m3Paid, m3Sent)}
              </p>
            </div>
            <button
              type="button"
              disabled={!m3Eligible || busyKey !== null}
              onClick={() => sendInvoice("milestone3")}
              className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {busyKey === "milestone3" ? "Sending…" : "Send 10% invoice"}
            </button>
          </div>
        </li>
      </ul>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-ink-soft">
          Payment method on invoice
          <select
            value={paymentChannel}
            onChange={(e) => setPaymentChannel(e.target.value as PaymentChannel)}
            className="mt-1 w-full rounded border border-rule bg-bg px-2 py-1.5 text-ink"
          >
            <option value="card">Card (+ 3% fee)</option>
            <option value="ach">Bank (ACH)</option>
          </select>
        </label>
        <div className="flex flex-col justify-end gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Email to {email}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendSms}
              disabled={!phone}
              onChange={(e) => setSendSms(e.target.checked)}
            />
            SMS {phone ? "" : "(no phone on file)"}
          </label>
        </div>
      </div>

      {message && <p className="mt-3 text-sm text-ink-soft">{message}</p>}

      {checkoutUrl && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-full border border-rule px-4 py-2 text-xs"
          >
            {copied ? "Copied" : "Copy payment link"}
          </button>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            Open Stripe checkout
          </a>
        </div>
      )}
    </div>
  );
}
