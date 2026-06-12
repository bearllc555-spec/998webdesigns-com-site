export type CrmWebhookSection = "contact" | "lead" | "jarvis_demo";

export type CrmWebhookPayload = {
  section: CrmWebhookSection;
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  service: string;
  appointment_time: string;
  created_at: string;
};

/** POST new CRM entry to WEBHOOK_CRM_ALERT_URL. Fire-and-forget; never throws. */
export async function notifyCrmWebhookAlert(payload: CrmWebhookPayload): Promise<void> {
  const url = process.env.WEBHOOK_CRM_ALERT_URL?.trim();
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(
        `[crm-webhook] POST ${res.status} for ${payload.section}:`,
        detail.slice(0, 500) || res.statusText
      );
      return;
    }

    console.info(
      `[crm-webhook] ${payload.section} alert sent`,
      payload.email || payload.name || payload.phone || "(no contact)"
    );
  } catch (err) {
    console.warn(
      "[crm-webhook] POST failed:",
      err instanceof Error ? err.message : String(err)
    );
  }
}
