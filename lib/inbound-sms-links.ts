import { findDiscoveryProspectByPhone, findDiscoveryProspectByWdLeadId } from "@/lib/discovery-db";
import type { DiscoveryProspectRow } from "@/lib/discovery-types";
import { findLatestWdLeadByPhone } from "@/lib/leads-db";

export type InboundSmsLinks = {
  discoveryProspectId: string | null;
  wdLeadId: string | null;
  prospect: DiscoveryProspectRow | null;
};

/** Resolve CRM profile links for an inbound SMS from the sender phone. */
export async function resolveInboundSmsLinks(fromPhone: string): Promise<InboundSmsLinks> {
  const prospect = await findDiscoveryProspectByPhone(fromPhone);
  const leadByPhone = await findLatestWdLeadByPhone(fromPhone);

  let wdLeadId = prospect?.wd_lead_id ?? leadByPhone?.id ?? null;

  if (prospect?.wd_lead_id && leadByPhone && prospect.wd_lead_id !== leadByPhone.id) {
    wdLeadId = prospect.wd_lead_id;
  }

  return {
    prospect,
    discoveryProspectId: prospect?.id ?? null,
    wdLeadId,
  };
}

export async function discoveryProspectIdsForWdLead(leadId: string): Promise<string[]> {
  const ids = new Set<string>();
  const linked = await findDiscoveryProspectByWdLeadId(leadId);
  if (linked?.id) ids.add(linked.id);
  return [...ids];
}
