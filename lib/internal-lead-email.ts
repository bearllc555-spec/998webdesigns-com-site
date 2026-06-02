import type Stripe from "stripe";
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

  const payLabel =
    lead.paymentOption === "full"
      ? "$998 pay in full (selected)"
      : "$499 deposit (selected)";

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
        <p><strong>Plan:</strong> ${escapeHtml(payLabel)}</p>
        <p><strong>Name:</strong> ${escapeHtml(lead.fullName)}</p>
        <p><strong>Business:</strong> ${escapeHtml(lead.businessName)}</p>
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

/** Urgent alert when deposit paid but $499 balance hold could not be placed. */
export async function sendBalanceHoldFailedEmail(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const meta = session.metadata ?? {};
  const email =
    session.customer_details?.email ?? meta.email ?? session.customer_email ?? "(unknown)";
  const dash = stripeDashboardBase();

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: NOTIFY_TO,
    subject: `[998] ACTION REQUIRED — balance hold missing for ${meta.businessName || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <h2 style="margin: 0 0 12px; color: #b45309;">Balance hold not created</h2>
        <p>Deposit checkout completed but the $499 authorization hold failed or was skipped.</p>
        <p><strong>Customer:</strong> ${escapeHtml(meta.fullName || "—")} / ${escapeHtml(email)}</p>
        <p><strong>Business:</strong> ${escapeHtml(meta.businessName || "—")}</p>
        <p><strong>Checkout session:</strong> <a href="${dash}/checkout/sessions/${session.id}">${escapeHtml(session.id)}</a></p>
        <p style="font-size: 14px; color: #52525b;">Create the hold manually in Stripe or re-send the webhook from the Dashboard. Stripe will retry this webhook automatically.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`[webhook] Balance-hold alert failed: ${JSON.stringify(error)}`);
  }
}

export async function sendInternalPaymentEmail(
  session: Stripe.Checkout.Session,
  balanceHoldIntentId?: string | null
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const meta = session.metadata ?? {};
  const paymentType = meta.paymentType === "full" ? "Paid in full ($998)" : "Deposit paid ($499)";
  const email =
    session.customer_details?.email ?? meta.email ?? session.customer_email ?? "(unknown)";
  const amount =
    session.amount_total != null
      ? `$${(session.amount_total / 100).toFixed(2)} ${(session.currency ?? "usd").toUpperCase()}`
      : "—";

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const dashboardBase = stripeDashboardBase();
  const isDeposit = meta.paymentType !== "full";
  const holdId = balanceHoldIntentId;

  const captureBlock = isDeposit
    ? holdId
      ? `<p><strong>Balance hold:</strong> <a href="${dashboardBase}/payments/${holdId}">${escapeHtml(holdId)}</a></p>
         <p style="font-size: 14px; color: #52525b;">When they approve the design, capture the $499 balance: POST <code>https://998webdesigns.com/api/admin/capture-balance</code> with JSON <code>{"email":"${escapeHtml(email)}"}</code> and header <code>Authorization: Bearer &lt;BALANCE_CAPTURE_SECRET&gt;</code> (set in Vercel). See DEPLOYMENT.md.</p>`
      : `<p style="font-size: 14px; color: #b45309;"><strong>Warning:</strong> Balance hold was not created — check Vercel logs for this webhook.</p>`
    : `<p style="font-size: 14px; color: #52525b;">Paid in full — no balance capture needed.</p>`;

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: NOTIFY_TO,
    subject: `[998] ${paymentType} — ${meta.businessName || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <h2 style="margin: 0 0 12px;">New checkout completed</h2>
        <p><strong>Status:</strong> ${escapeHtml(paymentType)}</p>
        <p><strong>Amount:</strong> ${escapeHtml(amount)}</p>
        <p><strong>Name:</strong> ${escapeHtml(meta.fullName || "—")}</p>
        <p><strong>Business:</strong> ${escapeHtml(meta.businessName || "—")}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Hosting:</strong> ${escapeHtml(meta.hostingChoice || "—")}</p>
        <p><strong>Stripe session:</strong> <a href="${dashboardBase}/checkout/sessions/${session.id}">${escapeHtml(session.id)}</a></p>
        ${captureBlock}
        <p style="font-size: 14px; color: #71717a; margin-top: 24px;">Sent automatically from /api/stripe/webhook</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`[webhook] Internal payment alert failed: ${JSON.stringify(error)}`);
  }
}
