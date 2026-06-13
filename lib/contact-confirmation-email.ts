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

export type ContactConfirmationInput = {
  name: string;
  email: string;
};

/** Auto-reply to the person who submitted the Get in Touch form. */
export async function sendContactConfirmationEmail(
  input: ContactConfirmationInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "998 web designs <hello@998webdesigns.com>",
    to: input.email,
    subject: "Thank you for reaching out - 998 web designs",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Thank you for reaching out to 998webdesigns.com. Here&apos;s what you can expect from us:</p>
        <p>We have written this automated response as a confirmation that your message has been delivered to us. Someone from our team will reply to your message shortly. We appreciate your patience.</p>
        <p style="margin-top: 24px;">The 998webdesigns Team</p>
        <p style="font-size: 14px; color: #52525b; margin-top: 32px;">Questions? Reply to this email or write hello@998webdesigns.com.</p>
      </div>
    `,
  });

  if (error) {
    console.error("[contact] confirmation email error:", error);
    return { ok: false, error: "Failed to send confirmation email" };
  }

  return { ok: true };
}
