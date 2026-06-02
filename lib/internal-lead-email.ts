import type Stripe from "stripe";
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

export async function sendInternalPaymentEmail(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[webhook] RESEND_API_KEY not set, skipping internal payment alert");
    return;
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

  const dashboardBase =
    stripeKeyMode() === "live"
      ? "https://dashboard.stripe.com"
      : "https://dashboard.stripe.com/test";

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
        <p style="font-size: 14px; color: #71717a; margin-top: 24px;">Sent automatically from /api/stripe/webhook</p>
      </div>
    `,
  });

  if (error) {
    console.warn("[webhook] Internal payment alert email failed:", error);
  }
}
