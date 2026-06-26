import type {
  AestheticsAppointment,
  AestheticsConversation,
  AestheticsCrmSnapshot,
  AestheticsEmailMessage,
  AestheticsLead,
  AestheticsSmsMessage,
} from "@/lib/aesthetics-demo-crm/types";
import { anchorTMinusHours, skewAppointmentTime } from "@/lib/aesthetics-demo-crm/seed-utils";
import { WILLOW_SAGE_CONFIG } from "@/lib/demo-config/willow-sage";

type SeedLead = Omit<AestheticsLead, "at"> & { tMinusHours: number };
type SeedAppt = Omit<AestheticsAppointment, "at"> & { tMinusHours: number };
type SeedSms = Omit<AestheticsSmsMessage, "at"> & { tMinusHours: number };
type SeedEmail = Omit<AestheticsEmailMessage, "at"> & { tMinusHours: number };
type SeedConvo = Omit<AestheticsConversation, "at"> & { tMinusHours: number };

const RAW = {
  leads: [
    {
      id: "L-2041",
      name: "Emma Hartley",
      phone: "+1 (555) 412-8890",
      email: "emma.h@email.com",
      source: "voice" as const,
      status: "booked" as const,
      interest: "Signature HydraGlow Facial",
      tMinusHours: 30,
      notes: "First visit. Found via Instagram.",
    },
    {
      id: "L-2042",
      name: "Lucia Moreno",
      phone: "+1 (555) 663-2218",
      email: "lucia.m@email.com",
      source: "after_hours" as const,
      status: "booked" as const,
      interest: "Baby Botox",
      tMinusHours: 11,
      notes: "Reached out 9:50pm; nervous first-timer, Jarvis reassured + booked.",
    },
    {
      id: "L-2043",
      name: "Rachel Green",
      phone: "+1 (555) 884-7012",
      email: "rgreen@email.com",
      source: "chat" as const,
      status: "callback_requested" as const,
      interest: "Medical weight management",
      tMinusHours: 5,
      notes:
        "Eligibility question. Jarvis did NOT advise or promise meds; captured contact for provider callback.",
    },
    {
      id: "L-2044",
      name: "Aisha Bello",
      phone: "+1 (555) 220-5567",
      email: "a.bello@email.com",
      source: "voice" as const,
      status: "booked" as const,
      interest: "HydraGlow + membership",
      tMinusHours: 27,
      notes: "Joined Glow Club (Bloom).",
    },
    {
      id: "L-2045",
      name: "Tom Fielder",
      phone: "+1 (555) 731-9904",
      email: "tfielder@email.com",
      source: "chat" as const,
      status: "new" as const,
      interest: "IV drips",
      tMinusHours: 2,
      notes: "Asked about hydration drips; sent menu.",
    },
    {
      id: "L-2046",
      name: "Sofia Russo",
      phone: "+1 (555) 509-3341",
      email: "sofia.r@email.com",
      source: "after_hours" as const,
      status: "booked" as const,
      interest: "Chemical peel",
      tMinusHours: 21,
      notes: "After-hours save, 10:40pm.",
    },
    {
      id: "L-2047",
      name: "Nina Park",
      phone: "+1 (555) 640-1175",
      email: "nina.park@email.com",
      source: "voice" as const,
      status: "completed" as const,
      interest: "Microneedling",
      tMinusHours: 96,
      notes: "Repeat. Follow-up scheduled.",
    },
    {
      id: "L-2048",
      name: "Carlos Mendez",
      phone: "+1 (555) 318-6620",
      email: "c.mendez@email.com",
      source: "after_hours" as const,
      status: "new" as const,
      interest: "First facial",
      tMinusHours: 7,
      notes: "Self-described nervous first-timer; Jarvis reassured, sent first-facial $99 offer.",
    },
  ] satisfies SeedLead[],
  appointments: [
    {
      id: "A-6210",
      leadId: "L-2041",
      service: "Signature HydraGlow Facial",
      provider: "Bea Cohen, RN",
      status: "confirmed" as const,
      tMinusHours: -26,
      value: 165,
      bookedVia: "voice" as const,
    },
    {
      id: "A-6211",
      leadId: "L-2042",
      service: "Baby Botox (20 units)",
      provider: "Grace Okafor, NP",
      status: "confirmed" as const,
      tMinusHours: -54,
      value: 240,
      bookedVia: "voice" as const,
    },
    {
      id: "A-6212",
      leadId: "L-2044",
      service: "HydraGlow Facial",
      provider: "Bea Cohen, RN",
      status: "confirmed" as const,
      tMinusHours: -20,
      value: 165,
      bookedVia: "voice" as const,
    },
    {
      id: "A-6213",
      leadId: "L-2046",
      service: "Chemical peel",
      provider: "Grace Okafor, NP",
      status: "confirmed" as const,
      tMinusHours: -72,
      value: 125,
      bookedVia: "chat" as const,
    },
    {
      id: "A-6214",
      leadId: "L-2047",
      service: "Microneedling",
      provider: "Bea Cohen, RN",
      status: "completed" as const,
      tMinusHours: 92,
      value: 350,
      bookedVia: "voice" as const,
    },
  ] satisfies SeedAppt[],
  sms: [
    {
      id: "S-7301",
      leadId: "L-2042",
      direction: "outbound" as const,
      type: "after_hours_textback" as const,
      tMinusHours: 11,
      body: "Hi Lucia, it's Willow & Sage — so glad you reached out! You're booked for Baby Botox Thu 2:00pm with Grace. Totally normal to feel nervous — we'll walk you through everything. Reply C to confirm.",
    },
    {
      id: "S-7302",
      leadId: "L-2042",
      direction: "inbound" as const,
      type: "confirmation" as const,
      tMinusHours: 10.9,
      body: "C — thank you!",
    },
    {
      id: "S-7303",
      leadId: "L-2046",
      direction: "outbound" as const,
      type: "after_hours_textback" as const,
      tMinusHours: 21,
      body: "Hi Sofia! Got your message — you're set for a chemical peel Wed 11:00am. We'll text a reminder the day before.",
    },
    {
      id: "S-7304",
      leadId: "L-2048",
      direction: "outbound" as const,
      type: "follow_up" as const,
      tMinusHours: 7,
      body: "Hi Carlos — no rush at all. Whenever you're ready, your first HydraGlow facial is $99. Want me to hold a Saturday spot?",
    },
    {
      id: "S-7305",
      leadId: "L-2041",
      direction: "outbound" as const,
      type: "reminder" as const,
      tMinusHours: 2,
      body: "See you tomorrow, Emma! HydraGlow at 10:00am with Bea. Arrive makeup-free if you can.",
    },
  ] satisfies SeedSms[],
  emails: [
    {
      id: "E-8401",
      leadId: "L-2041",
      type: "confirmation" as const,
      status: "sent" as const,
      tMinusHours: 30,
      subject: "You're booked at Willow & Sage",
    },
    {
      id: "E-8402",
      leadId: "L-2044",
      type: "confirmation" as const,
      status: "sent" as const,
      tMinusHours: 27,
      subject: "Welcome to the Glow Club",
    },
    {
      id: "E-8403",
      leadId: "L-2045",
      type: "nurture" as const,
      status: "sent" as const,
      tMinusHours: 2,
      subject: "Your IV drip menu + first-visit offer",
    },
    {
      id: "E-8404",
      leadId: "L-2047",
      type: "follow_up" as const,
      status: "scheduled" as const,
      tMinusHours: -48,
      subject: "How's your skin? A check-in from Willow & Sage",
    },
  ] satisfies SeedEmail[],
  conversations: [
    {
      id: "C-9501",
      leadId: "L-2042",
      channel: "voice" as const,
      intent: "after_hours" as const,
      outcome: "booked" as const,
      tMinusHours: 11,
      durationSec: 158,
      snippet:
        "\"I'm honestly a little nervous, I've never done this.\" Jarvis reassured warmly, explained the visit, and booked Baby Botox.",
    },
    {
      id: "C-9502",
      leadId: "L-2043",
      channel: "chat" as const,
      intent: "medical_concern" as const,
      outcome: "callback_captured" as const,
      tMinusHours: 5,
      durationSec: 102,
      snippet:
        "Asked if she qualifies for weight-management meds. Jarvis: \"That's something our provider reviews with you — I'll have them call you.\" No advice or promises given.",
    },
    {
      id: "C-9503",
      leadId: "L-2048",
      channel: "voice" as const,
      intent: "info" as const,
      outcome: "callback_captured" as const,
      tMinusHours: 7,
      durationSec: 73,
      snippet:
        "Nervous first-timer just gathering info. Jarvis reassured, sent first-facial offer, kept the door open.",
    },
    {
      id: "C-9504",
      leadId: "L-2045",
      channel: "chat" as const,
      intent: "pricing" as const,
      outcome: "info_provided" as const,
      tMinusHours: 2,
      durationSec: 51,
      snippet: "Asked about IV drips; Jarvis shared menu + booking link.",
    },
  ] satisfies SeedConvo[],
};

export function buildWillowSageCrmSeed(now = Date.now()): AestheticsCrmSnapshot {
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
    brand: "wellness",
    leads,
    appointments,
    sms,
    emails,
    conversations,
    tiles: {
      ...WILLOW_SAGE_CONFIG.tileTargets,
      coverage: "24/7",
    },
  };
}

export function cloneWillowSageSeed(): AestheticsCrmSnapshot {
  return buildWillowSageCrmSeed(Date.now());
}
