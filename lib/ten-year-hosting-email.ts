import { HOSTING_TRIAL_DAYS } from "@/lib/hosting-policy";
import { formatCheckoutUsd } from "@/lib/checkout-pricing";
import { HOSTING_LIFETIME_DEFERRED_PRODUCT } from "@/lib/products";

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

export async function sendTenYearHostingCheckoutEmail(params: {
  email: string;
  fullName: string;
  businessName: string;
  checkoutUrl: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[lifetime-hosting] RESEND_API_KEY not set, skipping hosting checkout email");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const amount = formatCheckoutUsd(HOSTING_LIFETIME_DEFERRED_PRODUCT.priceInCents);

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: params.email,
    subject: `Your ${HOSTING_TRIAL_DAYS}-day free hosting period has ended — complete lifetime hosting`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <p>Hi ${escapeHtml(params.fullName)},</p>
        <p>Your complimentary hosting period for <strong>${escapeHtml(params.businessName)}</strong> has ended. To keep your site hosted for life, complete your one-time lifetime hosting payment.</p>
        <p><strong>Amount due:</strong> ${escapeHtml(amount)} (lifetime hosting — begins when this payment clears)</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(params.checkoutUrl)}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">Pay for lifetime hosting</a>
        </p>
        <p style="font-size: 14px; color: #52525b;">Questions? Reply to this email or write hello@998webdesigns.com.</p>
      </div>
    `,
  });

  if (error) {
    console.warn("[lifetime-hosting] Resend email failed:", error);
  }
}
