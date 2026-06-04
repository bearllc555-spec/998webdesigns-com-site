import type Stripe from "stripe";
import {
  checkoutDueTodayCents,
  formatCheckoutUsd,
  paymentChannelLabel,
} from "@/lib/checkout-pricing";
import { hostingChoiceLabel } from "@/lib/hosting";
import type { ValidatedLead } from "@/lib/validate-lead";
import { stripeKeyMode } from "@/lib/stripe-env";

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

const NOTIFY_TO = "hello@998webdesigns.com";

function stripeDashboardBase(): string {
  return stripeKeyMode() === "live"
    ? "https://dashboard.stripe.com"
    : "https://dashboard.stripe.com/test";
}

/** New lead submitted — checkout link generated (payment may still be pending). */
export async function sendInternalLeadSubmittedEmail(
  lead: ValidatedLead,
  checkoutUrl: string,
  checkoutSessionId: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[leads] RESEND_API_KEY not set, skipping internal new-lead alert");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const dash = stripeDashboardBase();

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: NOTIFY_TO,
    subject: `[998] New lead — ${lead.businessName} (awaiting payment)`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <h2 style="margin: 0 0 12px;">New lead — payment not completed yet</h2>
        <p><strong>Plan:</strong> $1,998 pay in full (selected)</p>
        <p><strong>Payment method:</strong> ${escapeHtml(paymentChannelLabel(lead.paymentChannel))}</p>
        <p><strong>Checkout total:</strong> ${escapeHtml(formatCheckoutUsd(checkoutDueTodayCents(lead.hostingChoice, lead.paymentChannel)))}</p>
        <p><strong>Name:</strong> ${escapeHtml(lead.fullName)}</p>
        <p><strong>Company:</strong> ${lead.businessName ? escapeHtml(lead.businessName) : "&nbsp;"}</p>
        <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
        <p><strong>Hosting:</strong> ${escapeHtml(hostingChoiceLabel(lead.hostingChoice))}</p>
        <p><strong>Checkout link:</strong> <a href="${escapeHtml(checkoutUrl)}">Open Stripe Checkout</a></p>
        <p><strong>Stripe session:</strong> <a href="${dash}/checkout/sessions/${checkoutSessionId}">${escapeHtml(checkoutSessionId)}</a></p>
        <p style="font-size: 14px; color: #52525b;">You will get a second email when they pay. If they abandon, follow up manually.</p>
      </div>
    `,
  });

  if (error) {
    console.error("[leads] Internal new-lead alert failed:", error);
  }
}

export async function sendInternalPaymentEmail(
  session: Stripe.Checkout.Session,
  options?: { settledAfterAch?: boolean }
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const meta = session.metadata ?? {};
  const email =
    session.customer_details?.email ?? meta.email ?? session.customer_email ?? "(unknown)";
  const amount =
    session.amount_total != null
      ? `$${(session.amount_total / 100).toFixed(2)} ${(session.currency ?? "usd").toUpperCase()}`
      : "—";

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const dashboardBase = stripeDashboardBase();

  const channelLabel =
    meta.paymentChannel === "ach"
      ? "Bank (ACH)"
      : meta.paymentChannel === "card"
        ? "Card"
        : "—";
  const achNote = options?.settledAfterAch
    ? "<p style=\"font-size: 14px; color: #52525b;\">ACH settlement completed (async payment succeeded).</p>"
    : "";

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: NOTIFY_TO,
    subject: `[998] Paid in full — ${meta.businessName || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <h2 style="margin: 0 0 12px;">New checkout completed</h2>
        <p><strong>Status:</strong> Paid in full</p>
        <p><strong>Payment method:</strong> ${escapeHtml(channelLabel)}</p>
        ${achNote}
        <p><strong>Amount:</strong> ${escapeHtml(amount)}</p>
        <p><strong>Name:</strong> ${escapeHtml(meta.fullName || "—")}</p>
        <p><strong>Company:</strong> ${escapeHtml(meta.businessName || "—")}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Hosting:</strong> ${escapeHtml(meta.hostingChoice || "—")}</p>
        <p><strong>Stripe session:</strong> <a href="${dashboardBase}/checkout/sessions/${session.id}">${escapeHtml(session.id)}</a></p>
        <p style="font-size: 14px; color: #52525b;">Paid in full — no follow-up invoice for the design fee.</p>
        <p style="font-size: 14px; color: #71717a; margin-top: 24px;">Sent automatically from /api/stripe/webhook</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`[webhook] Internal payment alert failed: ${JSON.stringify(error)}`);
  }
}

/** ACH settlement failed — follow up with the customer manually. */
export async function sendInternalAchFailedEmail(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[webhook] RESEND_API_KEY not set, skipping ACH failed alert");
    return;
  }

  const meta = session.metadata ?? {};
  const email =
    session.customer_details?.email ?? meta.email ?? session.customer_email ?? "(unknown)";

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const dashboardBase = stripeDashboardBase();

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: NOTIFY_TO,
    subject: `[998] ACH payment failed — ${meta.businessName || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <h2 style="margin: 0 0 12px;">Bank payment did not settle</h2>
        <p><strong>Name:</strong> ${escapeHtml(meta.fullName || "—")}</p>
        <p><strong>Company:</strong> ${escapeHtml(meta.businessName || "—")}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Stripe session:</strong> <a href="${dashboardBase}/checkout/sessions/${session.id}">${escapeHtml(session.id)}</a></p>
        <p style="font-size: 14px; color: #52525b;">Lead status set to bank_payment_failed. Contact the customer for another payment method.</p>
      </div>
    `,
  });

  if (error) {
    console.error("[webhook] Internal ACH failed alert failed:", error);
  }
}

/** Month-to-month hosting renewal failed (Stripe subscription invoice). */
export async function sendInternalHostingRenewalFailedEmail(
  invoice: Stripe.Invoice,
  subscriptionId: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[webhook] RESEND_API_KEY not set, skipping hosting renewal failed alert");
    return;
  }

  const amount =
    invoice.amount_due != null
      ? `$${(invoice.amount_due / 100).toFixed(2)} ${(invoice.currency ?? "usd").toUpperCase()}`
      : "—";
  const customerEmail =
    (invoice as Stripe.Invoice & { customer_email?: string | null }).customer_email ??
    "(unknown)";

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const dashboardBase = stripeDashboardBase();

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: NOTIFY_TO,
    subject: `[998] Hosting renewal failed — ${customerEmail}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <h2 style="margin: 0 0 12px;">$198/mo hosting payment failed</h2>
        <p><strong>Customer email:</strong> ${escapeHtml(customerEmail)}</p>
        <p><strong>Amount due:</strong> ${escapeHtml(amount)}</p>
        <p><strong>Subscription:</strong> <a href="${dashboardBase}/subscriptions/${escapeHtml(subscriptionId)}">${escapeHtml(subscriptionId)}</a></p>
        <p><strong>Invoice:</strong> <a href="${dashboardBase}/invoices/${escapeHtml(invoice.id)}">${escapeHtml(invoice.id)}</a></p>
        <p style="font-size: 14px; color: #52525b;">Lead status set to hosting_payment_failed. Stripe will retry; contact the client if it keeps failing.</p>
      </div>
    `,
  });

  if (error) {
    console.error("[webhook] Hosting renewal failed alert failed:", error);
  }
}

/** Month-to-month subscription ended (canceled or expired). */
export async function sendInternalHostingCanceledEmail(
  subscription: Stripe.Subscription
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[webhook] RESEND_API_KEY not set, skipping hosting canceled alert");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const dashboardBase = stripeDashboardBase();

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: NOTIFY_TO,
    subject: `[998] Hosting subscription ended — ${subscription.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <h2 style="margin: 0 0 12px;">Month-to-month hosting canceled</h2>
        <p><strong>Subscription:</strong> <a href="${dashboardBase}/subscriptions/${escapeHtml(subscription.id)}">${escapeHtml(subscription.id)}</a></p>
        <p><strong>Status:</strong> ${escapeHtml(subscription.status)}</p>
        <p style="font-size: 14px; color: #52525b;">Lead status set to hosting_canceled. Site may still be live until you deprovision hosting manually.</p>
      </div>
    `,
  });

  if (error) {
    console.error("[webhook] Hosting canceled alert failed:", error);
  }
}
