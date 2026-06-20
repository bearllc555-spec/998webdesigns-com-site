import {
  createDiscoveryCloseToken,
  createDiscoveryScheduleToken,
} from "@/lib/discovery-token";
import { marketingSiteOrigin } from "@/lib/site-origin";
import { TRANSACTIONAL_FROM } from "@/lib/transactional-email";
import { sendTwilioSms } from "@/lib/twilio-sms";

export function buildDiscoveryCloseUrl(prospectId: string): string | null {
  const token = createDiscoveryCloseToken(prospectId);
  if (!token) return null;
  return `${marketingSiteOrigin()}/close?token=${encodeURIComponent(token)}`;
}

export function buildDiscoveryScheduleUrl(prospectId: string): string | null {
  const token = createDiscoveryScheduleToken(prospectId);
  if (!token) return null;
  return `${marketingSiteOrigin()}/book/schedule?token=${encodeURIComponent(token)}`;
}

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
    console.warn("[discovery-email] RESEND_API_KEY not set");
    return false;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: TRANSACTIONAL_FROM,
    to,
    subject,
    html,
  });
  if (error) {
    console.warn("[discovery-email] send failed:", error);
    return false;
  }
  return true;
}

export async function sendDiscoveryScheduleEmail(
  fullName: string,
  email: string,
  prospectId: string
): Promise<boolean> {
  const url = buildDiscoveryScheduleUrl(prospectId);
  if (!url) return false;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>Your phone is verified. Click below to book your discovery call - opening the link also confirms your email.</p>
      <p><a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Book your call</a></p>
      <p style="font-size: 14px; color: #52525b;">This link expires in 48 hours. Questions? Reply or write hello@998webdesigns.com.</p>
    </div>
  `;

  return sendResendEmail(email, "Book your discovery call - 998 web designs", html);
}

export async function sendDiscoveryCloseEmail(
  fullName: string,
  email: string,
  prospectId: string
): Promise<boolean> {
  const url = buildDiscoveryCloseUrl(prospectId);
  if (!url) return false;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b; max-width: 560px;">
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>Great speaking with you. Your personalized checkout is ready - package and add-ons are pre-filled from our call.</p>
      <p><a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Review and pay</a></p>
      <p style="font-size: 14px; color: #52525b;">This link expires in 7 days. Do not share it. Questions? hello@998webdesigns.com.</p>
    </div>
  `;

  return sendResendEmail(email, "Your checkout link - 998 web designs", html);
}

export async function sendDiscoveryCloseSms(
  phoneE164: string,
  fullName: string,
  prospectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = buildDiscoveryCloseUrl(prospectId);
  if (!url) {
    return { ok: false, error: "Could not build checkout link" };
  }

  const firstName = fullName.trim().split(/\s+/)[0] || "there";
  const body = `Hi ${firstName} - your 998 web designs checkout is ready: ${url}`;
  return sendTwilioSms(phoneE164, body);
}
