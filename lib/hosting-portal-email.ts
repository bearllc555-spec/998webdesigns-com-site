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

export async function sendHostingPortalMagicLinkEmail(
  email: string,
  magicLinkUrl: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[hosting-portal] RESEND_API_KEY not set, skipping magic link email");
    return false;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: email,
    subject: "Manage your hosting billing - 998 web designs",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <p>Hi,</p>
        <p>You asked to manage month-to-month hosting billing for your 998 web designs account.</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(magicLinkUrl)}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">Open Stripe billing portal</a>
        </p>
        <p style="font-size: 14px; color: #52525b;">This link expires in 15 minutes and works once. You can update your card, view invoices, or cancel hosting (effective at the end of your current billing period).</p>
        <p style="font-size: 14px; color: #52525b;">If you did not request this, ignore this email. Questions? Write hello@998webdesigns.com.</p>
        <p style="font-size: 14px; color: #71717a; margin-top: 32px;">998 web designs &middot; A Bear LLC digital property</p>
      </div>
    `,
  });

  if (error) {
    console.warn("[hosting-portal] Resend magic link failed:", error);
    return false;
  }

  return true;
}
