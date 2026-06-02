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

export async function sendInternalPaymentEmail(
  session: Stripe.Checkout.Session
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

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: NOTIFY_TO,
    subject: `[998] Paid in full — ${meta.businessName || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <h2 style="margin: 0 0 12px;">New checkout completed</h2>
        <p><strong>Status:</strong> Paid in full</p>
        <p><strong>Amount:</strong> ${escapeHtml(amount)}</p>
        <p><strong>Name:</strong> ${escapeHtml(meta.fullName || "—")}</p>
        <p><strong>Business:</strong> ${escapeHtml(meta.businessName || "—")}</p>
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
