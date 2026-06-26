"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useVoiceDemoLive } from "@/hooks/use-voice-demo-live";
import { VoiceDemoLiveOpsTrace } from "@/components/demo/VoiceDemoLiveOpsTrace";
import { VoiceCaptionBar } from "@/components/VoiceDemo/VoiceCaptionBar";
import { PlumbingJarvisOrb } from "@/components/VoiceDemo/PlumbingJarvisOrb";
import { FIXED_INPUT_CLASS } from "@/components/form-field-stack";
import type { DemoBrandConfig } from "@/lib/demo-config/types";
import type { VoiceDemoVertical } from "@/lib/voice-demo-vertical";
import type { VoiceDemoCaption } from "@/lib/voice-demo-caption";

type Phase = "gate" | "demo";

type AestheticsDemoWidgetProps = {
  config: DemoBrandConfig;
  vertical: VoiceDemoVertical;
  startApiPath: string;
  compact?: boolean;
};

export function AestheticsDemoWidget({
  config,
  vertical,
  startApiPath,
  compact = false,
}: AestheticsDemoWidgetProps) {
  const jarvisSectionRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("gate");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("");
  const [caption, setCaption] = useState<VoiceDemoCaption | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const live = useVoiceDemoLive({
    vertical,
    onUnexpectedClose: () => {
      setStatus("Line paused — tap Start voice when you're ready to continue.");
    },
    onConversationEnd: () => setCaption(null),
    onStatus: setStatus,
    onCaption: setCaption,
  });

  useEffect(() => {
    void fetch("/api/voice-demo/status")
      .then((r) => r.json())
      .then((data: { configured?: boolean; verified?: boolean; active?: boolean; vertical?: string }) => {
        setConfigured(data.configured !== false);
        if (data.active && data.verified && data.vertical === vertical) {
          setPhase("demo");
        }
      })
      .catch(() => setConfigured(false));
  }, [vertical]);

  const scrollToJarvis = useCallback(() => {
    jarvisSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const startOver = useCallback(async () => {
    live.disconnectAndReset();
    setBusy(true);
    try {
      await fetch("/api/voice-demo/reset", { method: "POST" });
    } catch {
      /* still reset local */
    } finally {
      setPhase("gate");
      setEmail("");
      setStatus("");
      setCaption(null);
      setBusy(false);
    }
  }, [live]);

  async function startDemo(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      const res = await fetch(startApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const raw = await res.text();
      let data: { ok?: boolean; error?: string } = {};
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        setFormError(res.ok ? "Unexpected response." : `Could not start (${res.status}).`);
        return;
      }
      if (!res.ok) {
        setFormError(data.error ?? "Could not start. Try again.");
        return;
      }
      setCaption(null);
      setPhase("demo");
      setStatus("Ready — tap Start voice to talk to Jarvis.");
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const startVoice = () => {
    if (phase !== "demo") return;
    void live.connect("demo", { userInitiated: true });
  };

  if (configured === null) return null;

  return (
    <div ref={jarvisSectionRef} id="jarvis" className={compact ? "" : "scroll-mt-24"}>
      <div
        className="mx-auto w-full max-w-lg rounded-2xl border shadow-lg"
        style={{
          borderColor: `${config.palette.muted}55`,
          backgroundColor: config.palette.surface,
        }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: `${config.palette.muted}44` }}
        >
          <div>
            <p
              className="text-sm font-semibold tracking-wide"
              style={{ fontFamily: config.fonts.display, color: config.palette.ink }}
            >
              {config.brandName}
            </p>
            <p className="text-xs" style={{ color: config.palette.muted }}>
              Jarvis · voice + chat 24/7
            </p>
          </div>
          {phase === "demo" && (
            <button
              type="button"
              onClick={() => void startOver()}
              disabled={busy}
              className="rounded-lg px-2 py-1.5 text-xs font-medium opacity-70 hover:opacity-100 disabled:opacity-40"
              style={{ color: config.palette.ink }}
            >
              Start over
            </button>
          )}
        </div>

        <div className="px-4 py-5">
          {!configured && (
            <p className="text-center text-sm" style={{ color: config.palette.muted }}>
              Voice demo not configured (missing GEMINI_API_KEY).
            </p>
          )}

          {configured && phase === "gate" && (
            <form onSubmit={startDemo} className="space-y-4">
              <p className="text-sm" style={{ color: config.palette.muted }}>
                Enter your email to try Jarvis — ask about services, pricing, or book a visit. No
                verification code; jump straight into a voice call.
              </p>
              <div>
                <label htmlFor={`${config.slug}-demo-email`} className="mb-1 block text-sm font-medium">
                  Email
                </label>
                <input
                  id={`${config.slug}-demo-email`}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={FIXED_INPUT_CLASS}
                />
              </div>
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
              />
              {formError && <p className="text-sm text-warn">{formError}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60"
                style={{ backgroundColor: config.palette.accent }}
              >
                {busy ? "Starting…" : config.heroPrimaryCta}
              </button>
            </form>
          )}

          {configured && phase === "demo" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-2">
                <PlumbingJarvisOrb
                  levels={live.jarvisLevels}
                  speaking={live.jarvisSpeaking}
                  connected={live.connected}
                  connecting={live.connecting}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (live.connected) {
                      live.toggleMicMute();
                      return;
                    }
                    startVoice();
                  }}
                  disabled={live.connecting}
                  className="flex h-16 w-16 items-center justify-center rounded-full border-2 transition hover:scale-[1.02]"
                  style={{ borderColor: config.palette.accent }}
                  aria-label={live.connected ? "Toggle microphone" : "Start voice"}
                >
                  {live.connected && live.micMuted ? (
                    <MicOff className="h-6 w-6 text-red-600" />
                  ) : (
                    <Mic className="h-6 w-6" style={{ color: config.palette.accent }} />
                  )}
                </button>
                {!live.connected && !live.connecting && (
                  <button
                    type="button"
                    onClick={startVoice}
                    className="rounded-full px-5 py-2.5 text-sm font-medium text-white"
                    style={{ backgroundColor: config.palette.accent }}
                  >
                    Start voice
                  </button>
                )}
                {live.connected && (
                  <button
                    type="button"
                    onClick={() => live.endCall()}
                    className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-ink-soft"
                  >
                    <PhoneOff className="h-4 w-4" />
                    End call
                  </button>
                )}
              </div>
              {status && (
                <p className="text-center text-sm" style={{ color: config.palette.muted }}>
                  {status}
                </p>
              )}
              {(live.error || formError) && (
                <p className="text-center text-sm text-warn">{live.error || formError}</p>
              )}
              <p className="text-center text-xs" style={{ color: config.palette.muted }}>
                Reaching out after hours? Jarvis will take your number and text you right back.
              </p>
              <VoiceDemoLiveOpsTrace />
            </div>
          )}
        </div>

        {caption?.role === "user" && configured && phase === "demo" && (
          <VoiceCaptionBar caption={caption} />
        )}
      </div>

      {!compact && phase === "gate" && (
        <p className="mt-3 text-center text-xs" style={{ color: config.palette.muted }}>
          <button type="button" onClick={scrollToJarvis} className="underline-offset-2 hover:underline">
            Questions? Chat or talk 24/7
          </button>
        </p>
      )}
    </div>
  );
}

export function openJarvisSection() {
  document.getElementById("jarvis")?.scrollIntoView({ behavior: "smooth", block: "center" });
}
