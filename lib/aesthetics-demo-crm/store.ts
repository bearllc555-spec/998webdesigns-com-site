import { cloneLumenSeed } from "@/lib/aesthetics-demo-crm/seed-lumen";
import { cloneWillowSageSeed } from "@/lib/aesthetics-demo-crm/seed-willow-sage";
import type {
  AestheticsAppointment,
  AestheticsConversation,
  AestheticsCrmSnapshot,
  AestheticsDemoBrand,
  AestheticsEmailMessage,
  AestheticsLead,
  AestheticsSmsMessage,
  ConversationChannel,
  ConversationIntent,
  ConversationOutcome,
  LeadSource,
  LeadStatus,
} from "@/lib/aesthetics-demo-crm/types";
import { nextEntityId } from "@/lib/aesthetics-demo-crm/seed-utils";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";

type BrandStore = {
  snapshot: AestheticsCrmSnapshot;
  liveTileBoost: {
    leadsCaptured: number;
    appointmentsBooked: number;
    afterHoursSaves: number;
    revenueBooked: number;
    membershipsStarted: number;
  };
};

const stores = new Map<AestheticsDemoBrand, BrandStore>();

function freshStore(brand: AestheticsDemoBrand): BrandStore {
  const snapshot = brand === "clinical" ? cloneLumenSeed() : cloneWillowSageSeed();
  return {
    snapshot,
    liveTileBoost: {
      leadsCaptured: 0,
      appointmentsBooked: 0,
      afterHoursSaves: 0,
      revenueBooked: 0,
      membershipsStarted: 0,
    },
  };
}

function getStore(brand: AestheticsDemoBrand): BrandStore {
  let store = stores.get(brand);
  if (!store) {
    store = freshStore(brand);
    stores.set(brand, store);
  }
  return store;
}

export function getAestheticsCrmSnapshot(brand: AestheticsDemoBrand): AestheticsCrmSnapshot {
  const { snapshot, liveTileBoost } = getStore(brand);
  const base = getDemoBrandConfigByVertical(brand).tileTargets;
  return {
    ...snapshot,
    tiles: {
      leadsCaptured: base.leadsCaptured + liveTileBoost.leadsCaptured,
      appointmentsBooked: base.appointmentsBooked + liveTileBoost.appointmentsBooked,
      afterHoursSaves: base.afterHoursSaves + liveTileBoost.afterHoursSaves,
      revenueBooked: base.revenueBooked + liveTileBoost.revenueBooked,
      membershipsStarted: base.membershipsStarted + liveTileBoost.membershipsStarted,
      avgJarvisResponseSec: base.avgJarvisResponseSec,
      coverage: "24/7",
    },
  };
}

export function resetAestheticsCrmStore(brand: AestheticsDemoBrand): void {
  stores.set(brand, freshStore(brand));
}

export type LiveBookingInput = {
  brand: AestheticsDemoBrand;
  name: string;
  phone: string;
  email: string;
  service: string;
  provider: string;
  value: number;
  channel: ConversationChannel;
  source: LeadSource;
  appointmentAt?: string;
  membership?: boolean;
  snippet: string;
  durationSec?: number;
};

export type LiveCallbackInput = {
  brand: AestheticsDemoBrand;
  name: string;
  phone: string;
  email: string;
  interest: string;
  channel: ConversationChannel;
  source: LeadSource;
  intent: ConversationIntent;
  notes: string;
  snippet: string;
  durationSec?: number;
};

export function appendAestheticsBooking(input: LiveBookingInput): string {
  const store = getStore(input.brand);
  const now = new Date().toISOString();
  const leadId = nextEntityId("L", store.snapshot.leads);
  const lead: AestheticsLead = {
    id: leadId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    source: input.source,
    status: "booked",
    interest: input.service,
    at: now,
    notes: input.membership ? "Joined membership during live demo." : "Booked via Jarvis live demo.",
    isNew: true,
  };
  const appt: AestheticsAppointment = {
    id: nextEntityId("A", store.snapshot.appointments),
    leadId,
    service: input.service,
    provider: input.provider,
    status: "confirmed",
    at: input.appointmentAt ?? now,
    value: input.value,
    bookedVia: input.channel,
    isNew: true,
  };
  const sms: AestheticsSmsMessage = {
    id: nextEntityId("S", store.snapshot.sms),
    leadId,
    direction: "outbound",
    type: input.source === "after_hours" ? "after_hours_textback" : "confirmation",
    at: now,
    body: `Hi ${input.name.split(" ")[0] ?? "there"} — you're confirmed for ${input.service}. See you soon!`,
    isNew: true,
  };
  const email: AestheticsEmailMessage = {
    id: nextEntityId("E", store.snapshot.emails),
    leadId,
    type: "confirmation",
    status: "sent",
    at: now,
    subject: `Your ${getDemoBrandConfigByVertical(input.brand).brandName} appointment is confirmed`,
    isNew: true,
  };
  const conversation: AestheticsConversation = {
    id: nextEntityId("C", store.snapshot.conversations),
    leadId,
    channel: input.channel,
    intent: "book",
    outcome: "booked",
    at: now,
    durationSec: input.durationSec ?? 120,
    snippet: input.snippet,
    isNew: true,
  };

  store.snapshot.leads.unshift(lead);
  store.snapshot.appointments.unshift(appt);
  store.snapshot.sms.unshift(sms);
  store.snapshot.emails.unshift(email);
  store.snapshot.conversations.unshift(conversation);

  store.liveTileBoost.leadsCaptured += 1;
  store.liveTileBoost.appointmentsBooked += 1;
  store.liveTileBoost.revenueBooked += input.value;
  if (input.source === "after_hours") store.liveTileBoost.afterHoursSaves += 1;
  if (input.membership) store.liveTileBoost.membershipsStarted += 1;

  return leadId;
}

export function appendAestheticsCallback(input: LiveCallbackInput): string {
  const store = getStore(input.brand);
  const now = new Date().toISOString();
  const leadId = nextEntityId("L", store.snapshot.leads);
  const lead: AestheticsLead = {
    id: leadId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    source: input.source,
    status: "callback_requested",
    interest: input.interest,
    at: now,
    notes: input.notes,
    isNew: true,
  };
  const conversation: AestheticsConversation = {
    id: nextEntityId("C", store.snapshot.conversations),
    leadId,
    channel: input.channel,
    intent: input.intent,
    outcome: "callback_captured",
    at: now,
    durationSec: input.durationSec ?? 90,
    snippet: input.snippet,
    isNew: true,
  };

  store.snapshot.leads.unshift(lead);
  store.snapshot.conversations.unshift(conversation);

  if (input.source === "after_hours") {
    const sms: AestheticsSmsMessage = {
      id: nextEntityId("S", store.snapshot.sms),
      leadId,
      direction: "outbound",
      type: "after_hours_textback",
      at: now,
      body: `Hi ${input.name.split(" ")[0] ?? "there"} — thanks for reaching out! A provider will call you back shortly.`,
      isNew: true,
    };
    store.snapshot.sms.unshift(sms);
    store.liveTileBoost.afterHoursSaves += 1;
  }

  store.liveTileBoost.leadsCaptured += 1;
  return leadId;
}

export function clearAestheticsNewFlags(brand: AestheticsDemoBrand): void {
  const store = getStore(brand);
  const clear = <T extends { isNew?: boolean }>(rows: T[]) =>
    rows.map((r) => ({ ...r, isNew: undefined }));
  store.snapshot.leads = clear(store.snapshot.leads);
  store.snapshot.appointments = clear(store.snapshot.appointments);
  store.snapshot.sms = clear(store.snapshot.sms);
  store.snapshot.emails = clear(store.snapshot.emails);
  store.snapshot.conversations = clear(store.snapshot.conversations);
}
