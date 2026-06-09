import { isCrmInboxFlag, type CrmInboxFlag } from "@/lib/crm-inbox-flag";
import type { CrmFeedItem, CrmFeedResult } from "@/lib/crm-feed";
import type { PlumbingJobRow } from "@/lib/voice-demo-plumbing-db";
import { supabaseAdmin } from "@/lib/supabase";
import {
  countVoiceDemoOpsWarnings,
  parseVoiceDemoOpsLog,
  summarizeVoiceDemoOpsWarnings,
} from "@/lib/voice-demo-ops";

function parseInboxFlag(value: unknown): CrmInboxFlag | null {
  return isCrmInboxFlag(value) ? value : null;
}

function jobPreview(job: PlumbingJobRow | null): string | null {
  if (!job) return null;
  const parts = [
    job.service_type,
    job.appointment_date,
    job.time_window,
    job.service_address,
  ].filter(Boolean);
  if (parts.length === 0) return job.status;
  const line = parts.join(" · ");
  return line.length > 72 ? `${line.slice(0, 69)}…` : line;
}

function mapPlumbingJobPayload(job: PlumbingJobRow | null): Record<string, unknown> | null {
  if (!job) return null;
  return {
    status: job.status,
    serviceType: job.service_type,
    serviceAddress: job.service_address,
    appointmentDate: job.appointment_date,
    timeWindow: job.time_window,
    priceRange: job.price_range,
    isEmergency: job.is_emergency,
    promoApplied: job.promo_applied,
    promoCode: job.promo_code,
    customerEmail: job.customer_email,
    confirmationEmailSentAt: job.confirmation_email_sent_at,
    flowName: job.flow_name,
    notes: job.notes,
  };
}

/** Real plumbing Jarvis sign-ins from voice_demo_leads (vertical=plumbers) + jobs. */
export async function fetchPlumbingCrmFeed(limit = 50): Promise<CrmFeedResult> {
  const supa = supabaseAdmin();
  if (!supa) {
    return {
      items: [],
      error:
        "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  let leadsRes = await supa
    .from("voice_demo_leads")
    .select(
      "id, created_at, updated_at, email, phone, full_name, primary_channel, email_verified_at, phone_verified_at, promo_code, promo_sent_at, session_summary, ops_log, read_at, inbox_flag, vertical"
    )
    .eq("vertical", "plumbers")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (leadsRes.error && /vertical/i.test(leadsRes.error.message)) {
    const jobsProbe = await supa.from("jarvis_plumbing_jobs").select("lead_id").limit(500);
    const plumbingLeadIds = [...new Set((jobsProbe.data ?? []).map((r) => r.lead_id as string))];
    if (plumbingLeadIds.length === 0) {
      return { items: [] };
    }
    leadsRes = await supa
      .from("voice_demo_leads")
      .select(
        "id, created_at, updated_at, email, phone, full_name, primary_channel, email_verified_at, phone_verified_at, promo_code, promo_sent_at, session_summary, ops_log, read_at, inbox_flag, vertical"
      )
      .in("id", plumbingLeadIds)
      .order("updated_at", { ascending: false })
      .limit(limit);
  }

  if (leadsRes.error) {
    return { items: [], error: leadsRes.error.message };
  }

  const leadRows = leadsRes.data ?? [];
  const leadIds = leadRows.map((r) => r.id as string);
  const jobsByLead = new Map<string, PlumbingJobRow>();

  if (leadIds.length > 0) {
    const jobsRes = await supa
      .from("jarvis_plumbing_jobs")
      .select("*")
      .in("lead_id", leadIds)
      .order("updated_at", { ascending: false });

    if (!jobsRes.error) {
      for (const row of jobsRes.data ?? []) {
        const leadId = row.lead_id as string;
        if (!jobsByLead.has(leadId)) {
          jobsByLead.set(leadId, row as PlumbingJobRow);
        }
      }
    }
  }

  const items: CrmFeedItem[] = [];

  for (const row of leadRows) {
    const job = jobsByLead.get(row.id as string) ?? null;
    const verified = Boolean(row.email_verified_at || row.phone_verified_at);
    const opsLog = parseVoiceDemoOpsLog(row.ops_log);
    const opsWarnings = summarizeVoiceDemoOpsWarnings(opsLog);
    const jobStatus = job?.status ?? null;
    const displayStatus = jobStatus ?? (verified ? "verified" : "pending_verify");

    items.push({
      id: row.id as string,
      source: "plumbing_demo",
      at: (row.updated_at as string) ?? (row.created_at as string),
      title: (row.full_name as string) || "Plumbing Jarvis demo",
      email: (row.email as string) ?? "",
      businessName: "998 plumbing Jarvis",
      status: displayStatus,
      notes: opsWarnings
        ? [row.session_summary as string | null, `Jarvis ops:\n${opsWarnings}`]
            .filter(Boolean)
            .join("\n\n")
        : ((row.session_summary as string) ?? null),
      stripeSessionId: null,
      stripeSubscriptionId: null,
      message:
        jobPreview(job) ??
        (opsWarnings
          ? `Jarvis ops (${countVoiceDemoOpsWarnings(opsLog)})`
          : `Channel: ${row.primary_channel}`),
      phone: (row.phone as string) ?? null,
      payload: {
        vertical: "plumbers",
        primaryChannel: row.primary_channel,
        promoCode: row.promo_code,
        promoSentAt: row.promo_sent_at,
        opsLog,
        opsWarningCount: countVoiceDemoOpsWarnings(opsLog),
        plumbingJob: mapPlumbingJobPayload(job),
      },
      readAt: (row as { read_at?: string | null }).read_at ?? null,
      inboxFlag: parseInboxFlag((row as { inbox_flag?: unknown }).inbox_flag),
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return { items: items.slice(0, limit) };
}
