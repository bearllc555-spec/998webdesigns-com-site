import {
  PLUMBING_DEMO_BUSINESS_NAME,
  PLUMBING_DEMO_EMAIL_DISPLAY,
  PLUMBING_DEMO_PROMO_AMOUNT,
} from "@/lib/voice-demo-plumbing-constants";

export type PlumbingEmailTemplate =
  | "appointment"
  | "emergency"
  | "quote_followup"
  | "after_hours"
  | "promo";

export type PlumbingEmailPayload = {
  to: string;
  firstName: string;
  serviceType?: string;
  appointmentDate?: string;
  timeWindow?: string;
  serviceAddress?: string;
  priceRange?: string;
  issueDescription?: string;
  promoApplied?: boolean;
  inquirySummary?: string;
};

/** ISO YYYY-MM-DD from Jarvis tools → "Wednesday, June 10, 2026" for customer emails. */
export function formatPlumbingAppointmentDateForEmail(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "TBD";
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!iso) return trimmed;
  const year = Number(iso[1]);
  const month = Number(iso[2]);
  const day = Number(iso[3]);
  const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (Number.isNaN(dt.getTime())) return trimmed;
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
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

function plumbingFromAddress(): string {
  const configured = process.env.PLUMBING_DEMO_EMAIL_FROM?.trim();
  if (configured) return configured;
  return `${PLUMBING_DEMO_BUSINESS_NAME} <website@998webdesigns.com>`;
}

async function sendPlumbingResendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[voice-demo-plumbing-email] RESEND_API_KEY not set");
    return false;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: plumbingFromAddress(),
    to,
    subject,
    html,
  });
  if (error) {
    console.warn("[voice-demo-plumbing-email] send failed:", error);
    return false;
  }
  return true;
}

function footerBlock(): string {
  return `
    <p style="font-size: 13px; color: #52525b; margin-top: 24px;">
      ${escapeHtml(PLUMBING_DEMO_BUSINESS_NAME)}<br />
      ${escapeHtml(PLUMBING_DEMO_EMAIL_DISPLAY)}<br />
      Serving NJ, NY &amp; CT | Licensed &amp; Insured | 1-Year Labor Warranty
    </p>
  `;
}

function wrapBody(inner: string): string {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px; color: #18181b; line-height: 1.5;">
      ${inner}
      ${footerBlock()}
    </div>
  `;
}

export function buildPlumbingEmail(
  template: PlumbingEmailTemplate,
  payload: PlumbingEmailPayload
): { subject: string; html: string } {
  const name = escapeHtml(payload.firstName);
  const service = escapeHtml(payload.serviceType ?? "Plumbing service");
  const date = escapeHtml(
    formatPlumbingAppointmentDateForEmail(payload.appointmentDate ?? "TBD")
  );
  const window = escapeHtml(payload.timeWindow ?? "TBD");
  const address = escapeHtml(payload.serviceAddress ?? "On file");
  const price = escapeHtml(payload.priceRange ?? "Free estimate");
  const promoBlock = payload.promoApplied
    ? `<p style="margin-top: 20px; padding: 16px; border: 1px solid #2563eb; border-radius: 8px; background: #f8fafc;">
          <strong>Your $${PLUMBING_DEMO_PROMO_AMOUNT} coupon</strong> is enclosed with this confirmation.<br />
          Mention your name when we arrive — it applies to this visit.
        </p>`
    : "";

  switch (template) {
    case "appointment":
      return {
        subject: "Your Appointment is Confirmed — Metro Plumbing & Drain",
        html: wrapBody(`
          <p>Hi ${name},</p>
          <p>Your appointment with ${escapeHtml(PLUMBING_DEMO_BUSINESS_NAME)} is confirmed.</p>
          <p><strong>Service:</strong> ${service}<br />
          <strong>Date:</strong> ${date}<br />
          <strong>Time window:</strong> ${window}<br />
          <strong>Address:</strong> ${address}<br />
          <strong>Estimated cost:</strong> ${price}</p>
          ${promoBlock}
          <p>Your technician will call or text about 30 minutes before arriving. Reply to this email if you need to reschedule.</p>
        `),
      };
    case "emergency":
      return {
        subject: "Emergency Tech Dispatched — Metro Plumbing & Drain",
        html: wrapBody(`
          <p>Hi ${name},</p>
          <p>We've received your emergency request and a technician has been dispatched.</p>
          <p><strong>Address:</strong> ${address}<br />
          <strong>Issue:</strong> ${escapeHtml(payload.issueDescription ?? service)}<br />
          <strong>Estimated arrival:</strong> Within 2 hours</p>
          <p><strong>While you wait:</strong> If water is actively flowing, shut off your main water valve (near meter, basement, or foundation). Move valuables away from wet areas. Do not touch electrical switches near standing water.</p>
          <p>The $150 emergency dispatch fee applies toward your repair cost if you proceed with the work.</p>
        `),
      };
    case "quote_followup":
      return {
        subject: "Your Metro Plumbing & Drain Quote — Here's What We Discussed",
        html: wrapBody(`
          <p>Hi ${name},</p>
          <p>Thanks for reaching out. Here's a summary of what we discussed:</p>
          <p><strong>Service:</strong> ${service}<br />
          <strong>Estimated range:</strong> ${price}</p>
          <p>Free estimates on non-emergency work. 1-year labor warranty. Licensed in NJ and NY.</p>
          <p><strong>Your $${PLUMBING_DEMO_PROMO_AMOUNT} discount</strong> is available when you book — reply to this email when you're ready.</p>
        `),
      };
    case "after_hours":
      return {
        subject: "We Got Your Message — Metro Plumbing & Drain",
        html: wrapBody(`
          <p>Hi ${name},</p>
          <p>Thanks for contacting ${escapeHtml(PLUMBING_DEMO_BUSINESS_NAME)}. Our office is currently closed, but we received your message.</p>
          <p><strong>Regarding:</strong> ${escapeHtml(payload.inquirySummary ?? service)}</p>
          <p>Someone will call you back on the next business day (Mon–Fri 7am–7pm, Sat 8am–4pm).</p>
          <p>If your situation becomes urgent — active leak, burst pipe, sewage backup — call back and tell Jarvis it's an emergency. We dispatch 24/7 within 2 hours.</p>
        `),
      };
    case "promo":
      return {
        subject: `Your $${PLUMBING_DEMO_PROMO_AMOUNT} Discount — Metro Plumbing & Drain`,
        html: wrapBody(`
          <p>Hi ${name},</p>
          <p>Here's your $${PLUMBING_DEMO_PROMO_AMOUNT} discount from ${escapeHtml(PLUMBING_DEMO_BUSINESS_NAME)}, as discussed.</p>
          <p><strong>Applied to:</strong> ${service} — or any service you book.</p>
          <p>Reply to this email or mention your name when you confirm — we'll apply it automatically.</p>
        `),
      };
  }
}

export async function sendPlumbingDemoEmail(
  template: PlumbingEmailTemplate,
  payload: PlumbingEmailPayload
): Promise<boolean> {
  const { subject, html } = buildPlumbingEmail(template, payload);
  return sendPlumbingResendEmail(payload.to, subject, html);
}
