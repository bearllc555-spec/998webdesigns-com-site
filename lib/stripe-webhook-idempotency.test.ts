import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: vi.fn(),
}));

import { supabaseAdmin } from "@/lib/supabase";
import { claimStripeWebhookEvent } from "@/lib/stripe-webhook-idempotency";

const mockedSupabaseAdmin = vi.mocked(supabaseAdmin);

afterEach(() => {
  vi.clearAllMocks();
});

describe("claimStripeWebhookEvent", () => {
  it("returns unavailable when Supabase is not configured", async () => {
    mockedSupabaseAdmin.mockReturnValue(null);
    await expect(claimStripeWebhookEvent("evt_test_1")).resolves.toBe("unavailable");
  });

  it("returns new on first insert", async () => {
    mockedSupabaseAdmin.mockReturnValue({
      from: () => ({
        insert: async () => ({ error: null }),
      }),
    } as never);

    await expect(claimStripeWebhookEvent("evt_test_2")).resolves.toBe("new");
  });

  it("returns duplicate on unique violation", async () => {
    mockedSupabaseAdmin.mockReturnValue({
      from: () => ({
        insert: async () => ({ error: { code: "23505", message: "duplicate key" } }),
      }),
    } as never);

    await expect(claimStripeWebhookEvent("evt_test_3")).resolves.toBe("duplicate");
  });

  it("returns unavailable when table is missing", async () => {
    mockedSupabaseAdmin.mockReturnValue({
      from: () => ({
        insert: async () => ({
          error: { code: "PGRST205", message: 'relation "processed_stripe_events" does not exist' },
        }),
      }),
    } as never);

    await expect(claimStripeWebhookEvent("evt_test_4")).resolves.toBe("unavailable");
  });
});
