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

export type ContactInternalEmailInput = {
  name: string;
  email: string;
  businessName: string;
  message: string;
};

/** Alert hello@998webdesigns.com when the Get in Touch form is submitted. */
export async function sendContactInternalEmail(
  input: ContactInternalEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "998 web designs <website@998webdesigns.com>",
    to: "hello@998webdesigns.com",
    subject: `New Contact Form Submission from ${input.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
        <p><strong>Company:</strong> ${input.businessName ? escapeHtml(input.businessName) : "&nbsp;"}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; background-color: #f5f5f5; padding: 12px; border-radius: 4px;">
          ${escapeHtml(input.message)}
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[contact] internal alert email error:", error);
    return { ok: false, error: "Failed to send email" };
  }

  return { ok: true };
}
