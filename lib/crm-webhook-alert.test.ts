import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyCrmWebhookAlert } from "@/lib/crm-webhook-alert";

describe("notifyCrmWebhookAlert", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    delete process.env.WEBHOOK_CRM_ALERT_URL;
    vi.unstubAllGlobals();
  });

  it("skips when WEBHOOK_CRM_ALERT_URL is unset", async () => {
    await notifyCrmWebhookAlert({
      section: "contact",
      name: "Jane",
      company: "",
      email: "jane@example.com",
      phone: "",
      message: "Hi",
      service: "",
      appointment_time: "",
      created_at: "2026-06-11T12:00:00.000Z",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("POSTs JSON payload to configured URL", async () => {
    process.env.WEBHOOK_CRM_ALERT_URL = "https://hooks.example.com/crm";
    vi.mocked(fetch).mockResolvedValue(new Response("ok", { status: 200 }));

    await notifyCrmWebhookAlert({
      section: "lead",
      name: "Bob",
      company: "Bob LLC",
      email: "bob@example.com",
      phone: "+15551234567",
      message: "Notes here",
      service: "",
      appointment_time: "",
      created_at: "2026-06-11T12:00:00.000Z",
    });

    expect(fetch).toHaveBeenCalledWith("https://hooks.example.com/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "lead",
        name: "Bob",
        company: "Bob LLC",
        email: "bob@example.com",
        phone: "+15551234567",
        message: "Notes here",
        service: "",
        appointment_time: "",
        created_at: "2026-06-11T12:00:00.000Z",
      }),
    });
  });

  it("logs and does not throw on network failure", async () => {
    process.env.WEBHOOK_CRM_ALERT_URL = "https://hooks.example.com/crm";
    vi.mocked(fetch).mockRejectedValue(new Error("connection refused"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      notifyCrmWebhookAlert({
        section: "jarvis_demo",
        name: "",
        company: "",
        email: "demo@example.com",
        phone: "",
        message: "",
        service: "",
        appointment_time: "",
        created_at: "2026-06-11T12:00:00.000Z",
      })
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
