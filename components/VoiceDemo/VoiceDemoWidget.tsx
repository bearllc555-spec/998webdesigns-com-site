"use client";

import { useCallback, useEffect, useState } from "react";
import { Mic, X, MessageCircle } from "lucide-react";
import { useVoiceDemoLive } from "@/hooks/use-voice-demo-live";
import { VoiceCaptionBar } from "@/components/VoiceDemo/VoiceCaptionBar";
import { VoiceJarvisOrb } from "@/components/VoiceDemo/VoiceJarvisOrb";
import { FIXED_INPUT_CLASS } from "@/components/form-field-stack";
import type { VoiceDemoCaption } from "@/lib/voice-demo-caption";

type Phase = "closed" | "gate" | "verify" | "demo";

export function VoiceDemoWidget() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("closed");
  const [email, setEmail] = useState("");
  const [destination, setDestination] = useState("");
  const [typedCode, setTypedCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("");
  const [caption, setCaption] = useState<VoiceDemoCaption | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [website, setWebsite] = useState("");

  const live = useVoiceDemoLive({
    onPhaseTransition: (transition) => {
      if (transition.kind === "verified") {
        setPhase("demo");
        setStatus("Verified — ask Jarvis anything about 998.");
      }
    },
    onUnexpectedClose: () => {
      setStatus("Session paused — tap Start voice to continue.");
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
      .then((data: { configured?: boolean; verified?: boolean; active?: boolean }) => {
        setConfigured(data.configured !== false);
      })
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/voice-demo/status")
      .then((r) => r.json())
      .then((data: { verified?: boolean; active?: boolean; destination?: string }) => {
        if (data.active && data.verified) {
          setPhase("demo");
        } else if (data.active) {
          setPhase("verify");
          if (data.destination) setDestination(data.destination);
        } else {
          setPhase("gate");
        }
      })
      .catch(() => {});
  }, [open]);

  const close = useCallback(() => {
    live.disconnect();
    setOpen(false);
    setPhase("closed");
    setFormError("");
    setStatus("");
    setCaption(null);
  }, [live]);

  const openWidget = () => {
    setOpen(true);
    setFormError("");
  };

  const startOver = useCallback(async () => {
    live.disconnect();
    setBusy(true);
    setFormError("");
    try {
      await fetch("/api/voice-demo/reset", { method: "POST" });
    } catch {
      /* still reset local state */
    } finally {
      setPhase("gate");
      setEmail("");
      setDestination("");
      setTypedCode("");
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
      const res = await fetch("/api/voice-demo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          email,
          website,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        destination?: string;
        error?: string;
      };
      if (!res.ok) {
        setFormError(data.error ?? "Could not start. Try again.");
        return;
      }
      setDestination(data.destination ?? email);
      setCaption(null);
      setPhase("verify");
      setStatus("Check your email for a 6-digit code, then tap Start voice.");
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitTypedCode(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      const res = await fetch("/api/voice-demo/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: typedCode }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Invalid code.");
        return;
      }
      setTypedCode("");
      setStatus("Verified — tap Start voice to talk with Jarvis.");
      void live.transitionToDemo();
    } catch {
      setFormError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const startVoice = () => {
    const mode = phase === "demo" ? "demo" : "verify";
    void live.connect(mode);
  };

  if (configured === null) {
    return null;
  }

  return (
    <>
      {!open && configured && (
        <button
          type="button"
          onClick={openWidget}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-rule bg-bg px-4 py-3 text-sm font-medium text-ink shadow-lg transition hover:bg-rule-soft md:bottom-6 md:right-6"
          aria-label="Talk to Jarvis"
        >
          <Mic className="h-4 w-4 text-accent" aria-hidden />
          Talk to Jarvis
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 p-4 md:items-center"
          role="dialog"
          aria-label="Voice assistant"
          onClick={close}
        >
          <div
            className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-rule bg-bg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex select-none items-center justify-between border-b border-rule px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-accent" aria-hidden />
                <span className="font-display text-sm font-medium text-ink">Jarvis</span>
              </div>
              <div className="flex items-center gap-1">
                {configured && phase !== "gate" && (
                  <button
                    type="button"
                    onClick={() => void startOver()}
                    disabled={busy}
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-rule-soft hover:text-ink disabled:opacity-60"
                  >
                    Start over
                  </button>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-1.5 text-ink-soft transition hover:bg-rule-soft hover:text-ink"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!configured && (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-ink-soft">
                    Voice assistant is not configured on this environment yet (missing GEMINI_API_KEY).
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink hover:bg-rule-soft"
                  >
                    Close
                  </button>
                </div>
              )}

              {configured && phase === "gate" && (
                <form onSubmit={startDemo} className="space-y-4">
                  <p className="text-sm text-ink-soft">
                    Enter your email to try Jarvis. We&apos;ll send a verification code, then chat
                    about 998 — Jarvis will ask your name and phone to build your profile.
                  </p>

                  <div>
                    <label htmlFor="vd-email" className="mb-1 block text-sm font-medium text-ink">
                      Email
                    </label>
                    <input
                      id="vd-email"
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
                    {busy ? "Sending code…" : "Send code & start"}
                  </button>
                </form>
              )}

              {configured && (phase === "verify" || phase === "demo") && (
                <div className="space-y-4">
                  {destination && phase === "verify" && (
                    <p className="text-sm text-ink-soft">
                      Code sent to <strong className="text-ink">{destination}</strong>. Read it to
                      Jarvis or type it below.
                    </p>
                  )}

                  <div className="flex flex-col items-center gap-3 py-4">
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
                            ? "Connecting voice assistant"
                            : "Start voice assistant"
                      }
                      className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 transition hover:scale-[1.02] disabled:cursor-default disabled:hover:scale-100 ${
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

                  {phase === "demo" && !live.connected && !live.connecting && !live.error && !status && (
                    <p className="text-center text-sm text-ink-soft">
                      Tap Start voice to talk with Jarvis.
                    </p>
                  )}

                  {phase === "verify" && (
                    <form onSubmit={submitTypedCode} className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="6-digit code"
                        value={typedCode}
                        onChange={(e) => setTypedCode(e.target.value)}
                        className={`${FIXED_INPUT_CLASS} flex-1`}
                        maxLength={8}
                      />
                      <button
                        type="submit"
                        disabled={busy || !typedCode.trim()}
                        className="rounded-lg border border-rule px-3 py-2 text-sm font-medium text-ink transition hover:bg-rule-soft disabled:opacity-60"
                      >
                        Verify
                      </button>
                    </form>
                  )}

                </div>
              )}
            </div>

            {caption?.role === "user" && configured && (phase === "verify" || phase === "demo") && (
              <VoiceCaptionBar caption={caption} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
