import { supabaseAdmin } from "@/lib/supabase";
import {
  assemblePlumbingServiceAddress,
  type CrmContactFields,
} from "@/lib/crm-contact-fields";

export type PlumbingJobStatus =
  | "draft"
  | "booked"
  | "emergency"
  | "quote_sent"
  | "cancelled"
  | "callback_requested";

export type PlumbingJobRow = {
  id: string;
  lead_id: string;
  created_at: string;
  updated_at: string;
  status: PlumbingJobStatus;
  flow_name: string | null;
  service_type: string | null;
  service_address: string | null;
  service_street: string | null;
  service_line2: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
  appointment_date: string | null;
  time_window: string | null;
  price_range: string | null;
  is_emergency: boolean;
  promo_applied: boolean;
  promo_code: string | null;
  customer_email: string | null;
  notes: Record<string, unknown>;
  confirmation_email_sent_at: string | null;
  reminder_email_sent_at: string | null;
};

export type UpsertPlumbingJobInput = {
  leadId: string;
  status?: PlumbingJobStatus;
  flowName?: string | null;
  serviceType?: string | null;
  serviceAddress?: string | null;
  serviceStreet?: string | null;
  serviceLine2?: string | null;
  serviceCity?: string | null;
  serviceState?: string | null;
  serviceZip?: string | null;
  appointmentDate?: string | null;
  timeWindow?: string | null;
  priceRange?: string | null;
  isEmergency?: boolean;
  promoApplied?: boolean;
  promoCode?: string | null;
  customerEmail?: string | null;
  notes?: Record<string, unknown>;
  confirmationEmailSentAt?: string | null;
};

function resolvePlumbingAddressPatch(
  input: UpsertPlumbingJobInput,
  existing: PlumbingJobRow | null
): {
  service_street: string | null;
  service_line2: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
  service_address: string | null;
} {
  const street =
    input.serviceStreet !== undefined
      ? input.serviceStreet
      : input.serviceAddress !== undefined
        ? input.serviceAddress
        : existing?.service_street ?? existing?.service_address ?? null;
  const line2 =
    input.serviceLine2 !== undefined ? input.serviceLine2 : existing?.service_line2 ?? null;
  const city =
    input.serviceCity !== undefined ? input.serviceCity : existing?.service_city ?? null;
  const state =
    input.serviceState !== undefined ? input.serviceState : existing?.service_state ?? null;
  const zip = input.serviceZip !== undefined ? input.serviceZip : existing?.service_zip ?? null;
  const parts: CrmContactFields = { street, line2, city, state, zip };
  const assembled = assemblePlumbingServiceAddress(parts);
  return {
    service_street: street,
    service_line2: line2,
    service_city: city,
    service_state: state,
    service_zip: zip,
    service_address:
      assembled ??
      (input.serviceAddress !== undefined
        ? input.serviceAddress
        : existing?.service_address ?? null),
  };
}

export async function getLatestPlumbingJobForLead(
  leadId: string
): Promise<PlumbingJobRow | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const { data, error } = await supa
    .from("jarvis_plumbing_jobs")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as PlumbingJobRow;
}

export async function upsertPlumbingJob(
  input: UpsertPlumbingJobInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supa = supabaseAdmin();
  if (!supa) return { ok: false, error: "Database unavailable." };

  const existing = await getLatestPlumbingJobForLead(input.leadId);
  const now = new Date().toISOString();
  const addressPatch = resolvePlumbingAddressPatch(input, existing);

  if (existing) {
    const patch: Record<string, unknown> = { updated_at: now, ...addressPatch };
    if (input.status !== undefined) patch.status = input.status;
    if (input.flowName !== undefined) patch.flow_name = input.flowName;
    if (input.serviceType !== undefined) patch.service_type = input.serviceType;
    if (input.appointmentDate !== undefined) patch.appointment_date = input.appointmentDate;
    if (input.timeWindow !== undefined) patch.time_window = input.timeWindow;
    if (input.priceRange !== undefined) patch.price_range = input.priceRange;
    if (input.isEmergency !== undefined) patch.is_emergency = input.isEmergency;
    if (input.promoApplied !== undefined) patch.promo_applied = input.promoApplied;
    if (input.promoCode !== undefined) patch.promo_code = input.promoCode;
    if (input.customerEmail !== undefined) patch.customer_email = input.customerEmail;
    if (input.notes !== undefined) {
      patch.notes = { ...(existing.notes ?? {}), ...input.notes };
    }
    if (input.confirmationEmailSentAt !== undefined) {
      patch.confirmation_email_sent_at = input.confirmationEmailSentAt;
    }

    const { error } = await supa
      .from("jarvis_plumbing_jobs")
      .update(patch)
      .eq("id", existing.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: existing.id };
  }

  const { data, error } = await supa
    .from("jarvis_plumbing_jobs")
    .insert({
      lead_id: input.leadId,
      status: input.status ?? "draft",
      flow_name: input.flowName ?? null,
      service_type: input.serviceType ?? null,
      ...addressPatch,
      appointment_date: input.appointmentDate ?? null,
      time_window: input.timeWindow ?? null,
      price_range: input.priceRange ?? null,
      is_emergency: input.isEmergency ?? false,
      promo_applied: input.promoApplied ?? false,
      promo_code: input.promoCode ?? null,
      customer_email: input.customerEmail ?? null,
      notes: input.notes ?? {},
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not save appointment." };
  }

  return { ok: true, id: data.id as string };
}
