/** CRM feed item sources that map to voice_demo_leads (marketing + plumbing Jarvis). */
export type CrmVoiceDemoFeedSource = "voice_demo" | "plumbing_demo";

export function isCrmVoiceDemoFeedSource(
  source: string
): source is CrmVoiceDemoFeedSource {
  return source === "voice_demo" || source === "plumbing_demo";
}

export function crmVoiceDemoLeadsTable(source: string): "voice_demo_leads" | null {
  return isCrmVoiceDemoFeedSource(source) ? "voice_demo_leads" : null;
}
