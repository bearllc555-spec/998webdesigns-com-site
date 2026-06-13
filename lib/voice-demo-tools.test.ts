import { describe, expect, it } from "vitest";
import { voiceDemoToolDeclarations } from "@/lib/voice-demo-tools";

describe("voiceDemoToolDeclarations", () => {
  it("does not declare end_conversation - client owns hangup", () => {
    const tools = voiceDemoToolDeclarations("demo");
    const decls = tools[0]?.functionDeclarations ?? [];
    const names = decls.map((d) => d.name);
    expect(names).not.toContain("end_conversation");
    expect(names).toContain("save_name");
    expect(names).toContain("send_promo_email");
    expect(names).toContain("request_callback");
  });
});
