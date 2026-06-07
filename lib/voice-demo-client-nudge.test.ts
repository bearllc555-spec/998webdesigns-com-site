import { describe, expect, it, vi } from "vitest";
import {
  createVoiceDemoNudgeQueue,
  enqueueVoiceDemoClientNudge,
  flushVoiceDemoClientNudgeQueue,
  sendVoiceDemoClientNudge,
} from "@/lib/voice-demo-client-nudge";

describe("voice-demo-client-nudge", () => {
  it("waits for playback idle before sendClientContent", async () => {
    const sendClientContent = vi.fn();
    const session = { sendClientContent } as never;
    const whenPlaybackIdle = vi.fn().mockResolvedValue(undefined);
    const player = {
      isPlaying: () => true,
      whenPlaybackIdle,
      hardStop: vi.fn(),
    } as never;

    const ok = await sendVoiceDemoClientNudge(session, player, "Hello");
    expect(ok).toBe(true);
    expect(whenPlaybackIdle).toHaveBeenCalled();
    expect(sendClientContent).toHaveBeenCalledWith({
      turns: ["Hello"],
      turnComplete: true,
    });
  });

  it("hardStop skips idle wait", async () => {
    const sendClientContent = vi.fn();
    const session = { sendClientContent } as never;
    const hardStop = vi.fn();
    const player = {
      isPlaying: () => true,
      whenPlaybackIdle: vi.fn(),
      hardStop,
    } as never;

    await sendVoiceDemoClientNudge(session, player, "Fix", { hardStop: true });
    expect(hardStop).toHaveBeenCalled();
    expect(sendClientContent).toHaveBeenCalled();
  });

  it("flushes queued nudges in order", async () => {
    const queue = createVoiceDemoNudgeQueue();
    enqueueVoiceDemoClientNudge(queue, "First");
    enqueueVoiceDemoClientNudge(queue, "Second");

    const sent: string[][] = [];
    const session = {
      sendClientContent: ({ turns }: { turns: string[] }) => {
        sent.push(turns);
      },
    } as never;
    const player = {
      isPlaying: () => false,
      whenPlaybackIdle: vi.fn().mockResolvedValue(undefined),
      hardStop: vi.fn(),
    } as never;

    await flushVoiceDemoClientNudgeQueue(session, player, queue);
    expect(sent).toEqual([["First"], ["Second"]]);
    expect(queue.pending).toHaveLength(0);
  });
});
