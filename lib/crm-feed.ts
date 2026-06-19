import { isCrmInboxFlag, type CrmInboxFlag } from "@/lib/crm-inbox-flag";
import { wdLeadCrmFeedSource } from "@/lib/crm-wd-lead-segment";
import { supabaseAdmin } from "@/lib/supabase";
import {
  countVoiceDemoOpsWarnings,
  parseVoiceDemoOpsLog,
  summarizeVoiceDemoOpsWarnings,
} from "@/lib/voice-demo-ops";
import { isVoiceDemoCallbackSummary } from "@/lib/voice-demo-callback";
import { fetchPlumbingCrmFeed } from "@/lib/plumbing-crm-feed";
import { formatPossibleLocationLabel } from "@/lib/voice-demo-location";
import type { CrmContactFields } from "@/lib/crm-contact-fields";
import {
  crmContactFromPayload,
  crmContactFromVoiceDemoLead,
} from "@/lib/crm-contact-fields";

export type { CrmInboxFlag };

export type CrmFeedSource =
  | "lead"
  | "client"
  | "contact"
  | "discovery"
  | "linkedin"
  | "sms"
  | "voice_demo"
  | "plumbing_demo"
  | "blog";

export type CrmFeedItem = {
  id: string;
  source: CrmFeedSource;
  at: string;
  title: string;
  email: string;
  businessName: string;
  status: string | null;
  notes: string | null;
  stripeSessionId: string | null;
  stripeSubscriptionId: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  phone: string | null;
  /** Progressive contact - street through cell; partial until booking matures. */
  contact?: CrmContactFields;
  /** null = unread */
  readAt: string | null;
  /** null = outline star; cycles star → check → alert → null */
  inboxFlag: CrmInboxFlag | null;
};

function parseInboxFlag(value: unknown): CrmInboxFlag | null {
  return isCrmInboxFlag(value) ? value : null;
}

export function isCrmFeedItemUnread(item: CrmFeedItem): boolean {
  return item.readAt == null;
}

export type CrmFeedResult = {
  items: CrmFeedItem[];
  /** Set when Supabase is misconfigured or the schema query failed. */
  error?: string;
};

export async function fetchCrmFeed(limit = 80): Promise<CrmFeedResult> {
  const supa = supabaseAdmin();
  if (!supa) {
    return {
      items: [],
      error:
        "Supabase not configured locally. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (helmet: xwldbxburzqryxlzocck - see DEV.md).",
    };
  }

  const [
    leadsRes,
    contactsRes,
    discoveryRes,
    linkedinRes,
    voiceDemoRes,
    blogRes,
    inboundRes,
    inboundLinkedRes,
    inboundLeadLinkedRes,
  ] = await Promise.all([
    supa
      .from("wd_leads")
      .select(
        "id, submitted_at, email, business_name, full_name, status, notes, stripe_deposit_invoice_id, stripe_subscription_id, payload, read_at, inbox_flag"
      )
      .order("submitted_at", { ascending: false })
      .limit(limit),
    supa
      .from("contact_submissions")
      .select("id, submitted_at, email, name, business_name, message, read_at, inbox_flag")
      .order("submitted_at", { ascending: false })
      .limit(limit),
    supa
      .from("discovery_prospects")
      .select(
        "id, created_at, updated_at, email, full_name, phone, status, goal, intake, close_draft, crm_notes, wd_lead_id, read_at, inbox_flag"
      )
      .order("updated_at", { ascending: false })
      .limit(limit),
    supa
      .from("linkedin_prospects")
      .select(
        "id, created_at, updated_at, email, full_name, company_name, status, linkedin_url, public_identifier, email_capture_snippet, crm_notes, campaign_name, linkedin_state, instantly_last_event_type, read_at, inbox_flag"
      )
      .order("updated_at", { ascending: false })
      .limit(limit),
    supa
      .from("voice_demo_leads")
      .select(
        "id, created_at, updated_at, email, phone, full_name, primary_channel, email_verified_at, phone_verified_at, promo_code, promo_sent_at, session_summary, ops_log, location_zip, location_city, location_state, read_at, inbox_flag, vertical"
      )
      .order("updated_at", { ascending: false })
      .limit(limit),
    supa
      .from("blog_posts")
      .select("id, slug, title, description, url, published_at, read_at, inbox_flag")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(limit),
    supa
      .from("inbound_sms")
      .select("id, created_at, from_phone, body, read_at, inbox_flag")
      .is("discovery_prospect_id", null)
      .is("wd_lead_id", null)
      .order("created_at", { ascending: false })
      .limit(limit),
    supa
      .from("inbound_sms")
      .select("discovery_prospect_id, body, created_at")
      .not("discovery_prospect_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supa
      .from("inbound_sms")
      .select("wd_lead_id, body, created_at")
      .not("wd_lead_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const errors: string[] = [];
  if (leadsRes.error) {
    console.warn("[crm-feed] wd_leads:", leadsRes.error.message);
    errors.push(`leads: ${leadsRes.error.message}`);
  }
  if (contactsRes.error) {
    console.warn("[crm-feed] contact_submissions:", contactsRes.error.message);
    errors.push(`contacts: ${contactsRes.error.message}`);
  }
  if (discoveryRes.error && !isMissingDiscoveryTable(discoveryRes.error)) {
    console.warn("[crm-feed] discovery_prospects:", discoveryRes.error.message);
    errors.push(`discovery: ${discoveryRes.error.message}`);
  }
  if (linkedinRes.error && !isMissingTable(linkedinRes.error)) {
    console.warn("[crm-feed] linkedin_prospects:", linkedinRes.error.message);
    errors.push(`linkedin: ${linkedinRes.error.message}`);
  }
  if (voiceDemoRes.error && !isMissingTable(voiceDemoRes.error)) {
    console.warn("[crm-feed] voice_demo_leads:", voiceDemoRes.error.message);
    errors.push(`voice_demo: ${voiceDemoRes.error.message}`);
  }
  if (blogRes.error && !isMissingTable(blogRes.error)) {
    console.warn("[crm-feed] blog_posts:", blogRes.error.message);
    errors.push(`blog: ${blogRes.error.message}`);
  }
  if (inboundRes.error && !isMissingTable(inboundRes.error)) {
    console.warn("[crm-feed] inbound_sms:", inboundRes.error.message);
    errors.push(`sms: ${inboundRes.error.message}`);
  }
  if (inboundLeadLinkedRes.error && !isMissingTable(inboundLeadLinkedRes.error)) {
    console.warn("[crm-feed] inbound_sms wd_lead:", inboundLeadLinkedRes.error.message);
  }
  if (errors.length) {
    const hint = /inbox_flag|read_at|does not exist|wd_lead_id/i.test(errors.join(" "))
      ? " Run CRM migrations in Supabase (read_at, inbox_flag, inbound_sms.wd_lead_id) or POST /api/admin/migrate-inbound-sms-wd-lead."
      : "";
    return { items: [], error: errors.join("; ") + hint };
  }

  const items: CrmFeedItem[] = [];

  const latestSmsByProspect = new Map<string, { body: string; created_at: string }>();
  for (const row of inboundLinkedRes.data ?? []) {
    const pid = row.discovery_prospect_id as string;
    if (!pid || latestSmsByProspect.has(pid)) continue;
    latestSmsByProspect.set(pid, {
      body: row.body as string,
      created_at: row.created_at as string,
    });
  }

  const latestSmsByLead = new Map<string, { body: string; created_at: string }>();
  for (const row of inboundLeadLinkedRes.data ?? []) {
    const leadId = row.wd_lead_id as string;
    if (!leadId || latestSmsByLead.has(leadId)) continue;
    latestSmsByLead.set(leadId, {
      body: row.body as string,
      created_at: row.created_at as string,
    });
  }

  for (const row of leadsRes.data ?? []) {
    const payload = (row.payload as Record<string, unknown>) ?? {};
    const phone = typeof payload.phone === "string" ? payload.phone : null;
    const latestSms = latestSmsByLead.get(row.id as string);
    const submittedAt = row.submitted_at as string;
    const at =
      latestSms &&
      new Date(latestSms.created_at).getTime() > new Date(submittedAt).getTime()
        ? latestSms.created_at
        : submittedAt;
    items.push({
      id: row.id,
      source: wdLeadCrmFeedSource(row.status),
      at,
      title: row.full_name,
      email: row.email,
      businessName: row.business_name,
      status: row.status,
      notes: row.notes,
      stripeSessionId: row.stripe_deposit_invoice_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      message: latestSms?.body ?? null,
      payload: { ...payload, hasSmsThread: Boolean(latestSms) },
      phone,
      contact: {
        cellPhone: phone,
        ...crmContactFromPayload(payload),
      },
      readAt: (row as { read_at?: string | null }).read_at ?? null,
      inboxFlag: parseInboxFlag((row as { inbox_flag?: unknown }).inbox_flag),
    });
  }

  for (const row of discoveryRes.data ?? []) {
    const intake = row.intake as { businessName?: string } | null;
    const wdLeadId = (row as { wd_lead_id?: string | null }).wd_lead_id ?? null;
    const latestSms =
      latestSmsByProspect.get(row.id as string) ??
      (wdLeadId ? latestSmsByLead.get(wdLeadId) : undefined);
    const at =
      latestSms &&
      new Date(latestSms.created_at).getTime() > new Date(row.created_at as string).getTime()
        ? latestSms.created_at
        : (row.updated_at as string) ?? (row.created_at as string);
    items.push({
      id: row.id,
      source: "discovery",
      at,
      title: row.full_name,
      email: row.email,
      businessName: intake?.businessName ?? "",
      status: row.status,
      notes: (row as { crm_notes?: string | null }).crm_notes ?? null,
      stripeSessionId: null,
      stripeSubscriptionId: null,
      message: latestSms?.body ?? row.goal,
      phone: row.phone ?? null,
      contact: {
        cellPhone: row.phone ?? null,
        ...(typeof row.intake === "object" && row.intake
          ? crmContactFromPayload(row.intake as Record<string, unknown>)
          : {}),
      },
      payload: {
        goal: row.goal,
        intake: row.intake,
        closeDraft: row.close_draft,
        wdLeadId: row.wd_lead_id ?? null,
        hasSmsThread: Boolean(latestSms),
      },
      readAt: (row as { read_at?: string | null }).read_at ?? null,
      inboxFlag: parseInboxFlag((row as { inbox_flag?: unknown }).inbox_flag),
    });
  }

  for (const row of linkedinRes.data ?? []) {
    items.push({
      id: row.id,
      source: "linkedin",
      at: (row.updated_at as string) ?? (row.created_at as string),
      title: (row.full_name as string) || (row.public_identifier as string) || "LinkedIn prospect",
      email: row.email as string,
      businessName: (row.company_name as string) ?? "",
      status: row.status as string,
      notes: (row.crm_notes as string | null) ?? null,
      stripeSessionId: null,
      stripeSubscriptionId: null,
      message:
        (row.email_capture_snippet as string | null) ??
        (row.instantly_last_event_type as string | null),
      phone: null,
      payload: {
        linkedinUrl: row.linkedin_url,
        publicIdentifier: row.public_identifier,
        linkedinState: row.linkedin_state,
        campaignName: row.campaign_name,
      },
      readAt: (row as { read_at?: string | null }).read_at ?? null,
      inboxFlag: parseInboxFlag((row as { inbox_flag?: unknown }).inbox_flag),
    });
  }

  for (const row of voiceDemoRes.data ?? []) {
    const vertical = (row as { vertical?: string | null }).vertical;
    if (vertical === "plumbers") continue;
    const verified = Boolean(row.email_verified_at || row.phone_verified_at);
    const locationLabel = formatPossibleLocationLabel(
      (row.location_city as string | null) ?? null,
      (row.location_state as string | null) ?? null,
      (row.location_zip as string | null) ?? null
    );
    const opsLog = parseVoiceDemoOpsLog(row.ops_log);
    const opsWarnings = summarizeVoiceDemoOpsWarnings(opsLog);
    const sessionSummary = (row.session_summary as string | null) ?? null;
    const opsNotes = opsWarnings
      ? [sessionSummary, `Jarvis ops:\n${opsWarnings}`].filter(Boolean).join("\n\n")
      : sessionSummary;
    const callbackRequested = isVoiceDemoCallbackSummary(sessionSummary);
    items.push({
      id: row.id,
      source: "voice_demo",
      at: (row.updated_at as string) ?? (row.created_at as string),
      title: (row.full_name as string) || "998web Jarvis demo",
      email: (row.email as string) ?? "",
      businessName: "998web Jarvis",
      status: callbackRequested ? "callback_requested" : verified ? "verified" : "pending_verify",
      notes: opsNotes,
      stripeSessionId: null,
      stripeSubscriptionId: null,
      message: callbackRequested
        ? sessionSummary
        : opsWarnings
          ? `Jarvis ops (${countVoiceDemoOpsWarnings(opsLog)}): see notes`
          : locationLabel
            ? `Possible location: ${locationLabel}`
            : row.promo_sent_at
              ? `Promo ${row.promo_code ?? "sent"}`
              : `Channel: ${row.primary_channel}`,
      phone: (row.phone as string) ?? null,
      contact: crmContactFromVoiceDemoLead({
        phone: row.phone as string | null,
        location_city: row.location_city as string | null,
        location_state: row.location_state as string | null,
        location_zip: row.location_zip as string | null,
      }),
      payload: {
        primaryChannel: row.primary_channel,
        promoCode: row.promo_code,
        promoSentAt: row.promo_sent_at,
        opsLog,
        opsWarningCount: countVoiceDemoOpsWarnings(opsLog),
        possibleLocation: locationLabel
          ? {
              zip: row.location_zip,
              city: row.location_city,
              state: row.location_state,
              label: locationLabel,
            }
          : null,
      },
      readAt: (row as { read_at?: string | null }).read_at ?? null,
      inboxFlag: parseInboxFlag((row as { inbox_flag?: unknown }).inbox_flag),
    });
  }

  for (const row of blogRes.data ?? []) {
    items.push({
      id: row.id,
      source: "blog",
      at: row.published_at as string,
      title: row.title as string,
      email: "",
      businessName: "",
      status: "published",
      notes: null,
      stripeSessionId: null,
      stripeSubscriptionId: null,
      message: (row.description as string) ?? null,
      phone: null,
      payload: {
        slug: row.slug,
        url: row.url,
      },
      readAt: (row as { read_at?: string | null }).read_at ?? null,
      inboxFlag: parseInboxFlag((row as { inbox_flag?: unknown }).inbox_flag),
    });
  }

  for (const row of contactsRes.data ?? []) {
    items.push({
      id: row.id,
      source: "contact",
      at: row.submitted_at,
      title: row.name,
      email: row.email,
      businessName: row.business_name ?? "",
      status: null,
      notes: null,
      stripeSessionId: null,
      stripeSubscriptionId: null,
      message: row.message,
      payload: null,
      phone: null,
      contact: {},
      readAt: (row as { read_at?: string | null }).read_at ?? null,
      inboxFlag: parseInboxFlag((row as { inbox_flag?: unknown }).inbox_flag),
    });
  }

  for (const row of inboundRes.data ?? []) {
    items.push({
      id: row.id,
      source: "sms",
      at: row.created_at,
      title: row.from_phone,
      email: "",
      businessName: "",
      status: null,
      notes: null,
      stripeSessionId: null,
      stripeSubscriptionId: null,
      message: row.body,
      phone: row.from_phone,
      contact: { cellPhone: row.from_phone ?? null },
      payload: null,
      readAt: (row as { read_at?: string | null }).read_at ?? null,
      inboxFlag: parseInboxFlag((row as { inbox_flag?: unknown }).inbox_flag),
    });
  }

  const plumbingFeed = await fetchPlumbingCrmFeed(limit);
  if (plumbingFeed.error) {
    console.warn("[crm-feed] plumbing_demo:", plumbingFeed.error);
    errors.push(`plumbing_demo: ${plumbingFeed.error}`);
  }
  items.push(...plumbingFeed.items);

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return { items: items.slice(0, limit) };
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? "";
  const msg = error.message ?? "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    /schema cache/i.test(msg) ||
    /does not exist/i.test(msg)
  );
}

function isMissingDiscoveryTable(error: { code?: string; message?: string }): boolean {
  return isMissingTable(error);
}
