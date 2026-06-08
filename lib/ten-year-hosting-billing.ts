import type Stripe from "stripe";
import { findTenYearHostingDueLeads, updateWdLead, type TenYearDueLead } from "@/lib/leads-db";
import { sendTenYearHostingCheckoutEmail } from "@/lib/ten-year-hosting-email";
import { tenYearHostingFeeCents } from "@/lib/design-promo";
import { HOSTING_TEN_YEAR_DEFERRED_PRODUCT } from "@/lib/products";
import { stripe } from "@/lib/stripe";

function promoCodeFromPayload(payload: Record<string, unknown>): string {
  const raw = payload.promoCode;
  return typeof raw === "string" ? raw.trim() : "";
}

export type TenYearBillingResult = {
  processed: number;
  skipped: number;
  errors: string[];
};

export function buildTenYearHostingCheckoutParams(
  lead: TenYearDueLead,
  origin: string
): Stripe.Checkout.SessionCreateParams {
  const promoCode = promoCodeFromPayload(lead.payload);
  const hostingCents = tenYearHostingFeeCents(promoCode, { ignoreExpiry: true });
  const promoNote =
    promoCode && hostingCents < HOSTING_TEN_YEAR_DEFERRED_PRODUCT.priceInCents
      ? ` (${promoCode.toUpperCase()} bundle rate)`
      : "";

  return {
    mode: "payment",
    customer: lead.stripe_customer_id ?? undefined,
    customer_email: lead.stripe_customer_id ? undefined : lead.email,
    payment_method_types: ["card", "us_bank_account"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: HOSTING_TEN_YEAR_DEFERRED_PRODUCT.name,
            description: `${HOSTING_TEN_YEAR_DEFERRED_PRODUCT.description}${promoNote}`,
          },
          unit_amount: hostingCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentType: "ten_year_hosting",
      wdLeadId: lead.id,
      fullName: lead.full_name,
      businessName: lead.business_name,
      email: lead.email,
      hostingChoice: "ten_year",
      ...(promoCode ? { promoCode: promoCode.toUpperCase() } : {}),
    },
    success_url: `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
  };
}

export async function processDueTenYearHostingBillings(
  origin: string,
  limit = 20
): Promise<TenYearBillingResult> {
  const due = await findTenYearHostingDueLeads(limit);
  const result: TenYearBillingResult = { processed: 0, skipped: 0, errors: [] };

  for (const lead of due) {
    try {
      const session = await stripe.checkout.sessions.create(
        buildTenYearHostingCheckoutParams(lead, origin)
      );
      if (!session.url) {
        result.errors.push(`Lead ${lead.id}: Checkout session missing url`);
        continue;
      }

      const updated = await updateWdLead(lead.id, {
        status: "awaiting_lifetime_hosting",
        stripe_ten_year_session_id: session.id,
      });
      if (!updated) {
        result.errors.push(`Lead ${lead.id}: wd_leads update failed`);
        continue;
      }

      await sendTenYearHostingCheckoutEmail({
        email: lead.email,
        fullName: lead.full_name,
        businessName: lead.business_name,
        checkoutUrl: session.url,
      });

      result.processed += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Lead ${lead.id}: ${msg}`);
    }
  }

  result.skipped = Math.max(0, due.length - result.processed - result.errors.length);
  return result;
}

/** Production origin for day-31 Checkout links. */
export function cronCheckoutOrigin(): string {
  return "https://998webdesigns.com";
}
