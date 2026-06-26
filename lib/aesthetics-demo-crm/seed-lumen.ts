import type {
  AestheticsAppointment,
  AestheticsConversation,
  AestheticsCrmSnapshot,
  AestheticsEmailMessage,
  AestheticsLead,
  AestheticsSmsMessage,
} from "@/lib/aesthetics-demo-crm/types";
import { anchorTMinusHours, skewAppointmentTime } from "@/lib/aesthetics-demo-crm/seed-utils";
import { LUMEN_CONFIG } from "@/lib/demo-config/lumen";

type SeedLead = Omit<AestheticsLead, "at"> & { tMinusHours: number };
type SeedAppt = Omit<AestheticsAppointment, "at"> & { tMinusHours: number };
type SeedSms = Omit<AestheticsSmsMessage, "at"> & { tMinusHours: number };
type SeedEmail = Omit<AestheticsEmailMessage, "at"> & { tMinusHours: number };
type SeedConvo = Omit<AestheticsConversation, "at"> & { tMinusHours: number };

const RAW = {
  leads: [
    {
      id: "L-1041",
      name: "Sarah Chen",
      phone: "+1 (555) 318-4477",
      email: "sarah.chen@email.com",
      source: "voice" as const,
      status: "booked" as const,
      interest: "Botox consultation",
      tMinusHours: 26,
      notes: "Wants natural, first-time. Asked about looking overdone.",
    },
    {
      id: "L-1042",
      name: "Marcus Webb",
      phone: "+1 (555) 902-1130",
      email: "m.webb@email.com",
      source: "after_hours" as const,
      status: "booked" as const,
      interest: "Dermal filler",
      tMinusHours: 9,
      notes: "Reached out 11:42pm. Jarvis booked + texted back.",
    },
    {
      id: "L-1043",
      name: "Dana Alvarez",
      phone: "+1 (555) 447-2299",
      email: "dalvarez@email.com",
      source: "chat" as const,
      status: "callback_requested" as const,
      interest: "Post-Botox question",
      tMinusHours: 4,
      notes:
        "Asked about mild bruising. Jarvis did NOT advise; captured contact for provider callback.",
    },
    {
      id: "L-1044",
      name: "Priya Patel",
      phone: "+1 (555) 661-7788",
      email: "priya.p@email.com",
      source: "voice" as const,
      status: "booked" as const,
      interest: "Lip enhancement",
      tMinusHours: 50,
      notes: "Event in 3 weeks; Jarvis advised lead time.",
    },
    {
      id: "L-1045",
      name: "Jordan Kim",
      phone: "+1 (555) 224-9015",
      email: "jkim@email.com",
      source: "chat" as const,
      status: "new" as const,
      interest: "Sculptra",
      tMinusHours: 3,
      notes: "Comparing biostimulators. Sent pricing + booking link.",
    },
    {
      id: "L-1046",
      name: "Taylor Brooks",
      phone: "+1 (555) 770-3382",
      email: "t.brooks@email.com",
      source: "after_hours" as const,
      status: "booked" as const,
      interest: "Microneedling + PRF",
      tMinusHours: 19,
      notes: "After-hours save, 10:15pm.",
    },
    {
      id: "L-1047",
      name: "Olivia Rossi",
      phone: "+1 (555) 530-6644",
      email: "orossi@email.com",
      source: "voice" as const,
      status: "completed" as const,
      interest: "Medical facial",
      tMinusHours: 120,
      notes: "Repeat client. Follow-up email scheduled.",
    },
    {
      id: "L-1048",
      name: "Mei Lin",
      phone: "+1 (555) 884-2207",
      email: "mei.lin@email.com",
      source: "voice" as const,
      status: "booked" as const,
      interest: "Botox + membership",
      tMinusHours: 28,
      notes: "Joined LUMEN Circle (Signature).",
    },
  ] satisfies SeedLead[],
  appointments: [
    {
      id: "A-2210",
      leadId: "L-1041",
      service: "Botox consultation",
      provider: "Dr. Lena Ross, NP",
      status: "confirmed" as const,
      tMinusHours: -22,
      value: 0,
      bookedVia: "voice" as const,
    },
    {
      id: "A-2211",
      leadId: "L-1042",
      service: "Dermal filler (1 syringe)",
      provider: "Maya Iqbal, RN",
      status: "confirmed" as const,
      tMinusHours: -66,
      value: 750,
      bookedVia: "voice" as const,
    },
    {
      id: "A-2212",
      leadId: "L-1044",
      service: "Lip enhancement",
      provider: "Dr. Lena Ross, NP",
      status: "confirmed" as const,
      tMinusHours: -40,
      value: 695,
      bookedVia: "voice" as const,
    },
    {
      id: "A-2213",
      leadId: "L-1046",
      service: "Microneedling + PRF",
      provider: "Maya Iqbal, RN",
      status: "confirmed" as const,
      tMinusHours: -90,
      value: 550,
      bookedVia: "chat" as const,
    },
    {
      id: "A-2214",
      leadId: "L-1047",
      service: "Medical facial",
      provider: "Maya Iqbal, RN",
      status: "completed" as const,
      tMinusHours: 116,
      value: 175,
      bookedVia: "voice" as const,
    },
    {
      id: "A-2215",
      leadId: "L-1048",
      service: "Botox (30 units)",
      provider: "Dr. Lena Ross, NP",
      status: "confirmed" as const,
      tMinusHours: -18,
      value: 360,
      bookedVia: "voice" as const,
    },
  ] satisfies SeedAppt[],
  sms: [
    {
      id: "S-3301",
      leadId: "L-1042",
      direction: "outbound" as const,
      type: "after_hours_textback" as const,
      tMinusHours: 9,
      body: "Hi Marcus, this is LUMEN — thanks for reaching out tonight! You're booked for filler Fri 3:30pm with Maya. Reply C to confirm.",
    },
    {
      id: "S-3302",
      leadId: "L-1042",
      direction: "inbound" as const,
      type: "confirmation" as const,
      tMinusHours: 8.9,
      body: "C",
    },
    {
      id: "S-3303",
      leadId: "L-1041",
      direction: "outbound" as const,
      type: "confirmation" as const,
      tMinusHours: 25,
      body: "Hi Sarah — your Botox consultation with Dr. Ross is confirmed for tomorrow 11:00am. See you then!",
    },
    {
      id: "S-3304",
      leadId: "L-1046",
      direction: "outbound" as const,
      type: "after_hours_textback" as const,
      tMinusHours: 19,
      body: "Hi Taylor — got your message! You're set for Microneedling Sat 10:30am. We'll text a reminder the day before.",
    },
    {
      id: "S-3305",
      leadId: "L-1044",
      direction: "outbound" as const,
      type: "reminder" as const,
      tMinusHours: 2,
      body: "Reminder: Priya, your lip enhancement is in 2 days at 1:00pm. Reply R to reschedule.",
    },
  ] satisfies SeedSms[],
  emails: [
    {
      id: "E-4401",
      leadId: "L-1042",
      type: "confirmation" as const,
      status: "sent" as const,
      tMinusHours: 9,
      subject: "Your LUMEN appointment is confirmed",
    },
    {
      id: "E-4402",
      leadId: "L-1045",
      type: "nurture" as const,
      status: "sent" as const,
      tMinusHours: 3,
      subject: "Your Sculptra questions, answered + first-visit offer",
    },
    {
      id: "E-4403",
      leadId: "L-1047",
      type: "follow_up" as const,
      status: "scheduled" as const,
      tMinusHours: -24,
      subject: "How's your skin feeling? A note from LUMEN",
    },
    {
      id: "E-4404",
      leadId: "L-1048",
      type: "confirmation" as const,
      status: "sent" as const,
      tMinusHours: 28,
      subject: "Welcome to the LUMEN Circle",
    },
  ] satisfies SeedEmail[],
  conversations: [
    {
      id: "C-5501",
      leadId: "L-1042",
      channel: "voice" as const,
      intent: "after_hours" as const,
      outcome: "booked" as const,
      tMinusHours: 9,
      durationSec: 142,
      snippet:
        "\"I keep meaning to call during the day… can I just book now?\" — Jarvis booked filler + texted confirmation.",
    },
    {
      id: "C-5502",
      leadId: "L-1043",
      channel: "chat" as const,
      intent: "medical_concern" as const,
      outcome: "callback_captured" as const,
      tMinusHours: 4,
      durationSec: 88,
      snippet:
        "Asked about bruising after Botox. Jarvis: \"I'm not able to give medical guidance, but I'll have a provider call you right away\" — captured name + phone.",
    },
    {
      id: "C-5503",
      leadId: "L-1041",
      channel: "voice" as const,
      intent: "book" as const,
      outcome: "booked" as const,
      tMinusHours: 26,
      durationSec: 176,
      snippet:
        "First-timer worried about looking overdone. Jarvis reassured (natural-result focus) and booked a consult.",
    },
    {
      id: "C-5504",
      leadId: "L-1045",
      channel: "chat" as const,
      intent: "pricing" as const,
      outcome: "info_provided" as const,
      tMinusHours: 3,
      durationSec: 64,
      snippet: "Compared Sculptra vs filler pricing; Jarvis sent menu + booking link.",
    },
  ] satisfies SeedConvo[],
};

export function buildLumenCrmSeed(now = Date.now()): AestheticsCrmSnapshot {
  const leads: AestheticsLead[] = RAW.leads.map(({ tMinusHours, ...rest }) => ({
    ...rest,
    at: anchorTMinusHours(tMinusHours, now),
  }));
  const appointments: AestheticsAppointment[] = RAW.appointments.map(
    ({ tMinusHours, ...rest }) => ({
      ...rest,
      at: skewAppointmentTime(anchorTMinusHours(tMinusHours, now)),
    })
  );
  const sms: AestheticsSmsMessage[] = RAW.sms.map(({ tMinusHours, ...rest }) => ({
    ...rest,
    at: anchorTMinusHours(tMinusHours, now),
  }));
  const emails: AestheticsEmailMessage[] = RAW.emails.map(({ tMinusHours, ...rest }) => ({
    ...rest,
    at: anchorTMinusHours(tMinusHours, now),
  }));
  const conversations: AestheticsConversation[] = RAW.conversations.map(
    ({ tMinusHours, ...rest }) => ({
      ...rest,
      at: anchorTMinusHours(tMinusHours, now),
    })
  );

  return {
    brand: "clinical",
    leads,
    appointments,
    sms,
    emails,
    conversations,
    tiles: {
      ...LUMEN_CONFIG.tileTargets,
      coverage: "24/7",
    },
  };
}

export function cloneLumenSeed(): AestheticsCrmSnapshot {
  return buildLumenCrmSeed(Date.now());
}
