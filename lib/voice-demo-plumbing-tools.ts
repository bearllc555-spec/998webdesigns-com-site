import { Type, type ToolListUnion } from "@google/genai";
import { after } from "next/server";
import { isValidEmail } from "@/lib/validate-email";
import { getVoiceDemoLead, updateVoiceDemoLead } from "@/lib/voice-demo-db";
import {
  getLatestPlumbingJobForLead,
  upsertPlumbingJob,
  type PlumbingJobRow,
} from "@/lib/voice-demo-plumbing-db";
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

function schedulePlumbingPromoEmail(leadId: string, payload: PlumbingEmailPayload): void {
  after(async () => {
    await sendPlumbingDemoEmail("promo", payload);
    await upsertPlumbingJob({ leadId, promoApplied: true });
  });
}

function bookingEmailPayloadFromJob(
  job: PlumbingJobRow,
  email: string,
  visitorName: string
): PlumbingEmailPayload {
  const isEmergency = job.is_emergency;
  return {
    to: email,
    firstName: firstName(visitorName),
    serviceType: job.service_type ?? undefined,
    appointmentDate: job.appointment_date ?? (isEmergency ? "Emergency dispatch" : undefined),
    timeWindow: job.time_window ?? (isEmergency ? "Within 2 hours" : undefined),
    serviceAddress: job.service_address ?? undefined,
    priceRange: job.price_range ?? undefined,
    issueDescription:
      typeof job.notes?.issueDescription === "string"
        ? job.notes.issueDescription
        : (job.service_type ?? undefined),
    promoApplied: job.promo_applied,
  };
}

function scheduleEmailsForBookedJob(
  leadId: string,
  job: PlumbingJobRow,
  email: string,
  visitorName: string,
  opts?: { includePromo?: boolean }
): void {
  const payload = bookingEmailPayloadFromJob(job, email, visitorName);
  const template: PlumbingEmailTemplate = job.is_emergency ? "emergency" : "appointment";
  schedulePlumbingBookingEmail(leadId, template, payload);
  if (opts?.includePromo || job.promo_applied) {
    schedulePlumbingPromoEmail(leadId, {
      to: email,
      firstName: firstName(visitorName),
      serviceType: job.service_type ?? undefined,
    });
  }
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

    let emailMessage = "Contact saved. Continue the conversation naturally.";
    if (email && isValidEmail(email)) {
      const job = await getLatestPlumbingJobForLead(leadId);
      const priorEmail = job?.customer_email?.trim().toLowerCase() ?? "";
      if (
        job &&
        (job.status === "booked" || job.status === "emergency") &&
        email !== priorEmail
      ) {
        await upsertPlumbingJob({ leadId, customerEmail: email });
        const refreshedJob = await getLatestPlumbingJobForLead(leadId);
        const nameForEmail = visitorName || row.full_name?.trim() || "Guest";
        if (refreshedJob) {
          scheduleEmailsForBookedJob(leadId, refreshedJob, email, nameForEmail, {
            includePromo: refreshedJob.promo_applied,
          });
        }
        emailMessage =
          "Contact saved. Confirmation and promo emails are sending to the updated address — tell the caller to check inbox and spam.";
      }
    }

    return {
      ok: true,
      message: emailMessage,
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
    const refreshedJob = await getLatestPlumbingJobForLead(leadId);
    if (refreshedJob) {
      scheduleEmailsForBookedJob(leadId, refreshedJob, email, visitorName, {
        includePromo: promoApplied,
      });
    }

    return {
      ok: true,
      booked: true,
      emailSent: true,
      status,
      message: promoApplied
        ? "Appointment booked. Confirmation and $50 promo emails are sending — confirm details and stay on the line."
        : "Appointment booked. Confirmation email is sending — confirm address, date, and time warmly with the caller and stay on the line.",
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
    const emailPayload: PlumbingEmailPayload = {
      to: email,
      firstName: firstName(visitorName),
      serviceType: serviceType || undefined,
      priceRange: priceRange || undefined,
      inquirySummary: inquirySummary || undefined,
    };

    after(async () => {
      const sent = await sendPlumbingDemoEmail(template, emailPayload);
      if (!sent) return;
      if (template === "quote_followup") {
        await upsertPlumbingJob({
          leadId,
          status: "quote_sent",
          customerEmail: email,
          serviceType: serviceType || null,
          priceRange: priceRange || null,
        });
      }
      if (template === "promo") {
        await upsertPlumbingJob({ leadId, promoApplied: true, customerEmail: email });
      }
    });

    return {
      ok: true,
      emailSent: true,
      message: "Email sent. Tell the caller briefly it's on its way.",
    };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}
