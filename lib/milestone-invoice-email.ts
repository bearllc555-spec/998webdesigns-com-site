import {
  formatCheckoutUsd,
  paymentChannelLabel,
  type PaymentChannel,
} from "@/lib/checkout-pricing";
import {
  type DesignMilestoneKey,
  milestoneCheckoutTotalCents,
  milestoneLabel,
  milestoneShortLabel,
} from "@/lib/design-milestone-payments";
import { sendTwilioSms } from "@/lib/twilio-sms";

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

async function sendResendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[milestone-invoice] RESEND_API_KEY not set");
    return false;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to,
    subject,
    html,
  });
  if (error) {
    console.warn("[milestone-invoice] send failed:", error);
    return false;
  }
  return true;
}

export async function sendMilestoneInvoiceEmail(params: {
  fullName: string;
  email: string;
  businessName: string;
  milestone: DesignMilestoneKey;
  promoCode: string;
  paymentChannel: PaymentChannel;
  checkoutUrl: string;
}): Promise<boolean> {
  const due = formatCheckoutUsd(
    milestoneCheckoutTotalCents(params.milestone, params.paymentChannel, params.promoCode)
  );
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
      <p>Hi ${escapeHtml(params.fullName)},</p>
      <p>Your ${escapeHtml(milestoneShortLabel(params.milestone))} invoice for <strong>${escapeHtml(params.businessName)}</strong> is ready.</p>
      <p><strong>Milestone:</strong> ${escapeHtml(milestoneLabel(params.milestone))}</p>
      <p><strong>Amount due:</strong> ${escapeHtml(due)}</p>
      <p><strong>Payment method:</strong> ${escapeHtml(paymentChannelLabel(params.paymentChannel))}</p>
      <p><a href="${escapeHtml(params.checkoutUrl)}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Pay securely</a></p>
      <p style="font-size: 14px; color: #52525b;">Questions? hello@998webdesigns.com.</p>
    </div>
  `;

  return sendResendEmail(
    params.email,
    `Design fee invoice — ${milestoneShortLabel(params.milestone)} — 998 web designs`,
    html
  );
}

export async function sendMilestoneInvoiceSms(params: {
  phone: string;
  fullName: string;
  milestone: DesignMilestoneKey;
  checkoutUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const label = milestoneShortLabel(params.milestone);
  const body = `Hi ${params.fullName.split(" ")[0] || "there"} — your 998 web designs ${label} invoice is ready: ${params.checkoutUrl}`;
  return sendTwilioSms(params.phone, body);
}
