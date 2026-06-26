import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";
import { SUPPORT_EMAIL } from "@/lib/transactional-email";

export type AestheticsEmailTemplate = "confirmation" | "follow_up" | "nurture" | "after_hours";

export type AestheticsEmailPayload = {
  to: string;
  firstName: string;
  serviceType?: string;
  appointmentDate?: string;
  timeWindow?: string;
  brand: AestheticsDemoBrand;
};

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

function fromAddress(brand: AestheticsDemoBrand): string {
  const name = getDemoBrandConfigByVertical(brand).brandName;
  const configured = process.env.AESTHETICS_DEMO_EMAIL_FROM?.trim();
  if (configured) return configured;
  return `${name} <${SUPPORT_EMAIL}>`;
}

export async function sendAestheticsDemoEmail(
  template: AestheticsEmailTemplate,
  payload: AestheticsEmailPayload
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[voice-demo-aesthetics-email] RESEND_API_KEY not set");
    return false;
  }
  const config = getDemoBrandConfigByVertical(payload.brand);
  const name = escapeHtml(payload.firstName);
  const service = escapeHtml(payload.serviceType ?? "your visit");
  const date = escapeHtml(payload.appointmentDate ?? "TBD");
  const time = escapeHtml(payload.timeWindow ?? "TBD");

  let subject = `Your ${config.brandName} appointment`;
  let body = `<p>Hi ${name},</p><p>You're confirmed for ${service} on ${date} at ${time}.</p>`;

  if (template === "follow_up") {
    subject = `A note from ${config.brandName}`;
    body = `<p>Hi ${name},</p><p>We hope you're feeling great after your recent visit. Reply anytime if you have questions — a provider will follow up.</p>`;
  } else if (template === "nurture") {
    subject = `Your questions, answered — ${config.brandName}`;
    body = `<p>Hi ${name},</p><p>Thanks for your interest in ${service}. ${escapeHtml(config.promotions.newPatient)}.</p>`;
  } else if (template === "after_hours") {
    subject = `We got your message — ${config.brandName}`;
    body = `<p>Hi ${name},</p><p>Thanks for reaching out after hours. We'll text you shortly and hold a spot when you're ready.</p>`;
  }

  body += `<p style="font-size:13px;color:#52525b;margin-top:24px;">${escapeHtml(config.brandName)} · ${escapeHtml(config.address)} · Demo only</p>`;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: fromAddress(payload.brand),
    to: payload.to,
    subject,
    html: `<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;line-height:1.5;">${body}</div>`,
  });
  if (error) {
    console.warn("[voice-demo-aesthetics-email] send failed:", error);
    return false;
  }
  return true;
}

export function buildAestheticsConfirmationSms(
  brand: AestheticsDemoBrand,
  firstName: string,
  service: string,
  when: string
): string {
  const config = getDemoBrandConfigByVertical(brand);
  return `Hi ${firstName}, this is ${config.brandName} — you're confirmed for ${service} ${when}. Reply C to confirm.`;
}
