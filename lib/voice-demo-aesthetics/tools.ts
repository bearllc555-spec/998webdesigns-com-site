import { Type, type ToolListUnion } from "@google/genai";
import { after } from "next/server";
import {
  appendAestheticsBooking,
  appendAestheticsCallback,
} from "@/lib/aesthetics-demo-crm/store";
import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";
import { getVoiceDemoLead, updateVoiceDemoLead } from "@/lib/voice-demo-db";
import {
  sendAestheticsDemoEmail,
  type AestheticsEmailTemplate,
} from "@/lib/voice-demo-aesthetics/email";
import { upsertAestheticsJob } from "@/lib/voice-demo-aesthetics/jobs-store";
import {
  sendAestheticsAfterHoursSms,
  sendAestheticsConfirmationSms,
} from "@/lib/voice-demo-aesthetics/sms";
import { isValidEmail } from "@/lib/validate-email";

const VALID_EMAIL_TEMPLATES = new Set<AestheticsEmailTemplate>([
  "confirmation",
  "follow_up",
  "nurture",
  "after_hours",
]);

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return trimmed;
}

export function voiceDemoAestheticsToolDeclarations(): ToolListUnion {
  return [
    {
      functionDeclarations: [
        {
          name: "save_aesthetics_contact",
          description:
            "Save caller details as you collect them - name, email, phone, service, appointment date/time.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              serviceType: { type: Type.STRING },
              appointmentDate: { type: Type.STRING },
              timeWindow: { type: Type.STRING },
              provider: { type: Type.STRING },
            },
          },
        },
        {
          name: "book_aesthetics_appointment",
          description:
            "Book consultation or treatment when name, phone, email, service, and scheduling are confirmed. Sends SMS + email confirmation.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              serviceType: { type: Type.STRING },
              appointmentDate: { type: Type.STRING },
              timeWindow: { type: Type.STRING },
              provider: { type: Type.STRING },
              value: { type: Type.NUMBER },
              membership: { type: Type.BOOLEAN },
              channel: { type: Type.STRING, description: "voice or chat" },
            },
            required: ["name", "email", "phone", "serviceType"],
          },
        },
        {
          name: "request_aesthetics_callback",
          description:
            "Log provider callback when unsure or for any medical/clinical question. Never give medical advice.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              phone: { type: Type.STRING },
              email: { type: Type.STRING },
              interest: { type: Type.STRING },
              questionSummary: { type: Type.STRING },
              medicalConcern: { type: Type.BOOLEAN },
              channel: { type: Type.STRING },
            },
            required: ["name", "phone", "questionSummary"],
          },
        },
        {
          name: "send_aesthetics_email",
          description: "Send follow_up, nurture, or after_hours email templates.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              email: { type: Type.STRING },
              name: { type: Type.STRING },
              template: {
                type: Type.STRING,
                description: "confirmation | follow_up | nurture | after_hours",
              },
              serviceType: { type: Type.STRING },
            },
            required: ["email", "name", "template"],
          },
        },
      ],
    },
  ];
}

function defaultProvider(brand: AestheticsDemoBrand): string {
  const config = getDemoBrandConfigByVertical(brand);
  const p = config.providers[0];
  return p ? `${p.name}, ${p.title}` : "Provider";
}

function scheduleBookingComms(
  brand: AestheticsDemoBrand,
  email: string,
  visitorName: string,
  service: string,
  when: string,
  phone: string
): void {
  after(async () => {
    await sendAestheticsDemoEmail("confirmation", {
      to: email,
      firstName: firstName(visitorName),
      serviceType: service,
      appointmentDate: when,
      brand,
    });
    await sendAestheticsConfirmationSms(
      brand,
      phone,
      firstName(visitorName),
      service,
      when
    );
  });
}

export async function executeVoiceDemoAestheticsTool(
  brand: AestheticsDemoBrand,
  leadId: string,
  name: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const row = await getVoiceDemoLead(leadId);
  if (!row) return { ok: false, error: "Session not found" };
  if (!row.email_verified_at && !row.phone_verified_at) {
    return { ok: false, error: "Not verified yet" };
  }

  if (name === "save_aesthetics_contact") {
    const patch: Parameters<typeof updateVoiceDemoLead>[1] = {};
    const visitorName = typeof args.name === "string" ? args.name.trim() : "";
    const email = typeof args.email === "string" ? args.email.trim().toLowerCase() : "";
    const phone = typeof args.phone === "string" ? args.phone.trim() : "";
    const serviceType = typeof args.serviceType === "string" ? args.serviceType.trim() : "";
    const appointmentDate =
      typeof args.appointmentDate === "string" ? args.appointmentDate.trim() : "";
    const timeWindow = typeof args.timeWindow === "string" ? args.timeWindow.trim() : "";
    const provider = typeof args.provider === "string" ? args.provider.trim() : "";

    if (visitorName) patch.full_name = visitorName;
    if (email && isValidEmail(email)) patch.email = email;
    if (phone) patch.phone = phone;
    if (Object.keys(patch).length > 0) await updateVoiceDemoLead(leadId, patch);

    upsertAestheticsJob(leadId, brand, {
      serviceType: serviceType || undefined,
      appointmentDate: appointmentDate || undefined,
      timeWindow: timeWindow || undefined,
      provider: provider || undefined,
    });

    return {
      ok: true,
      message: "Contact saved. Reconfirm phone or email aloud before continuing.",
    };
  }

  if (name === "book_aesthetics_appointment") {
    const visitorName = typeof args.name === "string" ? args.name.trim() : row.full_name ?? "";
    const email =
      (typeof args.email === "string" ? args.email.trim().toLowerCase() : "") ||
      row.email?.trim().toLowerCase() ||
      "";
    const phone =
      (typeof args.phone === "string" ? args.phone.trim() : "") || row.phone?.trim() || "";
    const serviceType = typeof args.serviceType === "string" ? args.serviceType.trim() : "";
    const appointmentDate =
      typeof args.appointmentDate === "string" ? args.appointmentDate.trim() : "Next available";
    const timeWindow =
      typeof args.timeWindow === "string" ? args.timeWindow.trim() : "TBD";
    const provider =
      (typeof args.provider === "string" ? args.provider.trim() : "") || defaultProvider(brand);
    const value = typeof args.value === "number" ? args.value : 0;
    const membership = args.membership === true;
    const channel = args.channel === "chat" ? "chat" : "voice";

    if (!visitorName || !serviceType) {
      return { ok: false, error: "Need full name and service type before booking." };
    }
    if (!email || !isValidEmail(email)) {
      return { ok: false, error: "Need a valid email before booking." };
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return { ok: false, error: "Need a valid callback phone before booking." };
    }

    await updateVoiceDemoLead(leadId, {
      full_name: visitorName,
      email,
      phone: normalizedPhone,
    });

    const when = `${appointmentDate} ${timeWindow}`.trim();
    upsertAestheticsJob(leadId, brand, {
      serviceType,
      appointmentDate,
      timeWindow,
      provider,
      value,
      membership,
      status: "booked",
    });

    appendAestheticsBooking({
      brand,
      name: visitorName,
      phone: normalizedPhone,
      email,
      service: serviceType,
      provider,
      value,
      channel,
      source: channel === "chat" ? "chat" : "voice",
      membership,
      snippet: `Booked ${serviceType} via Jarvis live demo.`,
    });

    scheduleBookingComms(brand, email, visitorName, serviceType, when, normalizedPhone);

    return {
      ok: true,
      booked: true,
      message:
        "Appointment booked. Confirmation SMS and email are sending — tell them to check texts and inbox.",
    };
  }

  if (name === "request_aesthetics_callback") {
    const visitorName = typeof args.name === "string" ? args.name.trim() : row.full_name ?? "";
    const phone =
      (typeof args.phone === "string" ? args.phone.trim() : "") || row.phone?.trim() || "";
    const email =
      (typeof args.email === "string" ? args.email.trim().toLowerCase() : "") ||
      row.email?.trim().toLowerCase() ||
      "";
    const interest = typeof args.interest === "string" ? args.interest.trim() : "Callback";
    const summary =
      typeof args.questionSummary === "string" ? args.questionSummary.trim() : "Question";
    const medical = args.medicalConcern === true;
    const channel = args.channel === "chat" ? "chat" : "voice";
    const normalizedPhone = normalizePhone(phone);

    if (!visitorName || !normalizedPhone) {
      return { ok: false, error: "Need name and phone for callback." };
    }

    await updateVoiceDemoLead(leadId, {
      full_name: visitorName,
      phone: normalizedPhone,
      ...(email && isValidEmail(email) ? { email } : {}),
    });

    upsertAestheticsJob(leadId, brand, { status: "callback_requested" });

    appendAestheticsCallback({
      brand,
      name: visitorName,
      phone: normalizedPhone,
      email: email || "on file",
      interest,
      channel,
      source: channel === "chat" ? "chat" : "voice",
      intent: medical ? "medical_concern" : "info",
      notes: summary,
      snippet: summary,
    });

    if (medical) {
      return {
        ok: true,
        callback: true,
        message:
          "Callback logged. Tell them a provider will call back — do not give medical advice.",
      };
    }

    return {
      ok: true,
      callback: true,
      message: "Callback logged. Tell them someone will call back as soon as we can.",
    };
  }

  if (name === "send_aesthetics_email") {
    const email =
      (typeof args.email === "string" ? args.email.trim().toLowerCase() : "") ||
      row.email?.trim().toLowerCase() ||
      "";
    const visitorName = typeof args.name === "string" ? args.name.trim() : row.full_name ?? "Guest";
    const templateRaw = typeof args.template === "string" ? args.template.trim() : "";
    const template = VALID_EMAIL_TEMPLATES.has(templateRaw as AestheticsEmailTemplate)
      ? (templateRaw as AestheticsEmailTemplate)
      : null;
    const serviceType = typeof args.serviceType === "string" ? args.serviceType.trim() : undefined;

    if (!email || !isValidEmail(email)) {
      return { ok: false, error: "Valid email required." };
    }
    if (!template) {
      return {
        ok: false,
        error: "Invalid template. Use confirmation, follow_up, nurture, or after_hours.",
      };
    }

    const sent = await sendAestheticsDemoEmail(template, {
      to: email,
      firstName: firstName(visitorName),
      serviceType,
      brand,
    });

    return sent
      ? { ok: true, emailSent: true, message: "Email sent." }
      : { ok: false, error: "Email could not be sent." };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}
