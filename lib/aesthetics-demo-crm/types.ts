export type AestheticsDemoBrand = "clinical" | "wellness";

export type LeadSource = "voice" | "chat" | "after_hours" | "web";
export type LeadStatus =
  | "new"
  | "booked"
  | "callback_requested"
  | "no_answer"
  | "completed";

export type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "completed"
  | "rescheduled"
  | "cancelled";

export type SmsDirection = "outbound" | "inbound";
export type SmsType =
  | "confirmation"
  | "reminder"
  | "after_hours_textback"
  | "follow_up";

export type EmailType = "confirmation" | "follow_up" | "nurture";
export type EmailStatus = "sent" | "scheduled";

export type ConversationChannel = "voice" | "chat";
export type ConversationIntent =
  | "book"
  | "pricing"
  | "info"
  | "after_hours"
  | "medical_concern";

export type ConversationOutcome =
  | "booked"
  | "info_provided"
  | "callback_captured";

export type AestheticsLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  interest: string;
  at: string;
  notes: string;
  isNew?: boolean;
};

export type AestheticsAppointment = {
  id: string;
  leadId: string;
  service: string;
  provider: string;
  status: AppointmentStatus;
  at: string;
  value: number;
  bookedVia: ConversationChannel;
  isNew?: boolean;
};

export type AestheticsSmsMessage = {
  id: string;
  leadId: string;
  direction: SmsDirection;
  type: SmsType;
  at: string;
  body: string;
  isNew?: boolean;
};

export type AestheticsEmailMessage = {
  id: string;
  leadId: string;
  type: EmailType;
  status: EmailStatus;
  at: string;
  subject: string;
  isNew?: boolean;
};

export type AestheticsConversation = {
  id: string;
  leadId: string;
  channel: ConversationChannel;
  intent: ConversationIntent;
  outcome: ConversationOutcome;
  at: string;
  durationSec: number;
  snippet: string;
  isNew?: boolean;
};

export type AestheticsCrmSnapshot = {
  brand: AestheticsDemoBrand;
  leads: AestheticsLead[];
  appointments: AestheticsAppointment[];
  sms: AestheticsSmsMessage[];
  emails: AestheticsEmailMessage[];
  conversations: AestheticsConversation[];
  tiles: {
    leadsCaptured: number;
    appointmentsBooked: number;
    afterHoursSaves: number;
    revenueBooked: number;
    membershipsStarted: number;
    avgJarvisResponseSec: number;
    coverage: string;
  };
};

export type AestheticsSeedRow = {
  tMinusHours: number;
};
