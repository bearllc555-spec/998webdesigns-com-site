"use client";

import { useCallback, useEffect, useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { useVoiceDemoLive } from "@/hooks/use-voice-demo-live";
import { VoiceCaptionBar } from "@/components/VoiceDemo/VoiceCaptionBar";
import { VoiceJarvisOrb } from "@/components/VoiceDemo/VoiceJarvisOrb";
import { FIXED_INPUT_CLASS } from "@/components/form-field-stack";
import {
  PLUMBING_DEMO_BUSINESS_NAME,
  PLUMBING_DEMO_TAGLINE,
} from "@/lib/voice-demo-plumbing-constants";
import type { VoiceDemoCaption } from "@/lib/voice-demo-caption";

type Phase = "gate" | "demo";

export function PlumbingDemoWidget() {
  const [phase, setPhase] = useState<Phase>("gate");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("");
  const [caption, setCaption] = useState<VoiceDemoCaption | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [dailyQuota, setDailyQuota] = useState<{
    used: number;
    limit: number;
    remaining: number;
    allowlisted?: boolean;
  } | null>(null);

  const live = useVoiceDemoLive({
    vertical: "plumbers",
    onUnexpectedClose: () => {
      setStatus(
        "Connection paused — your booking progress is saved. Tap Start voice to continue."
      );
    },
    onConversationEnd: () => {
      setCaption(null);
    },
    onStatus: setStatus,
    onCaption: setCaption,
  });

  useEffect(() => {
    void fetch("/api/voice-demo/status")
      .then((r) => r.json())
      .then(
        (data: {
          configured?: boolean;
          verified?: boolean;
          active?: boolean;
          vertical?: string;
          dailyQuota?: { used: number; limit: number; remaining: number; allowlisted?: boolean };
        }) => {
          setConfigured(data.configured !== false);
          if (data.dailyQuota) setDailyQuota(data.dailyQuota);
          if (data.active && data.verified && data.vertical === "plumbers") {
            setPhase("demo");
          }
        }
      )
      .catch(() => setConfigured(false));
  }, []);

  const startOver = useCallback(async () => {
    live.disconnect();
    setBusy(true);
    setFormError("");
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
      const res = await fetch("/api/voice-demo/plumbing/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const raw = await res.text();
      let data: {
        ok?: boolean;
        error?: string;
        dailyQuota?: { used: number; limit: number; remaining: number };
      } = {};
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        setFormError(
          res.ok
            ? "Unexpected server response. Try again."
            : `Could not start (${res.status}). Try again.`
        );
        return;
      }
      if (!res.ok) {
        if (data.dailyQuota) setDailyQuota(data.dailyQuota);
        setFormError(data.error ?? "Could not start. Try again.");
        return;
      }
      setCaption(null);
      setPhase("demo");
      setStatus("Ready — tap Start voice to call Jarvis.");
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const startVoice = () => {
    if (phase !== "demo") return;
    void live.connect("demo");
  };

  if (configured === null) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-rule bg-bg shadow-lg">
      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
        <div>
          <p className="font-display text-sm font-semibold text-ink">{PLUMBING_DEMO_BUSINESS_NAME}</p>
          <p className="text-xs text-ink-soft">{PLUMBING_DEMO_TAGLINE}</p>
        </div>
        {phase === "demo" && (
          <button
            type="button"
            onClick={() => void startOver()}
            disabled={busy}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-rule-soft hover:text-ink disabled:opacity-60"
          >
            Start over
          </button>
        )}
      </div>

      <div className="px-4 py-5">
        {!configured && (
          <p className="text-center text-sm text-ink-soft">
            Voice demo is not configured on this environment (missing GEMINI_API_KEY).
          </p>
        )}

        {configured && phase === "gate" && (
          <form onSubmit={startDemo} className="space-y-4">
            <p className="text-sm text-ink-soft">
              Enter your email to try Jarvis — Metro Plumbing&apos;s AI receptionist. No verification
              code; jump straight into a voice call about services, pricing, or booking.
            </p>
            <div>
              <label htmlFor="plumbing-demo-email" className="mb-1 block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="plumbing-demo-email"
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
              className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-deep disabled:opacity-60"
            >
              {busy ? "Starting…" : "Start demo"}
            </button>
          </form>
        )}

        {configured && phase === "demo" && (
          <div className="space-y-4">
            {dailyQuota && !dailyQuota.allowlisted && dailyQuota.remaining > 0 && (
              <p className="text-center text-xs text-ink-soft">
                {dailyQuota.remaining} of {dailyQuota.limit} demos left today
              </p>
            )}
            <div className="flex flex-col items-center gap-3 py-2">
              <VoiceJarvisOrb
                levels={live.jarvisLevels}
                speaking={live.jarvisSpeaking}
                connected={live.connected}
                connecting={live.connecting}
              />
              <button
                type="button"
                onClick={startVoice}
                disabled={live.connecting || live.connected}
                aria-label={
                  live.connected
                    ? "Microphone active"
                    : live.connecting
                      ? "Connecting"
                      : "Start voice call"
                }
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition hover:scale-[1.02] disabled:cursor-default disabled:hover:scale-100 ${
                  live.connected
                    ? "border-accent bg-accent-soft"
                    : live.connecting
                      ? "border-accent/60 bg-accent-soft/40"
                      : "border-rule bg-rule-soft hover:border-accent hover:bg-accent-soft/30"
                }`}
              >
                <Mic
                  className={`h-6 w-6 ${
                    live.connected || live.connecting ? "text-accent" : "text-ink-soft"
                  }`}
                />
              </button>
              {!live.connected && !live.connecting && (
                <button
                  type="button"
                  onClick={startVoice}
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-deep"
                >
                  Start voice
                </button>
              )}
              {live.connected && (
                <button
                  type="button"
                  onClick={() => live.toggleMicMute()}
                  aria-pressed={live.micMuted}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    live.micMuted
                      ? "border-warn bg-warn/10 text-warn"
                      : "border-rule bg-bg text-ink-soft hover:border-accent hover:text-ink"
                  }`}
                >
                  {live.micMuted ? (
                    <MicOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Mic className="h-4 w-4" aria-hidden />
                  )}
                  {live.micMuted ? "Unmute mic" : "Mute mic"}
                </button>
              )}
            </div>
            {status && <p className="text-center text-sm text-ink-soft">{status}</p>}
            {(live.error || formError) && (
              <div className="space-y-2 text-center">
                <p className="text-sm text-warn">{live.error || formError}</p>
                {live.error && (
                  <button
                    type="button"
                    onClick={startVoice}
                    className="rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink transition hover:bg-rule-soft"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
            {!live.connected && !live.connecting && !live.error && !status && (
              <p className="text-center text-sm text-ink-soft">
                Ask about water heaters, drain cleaning, emergencies, or book an appointment.
              </p>
            )}
          </div>
        )}
      </div>

      {caption?.role === "user" && configured && phase === "demo" && (
        <VoiceCaptionBar caption={caption} />
      )}
    </div>
  );
}
