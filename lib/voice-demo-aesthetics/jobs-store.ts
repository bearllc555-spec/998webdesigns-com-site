export type AestheticsJobDraft = {
  leadId: string;
  brand: "clinical" | "wellness";
  serviceType: string | null;
  appointmentDate: string | null;
  timeWindow: string | null;
  provider: string | null;
  value: number;
  membership: boolean;
  status: "draft" | "booked" | "callback_requested";
};

const jobs = new Map<string, AestheticsJobDraft>();

export function getAestheticsJob(leadId: string): AestheticsJobDraft | null {
  return jobs.get(leadId) ?? null;
}

export function upsertAestheticsJob(
  leadId: string,
  brand: "clinical" | "wellness",
  patch: Partial<Omit<AestheticsJobDraft, "leadId" | "brand">>
): AestheticsJobDraft {
  const existing = jobs.get(leadId);
  const next: AestheticsJobDraft = {
    leadId,
    brand,
    serviceType: patch.serviceType ?? existing?.serviceType ?? null,
    appointmentDate: patch.appointmentDate ?? existing?.appointmentDate ?? null,
    timeWindow: patch.timeWindow ?? existing?.timeWindow ?? null,
    provider: patch.provider ?? existing?.provider ?? null,
    value: patch.value ?? existing?.value ?? 0,
    membership: patch.membership ?? existing?.membership ?? false,
    status: patch.status ?? existing?.status ?? "draft",
  };
  jobs.set(leadId, next);
  return next;
}

export function clearAestheticsJob(leadId: string): void {
  jobs.delete(leadId);
}
