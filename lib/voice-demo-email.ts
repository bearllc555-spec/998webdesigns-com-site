import { marketingSiteOrigin } from "@/lib/site-origin";
import { VOICE_DEMO_PROMO_CODE } from "@/lib/voice-demo-constants";
import { designPromoSummary } from "@/lib/design-promo";

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
    console.warn("[voice-demo-email] RESEND_API_KEY not set");
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
    console.warn("[voice-demo-email] send failed:", error);
    return false;
  }
  return true;
}

export async function sendVoiceDemoVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px; color: #18181b;">
      <p style="font-size: 16px;">Your voice demo verification code:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.2em; margin: 16px 0;">${escapeHtml(code)}</p>
      <p style="font-size: 14px; color: #52525b;">Open the assistant on ${escapeHtml(marketingSiteOrigin())} and read this code aloud. It expires in 15 minutes.</p>
    </div>
  `;
  return sendResendEmail(email, "Your 998 voice demo code", html);
}

export async function sendVoiceDemoPromoEmail(
  email: string,
  name: string | null
): Promise<boolean> {
  const greeting = name?.trim() ? escapeHtml(name.trim().split(" ")[0]!) : "there";
  const summary = designPromoSummary(VOICE_DEMO_PROMO_CODE) ?? "20% off design fee only";
  const startUrl = `${marketingSiteOrigin()}/start`;

  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px; color: #18181b;">
      <p style="font-size: 16px;">Hi ${greeting},</p>
      <p style="font-size: 15px; color: #3f3f46;">Thanks for trying our voice assistant. Here is your code:</p>
      <p style="font-size: 28px; font-weight: 700; margin: 16px 0;">${escapeHtml(VOICE_DEMO_PROMO_CODE)}</p>
      <p style="font-size: 14px; color: #52525b;">${escapeHtml(summary)}. Enter it on the last step before checkout at <a href="${startUrl}">${escapeHtml(startUrl)}</a>.</p>
    </div>
  `;

  return sendResendEmail(email, "Your 20% design fee code - 998 web designs", html);
}
