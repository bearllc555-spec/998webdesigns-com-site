"use client";

import { useCallback, useRef, useState } from "react";
import { GoogleGenAI } from "@google/genai";
import {
  requestVoiceDemoMicStream,
  startVoiceDemoMic,
  VoiceDemoAudioPlayer,
  type VoiceDemoMicHandle,
} from "@/lib/voice-demo-audio-client";
import { VOICE_DEMO_LIVE_MODEL } from "@/lib/voice-demo-constants";
import {
  mergeTranscriptChunk,
  type VoiceDemoCaption,
  type VoiceDemoCaptionRole,
} from "@/lib/voice-demo-caption";
import { isAssistantFarewell, isUserFarewellEcho } from "@/lib/voice-demo-farewell";
import type { Session } from "@google/genai";

export type VoiceDemoLiveMode = "verify" | "demo";

type LiveMessage = {
  toolCall?: {
    functionCalls?: Array<{
      id?: string;
      name?: string;
      args?: Record<string, unknown>;
    }>;
  };
  serverContent?: {
    modelTurn?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
    outputTranscription?: { text?: string };
    inputTranscription?: { text?: string };
    turnComplete?: boolean;
    interrupted?: boolean;
  };
};

export type VoiceDemoPhaseTransition = { kind: "verified"; nextMode: "demo" };

type UseVoiceDemoLiveOptions = {
  onPhaseTransition?: (transition: VoiceDemoPhaseTransition) => void;
  onUnexpectedClose?: () => void;
  onConversationEnd?: () => void;
  onStatus?: (text: string) => void;
  onCaption?: (caption: VoiceDemoCaption) => void;
};

const PHASE_TAIL_MS = 450;
const RECONNECT_DELAY_MS = 700;
const PHASE_FALLBACK_MS = 12000;
const PHASE_MIN_SPOKEN_MS = 1800;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useVoiceDemoLive(options: UseVoiceDemoLiveOptions = {}) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const sessionRef = useRef<Session | null>(null);
  const micRef = useRef<VoiceDemoMicHandle | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const playerRef = useRef<VoiceDemoAudioPlayer | null>(null);
  const modeRef = useRef<VoiceDemoLiveMode>("verify");
  const intentionalDisconnectRef = useRef(false);
  const pendingPhaseRef = useRef<VoiceDemoPhaseTransition | null>(null);
  const pendingSinceRef = useRef<number | null>(null);
  const pendingFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishingPhaseRef = useRef(false);
  const jarvisFarewellSentRef = useRef(false);
  const farewellDisconnectingRef = useRef(false);
  const lastAssistantTextRef = useRef("");
  const captionRoleRef = useRef<VoiceDemoCaptionRole | null>(null);
  const captionTextRef = useRef("");
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const emitCaption = useCallback((role: VoiceDemoCaptionRole, chunk: string) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;

    if (captionRoleRef.current !== role) {
      captionRoleRef.current = role;
      captionTextRef.current = trimmed;
    } else {
      captionTextRef.current = mergeTranscriptChunk(captionTextRef.current, trimmed);
    }

    optionsRef.current.onCaption?.({
      role,
      text: captionTextRef.current,
    });
  }, []);

  const resetCaption = useCallback(() => {
    captionRoleRef.current = null;
    captionTextRef.current = "";
  }, []);

  const clearPendingFallback = useCallback(() => {
    if (pendingFallbackTimerRef.current) {
      clearTimeout(pendingFallbackTimerRef.current);
      pendingFallbackTimerRef.current = null;
    }
  }, []);

  const disconnect = useCallback((intentional = true) => {
    intentionalDisconnectRef.current = intentional;
    micRef.current?.stop();
    micRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    try {
      sessionRef.current?.close();
    } catch {
      /* ignore */
    }
    sessionRef.current = null;
    playerRef.current?.close();
    playerRef.current = null;
    setConnected(false);
    setConnecting(false);
  }, []);

  const disconnectGraceful = useCallback(async () => {
    await playerRef.current?.whenPlaybackIdle(10000);
    await sleep(PHASE_TAIL_MS);
    disconnect(true);
  }, [disconnect]);

  const finishPendingPhase = useCallback(async () => {
    if (finishingPhaseRef.current || !pendingPhaseRef.current) return;
    finishingPhaseRef.current = true;
    clearPendingFallback();

    const transition = pendingPhaseRef.current;
    pendingPhaseRef.current = null;

    try {
      if (pendingSinceRef.current) {
        const elapsed = Date.now() - pendingSinceRef.current;
        if (elapsed < PHASE_MIN_SPOKEN_MS) {
          await sleep(PHASE_MIN_SPOKEN_MS - elapsed);
        }
        pendingSinceRef.current = null;
      }

      optionsRef.current.onPhaseTransition?.(transition);
      await playerRef.current?.whenPlaybackIdle(12000);
      await sleep(PHASE_TAIL_MS);
      disconnect(true);
      await sleep(RECONNECT_DELAY_MS);
      await connectRef.current(transition.nextMode);
    } finally {
      finishingPhaseRef.current = false;
    }
  }, [clearPendingFallback, disconnect]);

  const schedulePendingFallback = useCallback(() => {
    clearPendingFallback();
    pendingFallbackTimerRef.current = setTimeout(() => {
      void finishPendingPhase();
    }, PHASE_FALLBACK_MS);
  }, [clearPendingFallback, finishPendingPhase]);

  const queuePhaseTransition = useCallback(
    (transition: VoiceDemoPhaseTransition) => {
      pendingPhaseRef.current = transition;
      pendingSinceRef.current = Date.now();
      schedulePendingFallback();
    },
    [schedulePendingFallback]
  );

  const finishConversation = useCallback(async () => {
    if (farewellDisconnectingRef.current) return;
    farewellDisconnectingRef.current = true;
    try {
      await playerRef.current?.whenPlaybackIdle(12000);
      await sleep(PHASE_TAIL_MS);
      optionsRef.current.onConversationEnd?.();
      optionsRef.current.onStatus?.("Call ended — tap Start voice to chat again.");
      disconnect(true);
    } finally {
      farewellDisconnectingRef.current = false;
      jarvisFarewellSentRef.current = false;
      lastAssistantTextRef.current = "";
    }
  }, [disconnect]);

  const endCallNow = useCallback(() => {
    if (farewellDisconnectingRef.current) return;
    farewellDisconnectingRef.current = true;
    micRef.current?.stop();
    optionsRef.current.onConversationEnd?.();
    optionsRef.current.onStatus?.("Call ended — tap Start voice to chat again.");
    disconnect(true);
    farewellDisconnectingRef.current = false;
    jarvisFarewellSentRef.current = false;
    lastAssistantTextRef.current = "";
  }, [disconnect]);

  const runTool = useCallback(async (name: string, args: Record<string, unknown>) => {
    const res = await fetch("/api/voice-demo/tool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, args, mode: modeRef.current }),
    });
    const data = (await res.json()) as { result?: Record<string, unknown> };
    return data.result ?? { ok: false, error: "Tool failed" };
  }, []);

  const handleMessage = useCallback(
    async (message: LiveMessage) => {
      const calls = message.toolCall?.functionCalls ?? [];
      if (calls.length > 0 && sessionRef.current) {
        const responses = [];
        for (const call of calls) {
          const name = call.name ?? "";
          const args = (call.args ?? {}) as Record<string, unknown>;
          const result = await runTool(name, args);

          if (name === "verify_code" && result.verified === true) {
            queuePhaseTransition({ kind: "verified", nextMode: "demo" });
          }

          if (name === "end_conversation" && result.endCall === true) {
            jarvisFarewellSentRef.current = true;
            void finishConversation();
          }

          responses.push({
            id: call.id,
            name,
            response: result,
          });
        }
        sessionRef.current.sendToolResponse({ functionResponses: responses });
      }

      const parts = message.serverContent?.modelTurn?.parts ?? [];
      for (const part of parts) {
        const data = part.inlineData?.data;
        const mime = part.inlineData?.mimeType ?? "";
        if (data && mime.includes("audio/pcm")) {
          playerRef.current ??= new VoiceDemoAudioPlayer();
          playerRef.current.enqueueBase64Pcm(data);
        }
      }

      if (message.serverContent?.interrupted) {
        playerRef.current?.reset();
      }

      const outText = message.serverContent?.outputTranscription?.text;
      if (outText) {
        lastAssistantTextRef.current = mergeTranscriptChunk(
          lastAssistantTextRef.current,
          outText
        );
        emitCaption("assistant", outText);
      }
      const inText = message.serverContent?.inputTranscription?.text;
      if (inText) {
        emitCaption("user", inText);
        if (
          jarvisFarewellSentRef.current &&
          isUserFarewellEcho(inText) &&
          modeRef.current === "demo"
        ) {
          endCallNow();
          return;
        }
      }

      if (message.serverContent?.turnComplete) {
        if (
          modeRef.current === "demo" &&
          isAssistantFarewell(lastAssistantTextRef.current)
        ) {
          jarvisFarewellSentRef.current = true;
        }
        lastAssistantTextRef.current = "";

        if (pendingPhaseRef.current) {
          void finishPendingPhase();
        }
      }
    },
    [emitCaption, endCallNow, finishConversation, finishPendingPhase, queuePhaseTransition, runTool]
  );

  const connect = useCallback(
    async (mode: VoiceDemoLiveMode) => {
      pendingPhaseRef.current = null;
      pendingSinceRef.current = null;
      clearPendingFallback();
      finishingPhaseRef.current = false;
      jarvisFarewellSentRef.current = false;
      farewellDisconnectingRef.current = false;
      lastAssistantTextRef.current = "";
      resetCaption();
      disconnect(true);
      setError("");
      setConnecting(true);
      modeRef.current = mode;
      optionsRef.current.onStatus?.(
        mode === "verify" ? "Connecting — say your code when ready…" : "Connecting…"
      );

      try {
        const stream = await requestVoiceDemoMicStream();
        micStreamRef.current = stream;

        const tokenRes = await fetch("/api/voice-demo/live-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });
        const tokenData = (await tokenRes.json()) as {
          ok?: boolean;
          token?: string;
          model?: string;
          error?: string;
        };

        if (!tokenRes.ok || !tokenData.token) {
          stream.getTracks().forEach((t) => t.stop());
          micStreamRef.current = null;
          setError(tokenData.error ?? "Could not start voice session.");
          setConnecting(false);
          return;
        }

        const ai = new GoogleGenAI({
          apiKey: tokenData.token,
          httpOptions: { apiVersion: "v1alpha" },
        });

        const session = await ai.live.connect({
          model: tokenData.model ?? VOICE_DEMO_LIVE_MODEL,
          callbacks: {
            onopen: () => {
              setConnected(true);
              setConnecting(false);
              optionsRef.current.onStatus?.(
                mode === "verify"
                  ? "Listening — read your 6-digit code aloud."
                  : "You're live — ask me anything about 998."
              );
              if (micStreamRef.current) {
                micRef.current = startVoiceDemoMic(micStreamRef.current, (base64) => {
                  sessionRef.current?.sendRealtimeInput({
                    audio: {
                      data: base64,
                      mimeType: "audio/pcm;rate=16000",
                    },
                  });
                });
              }
            },
            onmessage: (msg) => {
              void handleMessage(msg as LiveMessage);
            },
            onerror: (e) => {
              console.warn("[voice-demo-live]", e);
              setError("Voice connection error.");
            },
            onclose: () => {
              setConnected(false);
              if (!intentionalDisconnectRef.current) {
                optionsRef.current.onUnexpectedClose?.();
              }
              intentionalDisconnectRef.current = false;
            },
          },
        });

        sessionRef.current = session;
      } catch (err) {
        console.warn("[voice-demo-live] connect", err);
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
        const message =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Microphone blocked. Allow mic access in your browser, then tap Start voice again."
            : err instanceof Error && err.message.includes("not supported")
              ? err.message
              : "Could not connect to voice assistant.";
        setError(message);
        setConnecting(false);
      }
    },
    [clearPendingFallback, disconnect, handleMessage]
  );

  const connectRef = useRef(connect);
  connectRef.current = connect;

  const transitionToDemo = useCallback(async () => {
    optionsRef.current.onPhaseTransition?.({ kind: "verified", nextMode: "demo" });
    await disconnectGraceful();
    await sleep(RECONNECT_DELAY_MS);
    await connect("demo");
  }, [connect, disconnectGraceful]);

  return {
    connect,
    disconnect: () => disconnect(true),
    disconnectGraceful,
    transitionToDemo,
    connecting,
    connected,
    error,
  };
}
