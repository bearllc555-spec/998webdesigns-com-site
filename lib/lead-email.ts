import {
  checkoutDueTodayCents,
  formatCheckoutUsd,
  paymentChannelLabel,
} from "@/lib/checkout-pricing";
import { designPromoSummary } from "@/lib/design-promo";
import { hostingChoiceLabel } from "@/lib/hosting";
import type { ValidatedLead } from "./validate-lead";

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

export async function sendLeadCheckoutEmail(
  lead: ValidatedLead,
  checkoutUrl: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[leads] RESEND_API_KEY not set, skipping lead confirmation email");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const totalLabel = formatCheckoutUsd(
    checkoutDueTodayCents(lead.hostingChoice, lead.paymentChannel, lead.promoCode)
  );
  const promoLabel = designPromoSummary(lead.promoCode);
  const promoNote =
    lead.promoCode.trim() && promoLabel
      ? `<p><strong>Promo:</strong> ${escapeHtml(lead.promoCode.trim().toUpperCase())} (${escapeHtml(promoLabel)})</p>`
      : "";
  const methodLabel = paymentChannelLabel(lead.paymentChannel);
  const achNote =
    lead.paymentChannel === "ach"
      ? "<p style=\"font-size: 14px; color: #52525b;\">Bank payments (ACH) typically clear in a few business days. Your design clock starts once the transfer settles.</p>"
      : "";

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: lead.email,
    subject: "Complete your payment — 998 web designs",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <p>Hi ${escapeHtml(lead.fullName)},</p>
        <p>Thanks for submitting your project brief for <strong>${escapeHtml(lead.businessName)}</strong>. We received everything.</p>
        <p><strong>Hosting:</strong> ${escapeHtml(hostingChoiceLabel(lead.hostingChoice))}</p>
        <p><strong>Payment method:</strong> ${escapeHtml(methodLabel)}</p>
        ${promoNote}
        <p><strong>Amount due at checkout:</strong> ${escapeHtml(totalLabel)}${lead.hostingChoice === "ten_year" ? " (includes ten-year hosting)" : ""}${lead.hostingChoice === "monthly" ? " (includes your first month of hosting; $198/mo renews automatically)" : ""}</p>
        ${achNote}
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(checkoutUrl)}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">Continue to payment</a>
        </p>
        <p>After payment clears, the 7 business-day design clock starts. You will get a first draft within that window.</p>
        <p style="font-size: 14px; color: #52525b;">Questions? Reply to this email or write hello@998webdesigns.com.</p>
        <p style="font-size: 14px; color: #71717a; margin-top: 32px;">998 web designs &middot; A Bear LLC digital property</p>
      </div>
    `,
  });

  if (error) {
    console.warn("[leads] Resend lead email failed:", error);
  }
}
