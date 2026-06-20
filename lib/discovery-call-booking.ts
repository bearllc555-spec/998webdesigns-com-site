import {
  clearDiscoveryCallBooking,
  findDiscoveryProspectByEmail,
  getDiscoveryProspect,
  markDiscoveryCallBooked,
} from "@/lib/discovery-db";
import { notifyCrmActivity } from "@/lib/crm-notify";

export async function recordDiscoveryCallBooking(params: {
  prospectId: string | null;
  email: string;
  eventStartAt: string | null;
  inviteeUri: string | null;
}): Promise<{ ok: boolean; prospectId?: string }> {
  let prospectId = params.prospectId;

  if (prospectId) {
    const row = await getDiscoveryProspect(prospectId);
    if (!row) prospectId = null;
  }

  if (!prospectId) {
    const row = await findDiscoveryProspectByEmail(params.email);
    if (!row) return { ok: false };
    prospectId = row.id;
  }

  const existing = await getDiscoveryProspect(prospectId);
  if (!existing) return { ok: false };
  const alreadyBooked = Boolean(existing.call_booked_at);

  const start = params.eventStartAt ?? new Date().toISOString();
  const ok = await markDiscoveryCallBooked(prospectId, start, params.inviteeUri);
  if (!ok) return { ok: false };

  if (!alreadyBooked) {
    await notifyCrmActivity({
      kind: "discovery_call_booked",
      businessName: existing.company_name ?? "",
      fullName: existing.full_name,
      email: existing.email,
      phone: existing.phone,
      status: "call_booked",
      message: params.eventStartAt ?? undefined,
    });
  }

  return { ok: true, prospectId };
}

export async function cancelDiscoveryCallBooking(params: {
  prospectId: string | null;
  email: string;
}): Promise<boolean> {
  let prospectId = params.prospectId;

  if (prospectId) {
    const row = await getDiscoveryProspect(prospectId);
    if (!row) prospectId = null;
  }

  if (!prospectId) {
    const row = await findDiscoveryProspectByEmail(params.email);
    if (!row?.call_booked_at) return false;
    prospectId = row.id;
  }

  return clearDiscoveryCallBooking(prospectId);
}
