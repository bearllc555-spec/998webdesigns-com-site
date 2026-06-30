import { describe, expect, it } from "vitest";
import { crmSessionToken } from "@/lib/crm-session";
import { verifyCrmSessionValueEdge } from "@/lib/crm-session-edge";

describe("verifyCrmSessionValueEdge", () => {
  it("matches Node crmSessionToken output", async () => {
    const secret = "test-crm-secret";
    const token = crmSessionToken(secret);
    expect(await verifyCrmSessionValueEdge(token, secret)).toBe(true);
    expect(await verifyCrmSessionValueEdge("wrong", secret)).toBe(false);
  });
});
