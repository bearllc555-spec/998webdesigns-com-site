import { supabaseAdmin } from "@/lib/supabase";

export type PlumbingJobStatus = "draft" | "booked" | "emergency" | "quote_sent" | "cancelled";

export type PlumbingJobRow = {
  id: string;
  lead_id: string;
  created_at: string;
  updated_at: string;
  status: PlumbingJobStatus;
  flow_name: string | null;
  service_type: string | null;
  service_address: string | null;
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

  if (existing) {
    const patch: Record<string, unknown> = { updated_at: now };
    if (input.status !== undefined) patch.status = input.status;
    if (input.flowName !== undefined) patch.flow_name = input.flowName;
    if (input.serviceType !== undefined) patch.service_type = input.serviceType;
    if (input.serviceAddress !== undefined) patch.service_address = input.serviceAddress;
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
      service_address: input.serviceAddress ?? null,
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
