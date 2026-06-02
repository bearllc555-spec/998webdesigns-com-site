import { stripe } from "@/lib/stripe";
import { findWdLeadForCapture, updateWdLead } from "@/lib/leads-db";

export type CaptureBalanceInput = {
  email?: string;
  depositSessionId?: string;
  leadId?: string;
};

export type CaptureBalanceResult =
  | { ok: true; paymentIntentId: string; leadId: string; alreadyCaptured?: boolean }
  | { ok: false; error: string; status: number };

export async function captureBalanceForLead(
  input: CaptureBalanceInput
): Promise<CaptureBalanceResult> {
  const lead = await findWdLeadForCapture(input);
  if (!lead) {
    return { ok: false, error: "Lead not found", status: 404 };
  }

  if (lead.status === "balance_captured") {
    return {
      ok: true,
      paymentIntentId: lead.stripe_balance_invoice_id ?? "",
      leadId: lead.id,
      alreadyCaptured: true,
    };
  }

  if (lead.status === "paid_in_full") {
    return { ok: false, error: "Lead paid in full — no balance to capture", status: 400 };
  }

  const holdId = lead.stripe_balance_invoice_id;
  if (!holdId) {
    return {
      ok: false,
      error: "No balance hold on file for this lead (check Stripe webhook logs)",
      status: 404,
    };
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(holdId);

    if (intent.status === "succeeded") {
      await updateWdLead(lead.id, { status: "balance_captured" });
      return { ok: true, paymentIntentId: holdId, leadId: lead.id, alreadyCaptured: true };
    }

    if (intent.status !== "requires_capture") {
      return {
        ok: false,
        error: `PaymentIntent ${holdId} is ${intent.status}, not capturable`,
        status: 409,
      };
    }

    const captured = await stripe.paymentIntents.capture(holdId);
    await updateWdLead(lead.id, { status: "balance_captured" });

    return { ok: true, paymentIntentId: captured.id, leadId: lead.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[capture-balance] Stripe error:", message);
    return { ok: false, error: message, status: 502 };
  }
}
