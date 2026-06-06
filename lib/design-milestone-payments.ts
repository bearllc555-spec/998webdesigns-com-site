import {
  cardProcessingFeeCents,
  formatCheckoutUsd,
  type PaymentChannel,
} from "@/lib/checkout-pricing";
import {
  designMilestone2Cents,
  designMilestone3Cents,
} from "@/lib/design-payment-schedule";
import type { PaymentOption } from "@/lib/validate-lead";

export type DesignMilestoneKey = "milestone2" | "milestone3";
export type DesignMilestonePaymentType = "milestone_2" | "milestone_3";

export type DesignMilestoneRecord = {
  checkoutSessionId?: string;
  sentAt?: string;
  paidAt?: string;
};

export type DesignMilestonesState = {
  milestone2?: DesignMilestoneRecord;
  milestone3?: DesignMilestoneRecord;
};

export function milestonePaymentType(key: DesignMilestoneKey): DesignMilestonePaymentType {
  return key === "milestone2" ? "milestone_2" : "milestone_3";
}

export function milestoneKeyFromPaymentType(
  paymentType: string | undefined
): DesignMilestoneKey | null {
  if (paymentType === "milestone_2") return "milestone2";
  if (paymentType === "milestone_3") return "milestone3";
  return null;
}

export function parsePaymentOption(payload: Record<string, unknown> | null): PaymentOption {
  const value = payload?.paymentOption;
  return value === "deposit" ? "deposit" : "full";
}

export function parseDesignMilestones(
  payload: Record<string, unknown> | null
): DesignMilestonesState {
  const raw = payload?.designMilestones;
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  return {
    milestone2: parseMilestoneRecord(obj.milestone2),
    milestone3: parseMilestoneRecord(obj.milestone3),
  };
}

function parseMilestoneRecord(value: unknown): DesignMilestoneRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const record: DesignMilestoneRecord = {};
  if (typeof row.checkoutSessionId === "string") record.checkoutSessionId = row.checkoutSessionId;
  if (typeof row.sentAt === "string") record.sentAt = row.sentAt;
  if (typeof row.paidAt === "string") record.paidAt = row.paidAt;
  return Object.keys(record).length ? record : undefined;
}

export function milestoneAmountCents(key: DesignMilestoneKey, promoCode?: string): number {
  return key === "milestone2"
    ? designMilestone2Cents(promoCode)
    : designMilestone3Cents(promoCode);
}

export function milestoneCheckoutTotalCents(
  key: DesignMilestoneKey,
  channel: PaymentChannel,
  promoCode?: string
): number {
  const subtotal = milestoneAmountCents(key, promoCode);
  if (channel === "card") return subtotal + cardProcessingFeeCents(subtotal);
  return subtotal;
}

export function milestoneLabel(key: DesignMilestoneKey): string {
  return key === "milestone2"
    ? "40% — design approval / development start"
    : "10% — launch and handover";
}

export function milestoneShortLabel(key: DesignMilestoneKey): string {
  return key === "milestone2" ? "40% milestone" : "10% milestone";
}

export function milestoneLineItemName(key: DesignMilestoneKey): string {
  return key === "milestone2"
    ? "Website Design — 40% (development start)"
    : "Website Design — 10% (launch & handover)";
}

export function milestoneLineItemDescription(key: DesignMilestoneKey, promoCode?: string): string {
  const amount = formatCheckoutUsd(milestoneAmountCents(key, promoCode));
  return key === "milestone2"
    ? `${amount} due after design approval or development start (design fee balance).`
    : `${amount} due at launch and handover (final design fee balance).`;
}

export function isMilestonePaid(
  milestones: DesignMilestonesState,
  key: DesignMilestoneKey
): boolean {
  return Boolean(milestones[key]?.paidAt);
}

export function leadUsesDepositSchedule(
  status: string | null,
  payload: Record<string, unknown> | null
): boolean {
  if (parsePaymentOption(payload) !== "deposit") return false;
  return (
    status === "deposit_paid" ||
    status === "milestone2_paid" ||
    status === "awaiting_bank_settlement"
  );
}

export function canSendMilestoneInvoice(
  status: string | null,
  payload: Record<string, unknown> | null,
  key: DesignMilestoneKey
): { ok: true } | { ok: false; error: string } {
  if (parsePaymentOption(payload) !== "deposit") {
    return { ok: false, error: "This lead paid the design fee in full — no milestones." };
  }
  if (status === "paid_in_full") {
    return { ok: false, error: "Design fee is already paid in full." };
  }
  if (status === "awaiting_bank_settlement") {
    return { ok: false, error: "Wait for the 50% deposit bank transfer to settle first." };
  }
  if (status !== "deposit_paid" && status !== "milestone2_paid") {
    return { ok: false, error: "50% deposit must be paid before sending balance invoices." };
  }

  const milestones = parseDesignMilestones(payload);

  if (key === "milestone2") {
    if (status !== "deposit_paid") {
      return { ok: false, error: "40% invoice requires deposit_paid status." };
    }
    if (isMilestonePaid(milestones, "milestone2")) {
      return { ok: false, error: "40% milestone is already paid." };
    }
    return { ok: true };
  }

  if (status !== "milestone2_paid") {
    return { ok: false, error: "Send and collect the 40% invoice before the 10% invoice." };
  }
  if (isMilestonePaid(milestones, "milestone3")) {
    return { ok: false, error: "10% milestone is already paid." };
  }
  return { ok: true };
}

export function mergeMilestoneSent(
  payload: Record<string, unknown>,
  key: DesignMilestoneKey,
  checkoutSessionId: string
): Record<string, unknown> {
  const milestones = parseDesignMilestones(payload);
  const now = new Date().toISOString();
  return {
    ...payload,
    designMilestones: {
      ...milestones,
      [key]: {
        ...milestones[key],
        checkoutSessionId,
        sentAt: now,
      },
    },
  };
}

export function mergeMilestonePaid(
  payload: Record<string, unknown>,
  key: DesignMilestoneKey,
  checkoutSessionId?: string
): Record<string, unknown> {
  const milestones = parseDesignMilestones(payload);
  const now = new Date().toISOString();
  return {
    ...payload,
    designMilestones: {
      ...milestones,
      [key]: {
        ...milestones[key],
        checkoutSessionId: checkoutSessionId ?? milestones[key]?.checkoutSessionId,
        paidAt: now,
      },
    },
  };
}
