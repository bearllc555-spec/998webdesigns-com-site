"use client";

import { useCallback, useEffect, useState } from "react";
import { Mic, X, MessageCircle } from "lucide-react";
import { useVoiceDemoLive } from "@/hooks/use-voice-demo-live";
import { FIXED_INPUT_CLASS } from "@/components/form-field-stack";

type Phase = "closed" | "gate" | "confirm_email" | "verify" | "demo";

type Channel = "email" | "sms";

export function VoiceDemoWidget() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("closed");
  const [channel, setChannel] = useState<Channel>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [destination, setDestination] = useState("");
  const [typedCode, setTypedCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [website, setWebsite] = useState("");

  const live = useVoiceDemoLive({
    onPhaseTransition: (transition) => {
      if (transition.kind === "email_confirmed") {
        setDestination(transition.destination);
        setPhase("verify");
        setStatus("Code sent — Jarvis will ask for your 6-digit code.");
      } else {
        setPhase("demo");
        setStatus("Verified — ask Jarvis anything about 998.");
      }
    },
    onUnexpectedClose: () => {
      setStatus("Session paused — tap Start voice to continue.");
    },
    onStatus: setStatus,
    onTranscript: (line) => setTranscript((prev) => [...prev.slice(-12), line]),
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
      .then((data: { verified?: boolean; active?: boolean; pendingEmail?: boolean; destination?: string }) => {
        if (data.active && data.verified) {
          setPhase("demo");
        } else if (data.active && data.pendingEmail) {
          setDestination(data.destination ?? "");
          setPhase("confirm_email");
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
    setTranscript([]);
  }, [live]);

  const openWidget = () => {
    setOpen(true);
    setPhase("gate");
    setFormError("");
  };

  async function startDemo(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      const endpoint = channel === "email" ? "/api/voice-demo/pending-email" : "/api/voice-demo/start";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          email: channel === "email" ? email : undefined,
          phone: channel === "sms" ? phone : undefined,
          smsConsent: channel === "sms" ? smsConsent : undefined,
          website,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        destination?: string;
        email?: string;
        error?: string;
      };
      if (!res.ok) {
        setFormError(data.error ?? "Could not start. Try again.");
        return;
      }
      setDestination(data.destination ?? data.email ?? email);
      setTranscript([]);
      if (channel === "email") {
        setPhase("confirm_email");
        setStatus("Tap Start voice — J.A.R.V.I.S. will spell your email back for confirmation.");
      } else {
        setPhase("verify");
        setStatus("Code sent — tap Start voice to connect your microphone.");
      }
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
      void live.transitionToDemo();
    } catch {
      setFormError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const startVoice = () => {
    const mode =
      phase === "demo" ? "demo" : phase === "confirm_email" ? "confirm_email" : "verify";
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
          aria-label="Talk to AI assistant"
        >
          <Mic className="h-4 w-4 text-accent" aria-hidden />
          Talk to J.A.R.V.I.S.
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
                <span className="font-display text-sm font-medium text-ink">J.A.R.V.I.S.</span>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-ink-soft transition hover:bg-rule-soft hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
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
                    Verify with email or phone to try J.A.R.V.I.S. Email sign-in spells your address
                    back for confirmation before we send a code.
                  </p>

                  <div className="flex gap-2">
                    {(["email", "sms"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setChannel(c)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          channel === c
                            ? "border-accent bg-accent-soft text-ink"
                            : "border-rule text-ink-soft hover:bg-rule-soft"
                        }`}
                      >
                        {c === "email" ? "Email" : "Phone"}
                      </button>
                    ))}
                  </div>

                  {channel === "email" ? (
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
                  ) : (
                    <>
                      <div>
                        <label htmlFor="vd-phone" className="mb-1 block text-sm font-medium text-ink">
                          Phone
                        </label>
                        <input
                          id="vd-phone"
                          type="tel"
                          required
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={FIXED_INPUT_CLASS}
                        />
                      </div>
                      <label className="flex items-start gap-2 text-xs text-ink-soft">
                        <input
                          type="checkbox"
                          checked={smsConsent}
                          onChange={(e) => setSmsConsent(e.target.checked)}
                          className="mt-0.5"
                        />
                        I agree to receive a one-time SMS verification code from 998 web designs.
                      </label>
                    </>
                  )}

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
                    disabled={busy || (channel === "sms" && !smsConsent)}
                    className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-deep disabled:opacity-60"
                  >
                    {busy
                      ? channel === "email"
                        ? "Continuing…"
                        : "Sending code…"
                      : channel === "email"
                        ? "Continue"
                        : "Send code & start"}
                  </button>
                </form>
              )}

              {configured && (phase === "confirm_email" || phase === "verify" || phase === "demo") && (
                <div className="space-y-4">
                  {destination && phase === "confirm_email" && (
                    <p className="text-sm text-ink-soft">
                      Confirming <strong className="text-ink">{destination}</strong> — J.A.R.V.I.S.
                      will spell it back before sending your code.
                    </p>
                  )}

                  {destination && phase === "verify" && (
                    <p className="text-sm text-ink-soft">
                      Code sent to <strong className="text-ink">{destination}</strong>. Read it to
                      J.A.R.V.I.S. or type it below.
                    </p>
                  )}

                  <div className="flex flex-col items-center gap-3 py-4">
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
                      className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-2 transition hover:scale-[1.02] disabled:cursor-default disabled:hover:scale-100 ${
                        live.connected
                          ? "border-accent bg-accent-soft animate-pulse"
                          : live.connecting
                            ? "border-accent/60 bg-accent-soft/40"
                            : "border-rule bg-rule-soft hover:border-accent hover:bg-accent-soft/30"
                      }`}
                    >
                      <Mic
                        className={`h-8 w-8 ${
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
                      Tap Start voice to talk with the assistant.
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

                  {transcript.length > 0 && (
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-rule bg-rule-soft/50 p-3 text-xs text-ink-soft">
                      {transcript.map((line, i) => (
                        <p key={`${i}-${line.slice(0, 12)}`}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
