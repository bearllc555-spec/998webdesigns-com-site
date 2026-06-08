import { describe, expect, it } from "vitest";
import {
  canSendVoiceDemoRealtimeInput,
  isUrgentLiveReconnectReason,
  shouldDeferLiveReconnect,
} from "@/lib/voice-demo-live-reconnect-policy";

describe("voice-demo-live-reconnect-policy", () => {
  it("blocks realtime input during tool calls", () => {
    expect(canSendVoiceDemoRealtimeInput(0)).toBe(true);
    expect(canSendVoiceDemoRealtimeInput(1)).toBe(false);
  });

  it("defers reconnect while tools are in flight", () => {
    expect(
      shouldDeferLiveReconnect({
        reason: "goAway",
        toolInFlight: 1,
        sessionResumable: true,
      })
    ).toEqual({ defer: true, cause: "tool" });
  });

  it("defers goAway when session is not resumable", () => {
    expect(
      shouldDeferLiveReconnect({
        reason: "goAway",
        toolInFlight: 0,
        sessionResumable: false,
      })
    ).toEqual({ defer: true, cause: "not_resumable" });
  });

  it("allows websocket_close without resumable gate", () => {
    expect(
      shouldDeferLiveReconnect({
        reason: "websocket_close",
        toolInFlight: 0,
        sessionResumable: false,
      })
    ).toEqual({ defer: false, cause: null });
  });

  it("treats only websocket_close as urgent", () => {
    expect(isUrgentLiveReconnectReason("websocket_close")).toBe(true);
    expect(isUrgentLiveReconnectReason("goAway")).toBe(false);
    expect(isUrgentLiveReconnectReason("websocket_error")).toBe(false);
  });
});
