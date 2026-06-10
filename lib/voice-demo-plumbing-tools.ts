import { Type, type ToolListUnion } from "@google/genai";
import { after } from "next/server";
import {
  buildEmailVoiceReadBack,
  pronounceEmailDomainForVoice,
  pronounceEmailForVoice,
  spellEmailLocalPartForVoice,
} from "@/lib/voice-demo-spell-email";
import {
  buildPlumbingContactReconfirmMessage,
  hasFullPersonName,
  plumbingContactFieldChanged,
  plumbingContactFieldSpoken,
  plumbingIntakeBlockedWithoutLastName,
  splitPersonName,
} from "@/lib/voice-demo-plumbing-contact-confirm";
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
import { resolvePlumbingPromoCodeForLead } from "@/lib/voice-demo-plumbing-promo-code";
import { isValidEmail } from "@/lib/validate-email";

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
    promoCode: job.promo_code ?? undefined,
  };
}

function scheduleEmailsForBookedJob(
  leadId: string,
  job: PlumbingJobRow,
  email: string,
  visitorName: string
): void {
  const payload = bookingEmailPayloadFromJob(job, email, visitorName);
  const template: PlumbingEmailTemplate = job.is_emergency ? "emergency" : "appointment";
  schedulePlumbingBookingEmail(leadId, template, payload);
}

export function voiceDemoPlumbingToolDeclarations(): ToolListUnion {
  return [
    {
      functionDeclarations: [
        {
          name: "save_plumbing_contact",
          description:
            "Save caller details as you collect them — call after each field (name, address, email, phone, date/time, service type). Tool response tells you how to reconfirm aloud before continuing.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              serviceAddress: { type: Type.STRING },
              serviceType: { type: Type.STRING },
              appointmentDate: { type: Type.STRING },
              timeWindow: { type: Type.STRING },
            },
          },
        },
        {
          name: "book_plumbing_appointment",
          description:
            "Book or dispatch appointment when you have name, address, email, service type, and date/time. Sends one confirmation email with a unique $50 coupon code enclosed (standard bookings).",
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
          name: "request_plumbing_callback",
          description:
            "Log a human callback when you cannot answer the caller's question confidently from the knowledge base. Requires name, phone, and what they asked.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Caller's full name" },
              phone: { type: Type.STRING, description: "Best callback number" },
              questionSummary: {
                type: Type.STRING,
                description: "Short summary of the question you could not answer confidently",
              },
            },
            required: ["name", "phone", "questionSummary"],
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

function plumbingCallbackPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return trimmed;
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
    const serviceType = typeof args.serviceType === "string" ? args.serviceType.trim() : "";
    const appointmentDate =
      typeof args.appointmentDate === "string" ? args.appointmentDate.trim() : "";
    const timeWindow = typeof args.timeWindow === "string" ? args.timeWindow.trim() : "";

    const jobBefore = await getLatestPlumbingJobForLead(leadId);
    const onFile = {
      name: row.full_name,
      email: row.email,
      phone: row.phone,
      serviceAddress: jobBefore?.service_address ?? null,
    };

    const nameOnFile = (visitorName || row.full_name || "").trim();
    const bookingIntake = Boolean(
      serviceType ||
        serviceAddress ||
        appointmentDate ||
        timeWindow ||
        phone ||
        email ||
        jobBefore?.service_type ||
        jobBefore?.service_address ||
        jobBefore?.customer_email
    );

    const lastNameBlock = plumbingIntakeBlockedWithoutLastName({
      nameOnFile,
      saving: {
        serviceAddress,
        phone,
        email,
        serviceType,
        appointmentDate,
        timeWindow,
      },
    });
    if (lastNameBlock) {
      return { ok: false, error: lastNameBlock };
    }

    if (visitorName) patch.full_name = visitorName;
    if (email && isValidEmail(email)) patch.email = email;
    if (phone) patch.phone = phone;

    if (Object.keys(patch).length > 0) {
      await updateVoiceDemoLead(leadId, patch);
    }

    const jobPatch: Parameters<typeof upsertPlumbingJob>[0] = { leadId, status: "draft" };
    let hasJobPatch = false;
    if (serviceAddress) {
      jobPatch.serviceAddress = serviceAddress;
      hasJobPatch = true;
    }
    if (serviceType) {
      jobPatch.serviceType = serviceType;
      hasJobPatch = true;
    }
    if (appointmentDate) {
      jobPatch.appointmentDate = appointmentDate;
      hasJobPatch = true;
    }
    if (timeWindow) {
      jobPatch.timeWindow = timeWindow;
      hasJobPatch = true;
    }
    if (email && isValidEmail(email)) {
      jobPatch.customerEmail = email;
      hasJobPatch = true;
    }
    if (hasJobPatch) {
      await upsertPlumbingJob(jobPatch);
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
        let refreshedJob = await getLatestPlumbingJobForLead(leadId);
        const nameForEmail = visitorName || row.full_name?.trim() || "Guest";
        if (refreshedJob) {
          if (
            refreshedJob.status === "booked" &&
            !refreshedJob.is_emergency &&
            (!refreshedJob.promo_applied || !refreshedJob.promo_code)
          ) {
            const promoCode = await resolvePlumbingPromoCodeForLead(leadId, true);
            await upsertPlumbingJob({
              leadId,
              promoApplied: true,
              promoCode: promoCode ?? null,
            });
            refreshedJob = (await getLatestPlumbingJobForLead(leadId)) ?? refreshedJob;
          }
          scheduleEmailsForBookedJob(leadId, refreshedJob, email, nameForEmail);
        }
        emailMessage =
          "Contact saved. Confirmation email (with unique $50 coupon code enclosed) is sending to the updated address — after reconfirming the new email aloud, tell the caller to check inbox and spam.";
      }
    }

    const gateEmail = row.email?.trim().toLowerCase() ?? "";
    const emailFromDemoLogin =
      Boolean(email && isValidEmail(email) && gateEmail && email === gateEmail);

    const { message: reconfirmMessage, focusField: reconfirmField } =
      buildPlumbingContactReconfirmMessage({
        bookingIntake:
          bookingIntake ||
          Boolean(visitorName && !hasFullPersonName(visitorName)) ||
          Boolean(nameOnFile && !hasFullPersonName(nameOnFile)),
        name:
          visitorName && plumbingContactFieldChanged("name", visitorName, onFile)
            ? visitorName
            : undefined,
        serviceAddress:
          serviceAddress &&
          plumbingContactFieldChanged("serviceAddress", serviceAddress, onFile)
            ? serviceAddress
            : undefined,
        email:
          email &&
          isValidEmail(email) &&
          plumbingContactFieldChanged("email", email, onFile)
            ? email
            : undefined,
        phone:
          phone && plumbingContactFieldChanged("phone", phone, onFile) ? phone : undefined,
        emailFromDemoLogin,
      });

    const spoken: Record<string, string> = {};
    if (reconfirmField === "name" && visitorName) spoken.name = visitorName;
    if (reconfirmField === "serviceAddress" && serviceAddress) {
      spoken.serviceAddress = serviceAddress;
    }
    if (reconfirmField === "email" && email && isValidEmail(email)) {
      const readBack = buildEmailVoiceReadBack(email);
      spoken.email = pronounceEmailForVoice(email);
      if (readBack) {
        spoken.emailLocalSpelled = readBack.localSpelled;
        spoken.emailDomain = readBack.domainSpoken;
      } else {
        spoken.emailLocalSpelled = spellEmailLocalPartForVoice(email);
        spoken.emailDomain = pronounceEmailDomainForVoice(email);
      }
    }
    if (reconfirmField === "phone" && phone) {
      const phoneSpoken = plumbingContactFieldSpoken("phone", phone);
      if (phoneSpoken) spoken.phone = phoneSpoken;
    }

    const unchangedNote =
      !reconfirmMessage &&
      (visitorName || serviceAddress || email || phone || appointmentDate || timeWindow || serviceType)
        ? " Contact updated — value already on file; do NOT read back again. Continue to the next question."
        : "";

    const message = reconfirmMessage
      ? `${reconfirmMessage}${emailMessage.includes("Confirmation email") ? ` Also: ${emailMessage.replace("Contact saved. ", "")}` : ""}`
      : `${emailMessage}${unchangedNote}`;

    return {
      ok: true,
      message,
      ...(reconfirmField ? { reconfirmField } : {}),
      ...(Object.keys(spoken).length > 0 ? { spoken } : {}),
    };
  }

  if (name === "request_plumbing_callback") {
    const visitorName = typeof args.name === "string" ? args.name.trim() : "";
    const phoneRaw = typeof args.phone === "string" ? args.phone : "";
    const phone = plumbingCallbackPhone(phoneRaw);
    const questionSummary =
      typeof args.questionSummary === "string" ? args.questionSummary.trim() : "";

    if (!visitorName || !phone || !questionSummary) {
      return {
        ok: false,
        error: "Need caller name, a valid callback phone (10+ digits), and questionSummary.",
      };
    }

    await updateVoiceDemoLead(leadId, {
      full_name: visitorName,
      phone,
    });

    await upsertPlumbingJob({
      leadId,
      status: "callback_requested",
      flowName: "callback_fallback",
      notes: {
        questionSummary,
        callbackRequestedAt: new Date().toISOString(),
      },
    });

    const phoneSpoken = plumbingContactFieldSpoken("phone", phone);
    return {
      ok: true,
      callbackLogged: true,
      spoken: {
        name: visitorName,
        ...(phoneSpoken ? { phone: phoneSpoken } : {}),
      },
      message:
        `Callback logged for ${visitorName} at ${phone}. ` +
        (phoneSpoken
          ? `If not done yet, reconfirm name and phone — read digits: "${phoneSpoken}" — then `
          : "") +
        `tell the caller someone from Metro Plumbing & Drain will call them back as soon as we can — ` +
        `do NOT guess an answer to their question.`,
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
    /** Every standard booking gets the $50 promo email — do not rely on the model flag. */
    const grantPromo = !isEmergency;

    if (!visitorName || !email || !isValidEmail(email) || !serviceAddress || !serviceType) {
      return { ok: false, error: "Need name, valid email, address, and service type." };
    }

    if (!hasFullPersonName(visitorName)) {
      const first = splitPersonName(visitorName).firstName;
      return {
        ok: false,
        error: `Need full name before booking. Ask: "I have ${first} as your first name. How do I spell your last name?"`,
      };
    }

    if (!row.phone?.trim()) {
      return { ok: false, error: "Need callback phone on file before booking." };
    }

    await updateVoiceDemoLead(leadId, {
      full_name: visitorName,
      email,
    });

    const status = isEmergency ? "emergency" : "booked";
    const promoCode = await resolvePlumbingPromoCodeForLead(leadId, grantPromo);
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
      promoApplied: grantPromo,
      promoCode: promoCode ?? null,
      customerEmail: email,
      notes: issueDescription ? { issueDescription } : undefined,
    });

    if (!saved.ok) {
      return { ok: false, error: saved.error };
    }

    const bookedJob: PlumbingJobRow = {
      id: saved.id,
      lead_id: leadId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status,
      flow_name: flowName || null,
      service_type: serviceType,
      service_address: serviceAddress,
      service_street: serviceAddress,
      service_line2: null,
      service_city: null,
      service_state: null,
      service_zip: null,
      appointment_date: appointmentDate || null,
      time_window: timeWindow || null,
      price_range: priceRange || null,
      is_emergency: isEmergency,
      promo_applied: grantPromo,
      promo_code: promoCode,
      customer_email: email,
      notes: issueDescription ? { issueDescription } : {},
      confirmation_email_sent_at: null,
      reminder_email_sent_at: null,
    };
    scheduleEmailsForBookedJob(leadId, bookedJob, email, visitorName);

    return {
      ok: true,
      booked: true,
      emailSent: true,
      status,
      message: grantPromo
        ? "Appointment booked. One confirmation email is sending with their $50 coupon inside — tell the caller to check inbox and spam for that email. Do NOT read or spell the coupon code aloud. Recap address, date, and time warmly and stay on the line. Do NOT re-confirm name or re-call save_plumbing_contact for fields already collected."
        : "Appointment booked. Confirmation email is sending — recap address, date, and time warmly with the caller and stay on the line. Do NOT re-confirm name or contact fields already on file.",
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
    let promoCode: string | null = null;
    if (template === "promo") {
      promoCode = await resolvePlumbingPromoCodeForLead(leadId, true);
    }
    const emailPayload: PlumbingEmailPayload = {
      to: email,
      firstName: firstName(visitorName),
      serviceType: serviceType || undefined,
      priceRange: priceRange || undefined,
      inquirySummary: inquirySummary || undefined,
      promoApplied: template === "promo",
      promoCode: promoCode ?? undefined,
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
        await upsertPlumbingJob({
          leadId,
          promoApplied: true,
          promoCode: promoCode ?? null,
          customerEmail: email,
        });
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
