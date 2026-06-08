import { Type, type ToolListUnion } from "@google/genai";
import { after } from "next/server";
import { isValidEmail } from "@/lib/validate-email";
import { getVoiceDemoLead, updateVoiceDemoLead } from "@/lib/voice-demo-db";
import { upsertPlumbingJob } from "@/lib/voice-demo-plumbing-db";
import {
  sendPlumbingDemoEmail,
  type PlumbingEmailPayload,
  type PlumbingEmailTemplate,
} from "@/lib/voice-demo-plumbing-email";

/** Return tool response immediately; Resend runs after the HTTP response (keeps live WS responsive). */
function schedulePlumbingBookingEmail(
  leadId: string,
  template: PlumbingEmailTemplate,
  payload: PlumbingEmailPayload
): void {
  after(async () => {
    const sent = await sendPlumbingDemoEmail(template, payload);
    if (sent) {
      await upsertPlumbingJob({
        leadId,
        confirmationEmailSentAt: new Date().toISOString(),
      });
    }
  });
}

export function voiceDemoPlumbingToolDeclarations(): ToolListUnion {
  return [
    {
      functionDeclarations: [
        {
          name: "save_plumbing_contact",
          description:
            "Save caller contact details as you collect them — name, email, phone, or service address.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              serviceAddress: { type: Type.STRING },
            },
          },
        },
        {
          name: "book_plumbing_appointment",
          description:
            "Book or dispatch appointment when you have name, address, email, service type, and date/time. Sends confirmation email automatically.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              email: { type: Type.STRING },
              serviceAddress: { type: Type.STRING },
              serviceType: { type: Type.STRING },
              appointmentDate: { type: Type.STRING },
              timeWindow: { type: Type.STRING },
              priceRange: { type: Type.STRING },
              flowName: { type: Type.STRING },
              isEmergency: { type: Type.BOOLEAN },
              promoApplied: { type: Type.BOOLEAN },
              issueDescription: { type: Type.STRING },
            },
            required: ["name", "email", "serviceAddress", "serviceType"],
          },
        },
        {
          name: "send_plumbing_email",
          description:
            "Send quote follow-up, promo, or after-hours email. Templates: quote_followup, promo, after_hours.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              email: { type: Type.STRING },
              name: { type: Type.STRING },
              template: {
                type: Type.STRING,
                description: "quote_followup | promo | after_hours",
              },
              serviceType: { type: Type.STRING },
              priceRange: { type: Type.STRING },
              inquirySummary: { type: Type.STRING },
            },
            required: ["email", "name", "template"],
          },
        },
      ],
    },
  ];
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

const VALID_TEMPLATES = new Set<PlumbingEmailTemplate>([
  "quote_followup",
  "promo",
  "after_hours",
]);

export async function executeVoiceDemoPlumbingTool(
  leadId: string,
  name: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const row = await getVoiceDemoLead(leadId);
  if (!row) return { ok: false, error: "Session not found" };

  if (!row.email_verified_at && !row.phone_verified_at) {
    return { ok: false, error: "Not verified yet" };
  }

  if (name === "save_plumbing_contact") {
    const patch: Parameters<typeof updateVoiceDemoLead>[1] = {};
    const visitorName = typeof args.name === "string" ? args.name.trim() : "";
    const email = typeof args.email === "string" ? args.email.trim().toLowerCase() : "";
    const phone = typeof args.phone === "string" ? args.phone.trim() : "";
    const serviceAddress =
      typeof args.serviceAddress === "string" ? args.serviceAddress.trim() : "";

    if (visitorName) patch.full_name = visitorName;
    if (email && isValidEmail(email)) patch.email = email;
    if (phone) patch.phone = phone;

    if (Object.keys(patch).length > 0) {
      await updateVoiceDemoLead(leadId, patch);
    }

    if (serviceAddress) {
      await upsertPlumbingJob({
        leadId,
        serviceAddress,
        status: "draft",
      });
    }

    return {
      ok: true,
      message: "Contact saved. Continue the conversation naturally.",
    };
  }

  if (name === "book_plumbing_appointment") {
    const visitorName = typeof args.name === "string" ? args.name.trim() : "";
    const email = typeof args.email === "string" ? args.email.trim().toLowerCase() : "";
    const serviceAddress =
      typeof args.serviceAddress === "string" ? args.serviceAddress.trim() : "";
    const serviceType = typeof args.serviceType === "string" ? args.serviceType.trim() : "";
    const appointmentDate =
      typeof args.appointmentDate === "string" ? args.appointmentDate.trim() : "";
    const timeWindow = typeof args.timeWindow === "string" ? args.timeWindow.trim() : "";
    const priceRange = typeof args.priceRange === "string" ? args.priceRange.trim() : "";
    const flowName = typeof args.flowName === "string" ? args.flowName.trim() : "";
    const issueDescription =
      typeof args.issueDescription === "string" ? args.issueDescription.trim() : "";
    const isEmergency = args.isEmergency === true;
    const promoApplied = args.promoApplied === true;

    if (!visitorName || !email || !isValidEmail(email) || !serviceAddress || !serviceType) {
      return { ok: false, error: "Need name, valid email, address, and service type." };
    }

    await updateVoiceDemoLead(leadId, {
      full_name: visitorName,
      email,
    });

    const status = isEmergency ? "emergency" : "booked";
    const saved = await upsertPlumbingJob({
      leadId,
      status,
      flowName: flowName || null,
      serviceType,
      serviceAddress,
      appointmentDate: appointmentDate || null,
      timeWindow: timeWindow || null,
      priceRange: priceRange || null,
      isEmergency,
      promoApplied,
      customerEmail: email,
      notes: issueDescription ? { issueDescription } : undefined,
    });

    if (!saved.ok) {
      return { ok: false, error: saved.error };
    }

    const template: PlumbingEmailTemplate = isEmergency ? "emergency" : "appointment";
    schedulePlumbingBookingEmail(leadId, template, {
      to: email,
      firstName: firstName(visitorName),
      serviceType,
      appointmentDate: appointmentDate || (isEmergency ? "Emergency dispatch" : undefined),
      timeWindow: timeWindow || (isEmergency ? "Within 2 hours" : undefined),
      serviceAddress,
      priceRange: priceRange || undefined,
      issueDescription: issueDescription || serviceType,
      promoApplied,
    });

    return {
      ok: true,
      booked: true,
      emailSent: true,
      status,
      message:
        "Appointment booked. Confirmation email is sending — confirm address, date, and time warmly with the caller and stay on the line.",
    };
  }

  if (name === "send_plumbing_email") {
    const email = typeof args.email === "string" ? args.email.trim().toLowerCase() : "";
    const visitorName = typeof args.name === "string" ? args.name.trim() : "";
    const templateRaw = typeof args.template === "string" ? args.template.trim() : "";
    const serviceType = typeof args.serviceType === "string" ? args.serviceType.trim() : "";
    const priceRange = typeof args.priceRange === "string" ? args.priceRange.trim() : "";
    const inquirySummary =
      typeof args.inquirySummary === "string" ? args.inquirySummary.trim() : "";

    if (!email || !isValidEmail(email) || !visitorName) {
      return { ok: false, error: "Need valid email and name." };
    }

    if (!VALID_TEMPLATES.has(templateRaw as PlumbingEmailTemplate)) {
      return { ok: false, error: "Invalid template. Use quote_followup, promo, or after_hours." };
    }

    const template = templateRaw as PlumbingEmailTemplate;
    const sent = await sendPlumbingDemoEmail(template, {
      to: email,
      firstName: firstName(visitorName),
      serviceType: serviceType || undefined,
      priceRange: priceRange || undefined,
      inquirySummary: inquirySummary || undefined,
    });

    if (!sent) {
      return { ok: false, error: "Could not send email." };
    }

    if (template === "quote_followup") {
      await upsertPlumbingJob({
        leadId,
        status: "quote_sent",
        customerEmail: email,
        serviceType: serviceType || null,
        priceRange: priceRange || null,
      });
    }

    return {
      ok: true,
      emailSent: true,
      message: "Email sent. Tell the caller briefly it's on its way.",
    };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}
