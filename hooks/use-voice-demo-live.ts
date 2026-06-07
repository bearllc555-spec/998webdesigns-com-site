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

type UseVoiceDemoLiveOptions = {
  onVerified?: () => void;
  onStatus?: (text: string) => void;
  onTranscript?: (line: string) => void;
};

export function useVoiceDemoLive(options: UseVoiceDemoLiveOptions = {}) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const sessionRef = useRef<Session | null>(null);
  const micRef = useRef<VoiceDemoMicHandle | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const playerRef = useRef<VoiceDemoAudioPlayer | null>(null);
  const modeRef = useRef<VoiceDemoLiveMode>("verify");

  const disconnect = useCallback(() => {
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

  const runTool = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      const res = await fetch("/api/voice-demo/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, args, mode: modeRef.current }),
      });
      const data = (await res.json()) as { result?: Record<string, unknown> };
      return data.result ?? { ok: false, error: "Tool failed" };
    },
    []
  );

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
            options.onVerified?.();
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
        options.onTranscript?.(`Assistant: ${outText}`);
      }
      const inText = message.serverContent?.inputTranscription?.text;
      if (inText) {
        options.onTranscript?.(`You: ${inText}`);
      }
    },
    [options, runTool]
  );

  const connect = useCallback(
    async (mode: VoiceDemoLiveMode) => {
      disconnect();
      setError("");
      setConnecting(true);
      modeRef.current = mode;
      options.onStatus?.(mode === "verify" ? "Connecting — say your code when ready…" : "Connecting…");

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
              options.onStatus?.(
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
    [disconnect, handleMessage, options]
  );

  return {
    connect,
    disconnect,
    connecting,
    connected,
    error,
  };
}
