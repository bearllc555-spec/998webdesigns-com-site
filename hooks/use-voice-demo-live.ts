"use client";

import { useCallback, useRef, useState } from "react";
import { GoogleGenAI } from "@google/genai";
import {
  requestVoiceDemoMicStream,
  startVoiceDemoMic,
  VoiceDemoAudioPlayer,
  type VoiceDemoMicHandle,
} from "@/lib/voice-demo-audio-client";
import {
  VOICE_DEMO_CALL_IDLE_HANGUP_MS,
  VOICE_DEMO_END_CALL_BLINK_DELAY_MS,
  VOICE_DEMO_LIVE_MODEL,
  VOICE_DEMO_POST_FAREWELL_ACK_MS,
  VOICE_DEMO_POST_FAREWELL_IDLE_MS,
} from "@/lib/voice-demo-constants";
import {
  mergeTranscriptChunk,
  type VoiceDemoCaption,
  type VoiceDemoCaptionRole,
} from "@/lib/voice-demo-caption";
import {
  JARVIS_AUDIO_IDLE,
  readJarvisAudioLevels,
  smoothJarvisAudioLevels,
  type JarvisAudioLevels,
} from "@/lib/voice-demo-jarvis-audio-level";
import {
  buildFarewellHoldNudge,
  isAssistantFarewell,
  isUserExplicitlyDone,
  isVisitorFarewellAck,
  shouldClientScheduleFarewellHangup,
} from "@/lib/voice-demo-farewell";
import {
  createVoiceDemoNudgeQueue,
  flushVoiceDemoClientNudgeQueue,
  sendVoiceDemoClientNudge,
  type VoiceDemoClientNudgeOpts,
} from "@/lib/voice-demo-client-nudge";
import {
  deriveVoiceDemoSessionPhase,
  type VoiceDemoHangupReason,
  type VoiceDemoSessionPhase,
} from "@/lib/voice-demo-phase";
import {
  buildVoiceDemoToolResponse,
  type VoiceDemoToolResponseEntry,
} from "@/lib/voice-demo-tool-response";
import {
  buildPostNameGreetingNudge,
  buildPostNameHelpOnlyNudge,
  buildPostNameHoldNudge,
  buildSaveNameToolMessage,
  buildSessionResumeNudge,
  isAssistantNameSalutation,
  isAssistantPartialPostNameGreeting,
  isAssistantPostNameGreeting,
  POST_NAME_GREETING_NUDGE_MS,
  triggerVoiceDemoOpening,
  voiceDemoOpeningStatus,
} from "@/lib/voice-demo-greeting";
import {
  aestheticsDemoOpeningStatus,
  triggerAestheticsDemoOpening,
} from "@/lib/voice-demo-aesthetics/greeting";
import {
  plumbingDemoOpeningStatus,
  triggerPlumbingDemoOpening,
} from "@/lib/voice-demo-plumbing-greeting";
import { buildPlumbingSessionResumeNudge } from "@/lib/voice-demo-plumbing-resume";
import {
  assistantChainedSchedulingAfterPhone,
  buildPlumbingContactPauseNudge,
  buildPlumbingPhoneSchedulingRecoveryNudge,
  plumbingContactPostReadbackPauseMs,
  userAnsweredPlumbingContactPause,
  type PlumbingContactField,
} from "@/lib/voice-demo-plumbing-contact-confirm";
import {
  buildPlumbingExitConcernsNudge,
  buildPlumbingFinalGoodbyeNudge,
  isPlumbingAssistantFarewell,
  PLUMBING_GOODBYE_BEAT_MS,
} from "@/lib/voice-demo-plumbing-goodbye";
import {
  buildPlumbingPostOpeningListenNudge,
  isPlumbingOpeningLine,
  PLUMBING_POST_OPENING_IDLE_MS,
} from "@/lib/voice-demo-plumbing-opening";
import {
  buildPlumbingMidCallSilenceNudge,
  PLUMBING_MID_CALL_NUDGE_COOLDOWN_MS,
  PLUMBING_MID_CALL_SILENCE_MS,
  PLUMBING_SUPPRESS_AUDIO_RECOVERY_MS,
} from "@/lib/voice-demo-plumbing-mid-call-silence";
import {
  isPlumbingBookingContinuation,
  isPlumbingVisitorConfirmedConcerns,
  isPlumbingVisitorDeclinedConcerns,
  isPlumbingVisitorEndingCall,
  shouldPlumbingClientHangup,
} from "@/lib/voice-demo-plumbing-session";
import {
  aestheticsBrandFromVertical,
  isAestheticsVertical,
  isPlumbingVertical,
  type VoiceDemoVertical,
} from "@/lib/voice-demo-vertical";
import {
  buildPhonePauseNudge,
  PHONE_SILENCE_NUDGE_MS,
} from "@/lib/voice-demo-phone-nudge";
import {
  buildWrapUpCueLeakRecoveryNudge,
  buildWrapUpPauseNudge,
  isAssistantHiddenCueLeak,
  isAssistantWrapUpQuestion,
  isUserSmallTalk,
  isUserSubstantiveQuestion,
  shouldScheduleWrapUpAfterAnswer,
  VOICE_DEMO_WRAPUP_QUESTIONS,
  WRAPUP_POST_ANSWER_PAUSE_MS,
} from "@/lib/voice-demo-wrapup-nudge";
import { seedOnboardingFromFullName } from "@/lib/voice-demo-flow-policy";
import {
  buildPromoOfferSplitNudge,
  isAssistantPromoOffer,
  isAssistantPromoOfferBundledWithGoodbye,
  isUserPromoDecline,
} from "@/lib/voice-demo-promo-offer";
import { logVoiceDemoOps } from "@/lib/voice-demo-ops-client";
import {
  canSendVoiceDemoRealtimeInput,
  isUrgentLiveReconnectReason,
  shouldDeferLiveReconnect,
} from "@/lib/voice-demo-live-reconnect-policy";
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
  goAway?: { timeLeft?: string };
  sessionResumptionUpdate?: {
    newHandle?: string;
    resumable?: boolean;
  };
};

type ConnectOptions = {
  resume?: boolean;
  /** User tapped Start voice - clears reconnect pause and gives one fresh try. */
  userInitiated?: boolean;
};

export type VoiceDemoPhaseTransition = { kind: "verified"; nextMode: "demo" };

type UseVoiceDemoLiveOptions = {
  vertical?: VoiceDemoVertical;
  onPhaseTransition?: (transition: VoiceDemoPhaseTransition) => void;
  onUnexpectedClose?: () => void;
  onConversationEnd?: () => void;
  onStatus?: (text: string) => void;
  onCaption?: (caption: VoiceDemoCaption) => void;
};

const PHASE_TAIL_MS = 450;
const RECONNECT_DELAY_MS = 700;
const PHASE_FALLBACK_MS = 12000;
/** Wait for long FAQ answers to finish before farewell disconnect. */
const FAREWELL_PLAYBACK_MAX_WAIT_MS = 120_000;
const PHASE_MIN_SPOKEN_MS = 1800;
const MAX_RECONNECT_ATTEMPTS = 2;
const PLUMBING_MAX_RECONNECT_ATTEMPTS = 4;
const URGENT_RECONNECT_DELAY_MS = 250;
const RECONNECT_DEBOUNCE_MS = 900;
/** Throttle session_resumption ops - Gemini can rotate handles many times per second. */
const RESUMPTION_OPS_MIN_INTERVAL_MS = 10_000;
const MAX_CONNECT_IN_FLIGHT_WAITS = 5;
const RESUME_NUDGE_COOLDOWN_MS = 45_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function liveReconnectDelayMs(
  vertical: VoiceDemoVertical,
  attempt: number,
  urgent: boolean
): number {
  if (urgent) return URGENT_RECONNECT_DELAY_MS;
  if (vertical !== "plumbers") return RECONNECT_DELAY_MS;
  return Math.min(350 * 2 ** Math.min(attempt, 4), 5000);
}

export function useVoiceDemoLive(options: UseVoiceDemoLiveOptions = {}) {
  const verticalRef = useRef<VoiceDemoVertical>(options.vertical ?? "marketing");
  const isPlumbingDemo = isPlumbingVertical(verticalRef.current);
  const isAestheticsDemo = isAestheticsVertical(verticalRef.current);

  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [jarvisLevels, setJarvisLevels] = useState<JarvisAudioLevels>(JARVIS_AUDIO_IDLE);
  const [jarvisSpeaking, setJarvisSpeaking] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [endCallGlow, setEndCallGlow] = useState(false);

  const sessionRef = useRef<Session | null>(null);
  const micRef = useRef<VoiceDemoMicHandle | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const playerRef = useRef<VoiceDemoAudioPlayer | null>(null);
  const modeRef = useRef<VoiceDemoLiveMode>("verify");
  const intentionalDisconnectRef = useRef(false);
  const pendingPhaseRef = useRef<VoiceDemoPhaseTransition | null>(null);
  const pendingSinceRef = useRef<number | null>(null);
  const pendingFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitingPhoneDigitsRef = useRef(false);
  const awaitingPhoneConfirmRef = useRef(false);
  const phoneNudgeTranscriptRef = useRef("");
  const wrapUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visitorAskedSubstantiveQuestionRef = useRef(false);
  const finishingPhaseRef = useRef(false);
  const jarvisFarewellSentRef = useRef(false);
  const goodbyeNudgeSentRef = useRef(false);
  const farewellHoldSentRef = useRef(false);
  const farewellDisconnectingRef = useRef(false);
  const pendingClientHangupRef = useRef(false);
  const hangupReasonRef = useRef<VoiceDemoHangupReason | null>(null);
  const callIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postFarewellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callWindingDownRef = useRef(false);
  const awaitingPromoConsentRef = useRef(false);
  const plumbingExitConcernsAskedRef = useRef(false);
  const plumbingAwaitingConcernsAnswerRef = useRef(false);
  const plumbingGoodbyeBeatUntilRef = useRef(0);
  const plumbingGoodbyeNudgeSentRef = useRef(false);
  const plumbingGoodbyeAudioQueueRef = useRef<string[]>([]);
  const plumbingGoodbyeAudioFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plumbingGoodbyeNudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plumbingOpeningCompleteRef = useRef(false);
  const plumbingUserSpokeSinceOpeningRef = useRef(false);
  const plumbingPostOpeningNudgeSentRef = useRef(false);
  const plumbingPostOpeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plumbingMidCallSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plumbingMidCallNudgeLastAtRef = useRef(0);
  const suppressAudioRecoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumptionHandleCountRef = useRef(0);
  const lastResumptionOpsAtRef = useRef(0);
  const plumbingContactPauseFieldRef = useRef<PlumbingContactField | null>(null);
  const schedulePostFarewellHangupRef = useRef<(delayMs?: number) => void>(() => {});
  const endCallGlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endCallBlinkArmedRef = useRef(false);
  const postFarewellDeadlineRef = useRef(0);
  const postFarewellIdleMsRef = useRef(VOICE_DEMO_POST_FAREWELL_IDLE_MS);
  const lastAssistantTextRef = useRef("");
  const wrapUpQuestionIndexRef = useRef(0);
  const wrapUpCueLeakRecoverySentRef = useRef(false);
  const captionRoleRef = useRef<VoiceDemoCaptionRole | null>(null);
  const captionTextRef = useRef("");
  const sessionTranscriptRef = useRef<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const greetingSentRef = useRef(false);
  const nameSavedRef = useRef(false);
  const savedNameRef = useRef("");
  const postNameLineSpokenRef = useRef(false);
  const postNameSalutationSpokenRef = useRef(false);
  const postNameHoldSentRef = useRef(false);
  const postNameGreetingNudgeSentRef = useRef(false);
  const postNameGreetingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assistantTurnInterruptedRef = useRef(false);
  const visitorExplicitlyDoneRef = useRef(false);
  const sessionResumptionHandleRef = useRef<string | null>(null);
  const sessionResumableRef = useRef(true);
  const hadPlumbingLiveSessionRef = useRef(false);
  const reconnectPausedRef = useRef(false);
  const reconnectExhaustedBonusRef = useRef(false);
  const connectInFlightWaitsRef = useRef(0);
  const lastReconnectRequestAtRef = useRef(0);
  const lastResumeNudgeAtRef = useRef(0);
  const handleMessageChainRef = useRef(Promise.resolve());
  const toolInFlightRef = useRef(0);
  const pendingToolResponsesRef = useRef<VoiceDemoToolResponseEntry[] | null>(null);
  const pendingReconnectRef = useRef<{
    reason: string;
    meta?: Record<string, unknown>;
  } | null>(null);
  const connectedAtRef = useRef(0);
  const reconnectAttemptRef = useRef(0);
  const reconnectingRef = useRef(false);
  const reconnectScheduledRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressAssistantAudioRef = useRef(false);
  const clientNudgeQueueRef = useRef(createVoiceDemoNudgeQueue());
  const jarvisLevelsRef = useRef(JARVIS_AUDIO_IDLE);
  const orbFrameRef = useRef<number | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const stopOrbLoop = useCallback(() => {
    if (orbFrameRef.current !== null) {
      cancelAnimationFrame(orbFrameRef.current);
      orbFrameRef.current = null;
    }
    jarvisLevelsRef.current = JARVIS_AUDIO_IDLE;
    setJarvisLevels(JARVIS_AUDIO_IDLE);
    setJarvisSpeaking(false);
  }, []);

  const startOrbLoop = useCallback(() => {
    stopOrbLoop();
    const tick = () => {
      const player = playerRef.current;
      const analyserPack = player?.getAnalyser();
      const playing = player?.isPlaying() ?? false;

      if (analyserPack && playing) {
        const raw = readJarvisAudioLevels(analyserPack.analyser, analyserPack.freqBuf);
        const smoothed = smoothJarvisAudioLevels(jarvisLevelsRef.current, raw);
        jarvisLevelsRef.current = smoothed;
        setJarvisLevels(smoothed);
        setJarvisSpeaking(smoothed.volume > 0.04 || playing);
      } else {
        const smoothed = smoothJarvisAudioLevels(jarvisLevelsRef.current, JARVIS_AUDIO_IDLE);
        jarvisLevelsRef.current = smoothed;
        setJarvisLevels(smoothed);
        setJarvisSpeaking(false);
      }

      orbFrameRef.current = requestAnimationFrame(tick);
    };
    orbFrameRef.current = requestAnimationFrame(tick);
  }, [stopOrbLoop]);

  const sendOpeningGreeting = useCallback((session: Session) => {
    if (greetingSentRef.current) return;
    greetingSentRef.current = true;
    try {
      if (isPlumbingDemo) {
        triggerPlumbingDemoOpening(session);
      } else if (isAestheticsDemo) {
        const brand = aestheticsBrandFromVertical(verticalRef.current);
        if (brand) triggerAestheticsDemoOpening(brand, session);
      } else {
        triggerVoiceDemoOpening(session);
      }
    } catch (err) {
      console.warn("[voice-demo-live] opening trigger", err);
      greetingSentRef.current = false;
    }
  }, [isAestheticsDemo, isPlumbingDemo]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectScheduledRef.current = false;
  }, []);

  const getSessionPhase = useCallback((): VoiceDemoSessionPhase => {
    return deriveVoiceDemoSessionPhase({
      postNameLineSpoken: postNameLineSpokenRef.current,
      jarvisFarewellSent: jarvisFarewellSentRef.current,
      goodbyeNudgeSent: goodbyeNudgeSentRef.current,
      wrapUpTimerActive: wrapUpTimerRef.current !== null,
      farewellDisconnecting: farewellDisconnectingRef.current,
      visitorExplicitlyDone: visitorExplicitlyDoneRef.current,
    });
  }, []);

  const maxReconnectAttempts = useCallback(
    () => (verticalRef.current === "plumbers" ? PLUMBING_MAX_RECONNECT_ATTEMPTS : MAX_RECONNECT_ATTEMPTS),
    []
  );

  const pauseAutoReconnect = useCallback(
    (reason: string) => {
      reconnectPausedRef.current = true;
      reconnectingRef.current = false;
      clearReconnectTimer();
      setConnecting(false);
      setConnected(false);
      stopOrbLoop();
      hangupReasonRef.current = "reconnect_exhausted";
      logVoiceDemoOps({
        kind: "client_hangup_scheduled",
        message: "Live reconnect paused - waiting for user tap",
        severity: "warn",
        meta: { phase: getSessionPhase(), hangupReason: "reconnect_exhausted", reason },
      });
      optionsRef.current.onUnexpectedClose?.();
    },
    [clearReconnectTimer, getSessionPhase, stopOrbLoop]
  );

  const scheduleLiveReconnect = useCallback(
    (reason: string, meta?: Record<string, unknown>, opts?: { urgent?: boolean }) => {
      const urgent = opts?.urgent === true || isUrgentLiveReconnectReason(reason);
      if (farewellDisconnectingRef.current || finishingPhaseRef.current) return;
      if (reconnectPausedRef.current) return;
      if (reconnectAttemptRef.current >= maxReconnectAttempts()) {
        pauseAutoReconnect(reason);
        return;
      }
      if (reconnectScheduledRef.current) return;
      reconnectScheduledRef.current = true;
      setConnecting(true);
      optionsRef.current.onStatus?.("Connection refreshing - one moment…");
      logVoiceDemoOps({
        kind: "session_anomaly",
        message: `Scheduling live reconnect: ${reason}`,
        severity: "warn",
        meta: {
          attempt: reconnectAttemptRef.current,
          hasHandle: Boolean(sessionResumptionHandleRef.current),
          ...meta,
        },
      });
      const delayMs = liveReconnectDelayMs(
        verticalRef.current,
        reconnectAttemptRef.current,
        urgent
      );
      reconnectTimerRef.current = setTimeout(() => {
        reconnectScheduledRef.current = false;
        reconnectTimerRef.current = null;
        if (reconnectAttemptRef.current >= maxReconnectAttempts()) return;
        if (reconnectingRef.current) {
          connectInFlightWaitsRef.current += 1;
          if (connectInFlightWaitsRef.current >= MAX_CONNECT_IN_FLIGHT_WAITS) {
            connectInFlightWaitsRef.current = 0;
            reconnectAttemptRef.current += 1;
          }
          scheduleLiveReconnect("connect_in_flight", meta);
          return;
        }
        connectInFlightWaitsRef.current = 0;
        reconnectAttemptRef.current += 1;
        void connectRef.current(modeRef.current, { resume: true });
      }, delayMs);
    },
    [getSessionPhase, maxReconnectAttempts, pauseAutoReconnect]
  );

  const flushPendingReconnect = useCallback(() => {
    const pending = pendingReconnectRef.current;
    if (!pending || farewellDisconnectingRef.current) return;
    const defer = shouldDeferLiveReconnect({
      reason: pending.reason,
      toolInFlight: toolInFlightRef.current,
      sessionResumable: sessionResumableRef.current,
    });
    if (defer.defer) return;
    pendingReconnectRef.current = null;
    setConnecting(true);
    optionsRef.current.onStatus?.("Connection refreshing - one moment…");
    scheduleLiveReconnect(pending.reason, pending.meta);
  }, [scheduleLiveReconnect]);

  const requestLiveReconnect = useCallback(
    (reason: string, meta?: Record<string, unknown>) => {
      if (farewellDisconnectingRef.current || finishingPhaseRef.current) return;
      if (reconnectPausedRef.current) return;
      const now = Date.now();
      if (now - lastReconnectRequestAtRef.current < RECONNECT_DEBOUNCE_MS) return;
      lastReconnectRequestAtRef.current = now;
      const defer = shouldDeferLiveReconnect({
        reason,
        toolInFlight: toolInFlightRef.current,
        sessionResumable: sessionResumableRef.current,
      });
      if (defer.defer) {
        pendingReconnectRef.current = { reason, meta };
        logVoiceDemoOps({
          kind: "session_anomaly",
          message:
            defer.cause === "tool"
              ? `Deferred live reconnect until tool completes: ${reason}`
              : `Deferred live reconnect until session resumable: ${reason}`,
          severity: "warn",
          meta: {
            ...meta,
            toolInFlight: toolInFlightRef.current,
            resumable: sessionResumableRef.current,
          },
        });
        return;
      }
      setConnecting(true);
      optionsRef.current.onStatus?.("Connection refreshing - one moment…");
      const urgent = isUrgentLiveReconnectReason(reason);
      scheduleLiveReconnect(reason, meta, { urgent });
    },
    [scheduleLiveReconnect]
  );

  const clearPostNameGreetingTimer = useCallback(() => {
    if (postNameGreetingTimerRef.current) {
      clearTimeout(postNameGreetingTimerRef.current);
      postNameGreetingTimerRef.current = null;
    }
  }, []);

  const sendPostNameGreetingNudge = useCallback(() => {
    const session = sessionRef.current;
    const name = savedNameRef.current.trim();
    if (
      !session ||
      !name ||
      !nameSavedRef.current ||
      postNameLineSpokenRef.current ||
      postNameHoldSentRef.current ||
      postNameGreetingNudgeSentRef.current
    ) {
      return;
    }
    if (playerRef.current?.isPlaying()) {
      clearPostNameGreetingTimer();
      postNameGreetingTimerRef.current = setTimeout(() => {
        postNameGreetingTimerRef.current = null;
        sendPostNameGreetingNudge();
      }, POST_NAME_GREETING_NUDGE_MS);
      return;
    }
    postNameGreetingNudgeSentRef.current = true;
    const helpOnly = postNameSalutationSpokenRef.current;
    logVoiceDemoOps({
      kind: "session_anomaly",
      message: helpOnly
        ? "Post-name help-only nudge - salutation spoken without help line"
        : "Post-name greeting nudge - model idle after save_name",
      severity: "warn",
      meta: { name, helpOnly },
    });
    try {
      void sendClientNudge(helpOnly ? buildPostNameHelpOnlyNudge() : buildPostNameGreetingNudge(name));
    } catch (err) {
      console.warn("[voice-demo-live] post-name greeting nudge", err);
      postNameGreetingNudgeSentRef.current = false;
    }
  }, [clearPostNameGreetingTimer]);

  const schedulePostNameGreetingNudge = useCallback(() => {
    if (
      modeRef.current !== "demo" ||
      !nameSavedRef.current ||
      postNameLineSpokenRef.current ||
      postNameGreetingNudgeSentRef.current
    ) {
      return;
    }
    clearPostNameGreetingTimer();
    postNameGreetingTimerRef.current = setTimeout(() => {
      postNameGreetingTimerRef.current = null;
      if (playerRef.current?.isPlaying()) {
        void playerRef.current.whenPlaybackIdle(10000).then(() => {
          sendPostNameGreetingNudge();
        });
        return;
      }
      sendPostNameGreetingNudge();
    }, POST_NAME_GREETING_NUDGE_MS);
  }, [clearPostNameGreetingTimer, sendPostNameGreetingNudge]);

  const sendPostNameHoldNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || postNameHoldSentRef.current) return;
    postNameHoldSentRef.current = true;
    logVoiceDemoOps({
      kind: "session_anomaly",
      message: "Blocked duplicate post-name greeting",
      severity: "warn",
    });
    try {
      void sendClientNudge(buildPostNameHoldNudge());
    } catch (err) {
      console.warn("[voice-demo-live] post-name hold nudge", err);
      postNameHoldSentRef.current = false;
    }
  }, []);

  const sendSessionResumeNudge = useCallback(
    (
      session: Session,
      plumbingJob?: {
        status?: string;
        serviceType?: string | null;
        serviceAddress?: string | null;
        customerEmail?: string | null;
        appointmentDate?: string | null;
        timeWindow?: string | null;
      } | null,
      nameOnFile?: string
    ) => {
      const turns =
        verticalRef.current === "plumbers"
          ? buildPlumbingSessionResumeNudge({
              nameOnFile: nameOnFile || savedNameRef.current || undefined,
              job: plumbingJob ?? null,
            })
          : buildSessionResumeNudge({
              nameOnFile: savedNameRef.current || undefined,
              nameSavedThisSession: postNameLineSpokenRef.current,
            });
      void sendVoiceDemoClientNudge(session, playerRef.current, turns).catch((err) => {
        console.warn("[voice-demo-live] session resume nudge", err);
      });
    },
    []
  );

  const flushPendingToolResponses = useCallback((session: Session) => {
    const pending = pendingToolResponsesRef.current;
    if (!pending?.length) return;
    try {
      session.sendToolResponse({ functionResponses: pending });
      pendingToolResponsesRef.current = null;
      logVoiceDemoOps({
        kind: "session_anomaly",
        message: "Flushed deferred tool responses after reconnect",
        meta: { count: pending.length },
      });
    } catch (err) {
      console.warn("[voice-demo-live] flush pending tool responses", err);
    }
  }, []);

  const visitorFirstName = useCallback(() => {
    const name = savedNameRef.current.trim();
    return name ? (name.split(/\s+/)[0] ?? name) : "";
  }, []);

  const noteAssistantPostNameProgress = useCallback(
    (text: string) => {
      if (modeRef.current !== "demo" || !nameSavedRef.current) return;
      const first = visitorFirstName();
      if (first && isAssistantNameSalutation(text, first)) {
        postNameSalutationSpokenRef.current = true;
      }
      if (isAssistantPostNameGreeting(text)) {
        clearPostNameGreetingTimer();
      }
    },
    [clearPostNameGreetingTimer, visitorFirstName]
  );

  const finishPostNameGreetingTurn = useCallback(
    (assistantSnapshot: string, hadPostNameAtTurnStart: boolean, wasInterrupted: boolean) => {
      if (modeRef.current !== "demo") return;
      const first = visitorFirstName();

      if (isAssistantPostNameGreeting(assistantSnapshot)) {
        if (hadPostNameAtTurnStart && !wasInterrupted) {
          playerRef.current?.hardStop();
          sendPostNameHoldNudge();
          return;
        }
        if (!hadPostNameAtTurnStart && !wasInterrupted) {
          postNameLineSpokenRef.current = true;
          postNameSalutationSpokenRef.current = true;
          clearPostNameGreetingTimer();
          postNameGreetingNudgeSentRef.current = true;
          return;
        }
        if (!hadPostNameAtTurnStart && wasInterrupted) {
          schedulePostNameGreetingNudge();
          return;
        }
      }

      if (
        nameSavedRef.current &&
        !postNameLineSpokenRef.current &&
        !postNameHoldSentRef.current &&
        isAssistantPartialPostNameGreeting(assistantSnapshot, first)
      ) {
        postNameSalutationSpokenRef.current = true;
        if (!postNameGreetingNudgeSentRef.current) {
          schedulePostNameGreetingNudge();
        }
      } else if (
        nameSavedRef.current &&
        !postNameLineSpokenRef.current &&
        !postNameHoldSentRef.current &&
        wasInterrupted &&
        !postNameGreetingNudgeSentRef.current
      ) {
        schedulePostNameGreetingNudge();
      }
    },
    [
      clearPostNameGreetingTimer,
      schedulePostNameGreetingNudge,
      sendPostNameHoldNudge,
      visitorFirstName,
    ]
  );

  const recoverIncompletePostNameGreeting = useCallback(() => {
    if (
      modeRef.current !== "demo" ||
      !nameSavedRef.current ||
      postNameLineSpokenRef.current ||
      postNameHoldSentRef.current
    ) {
      return;
    }
    clearPostNameGreetingTimer();
    postNameGreetingNudgeSentRef.current = false;
    if (playerRef.current?.isPlaying()) {
      void playerRef.current.whenPlaybackIdle(10000).then(() => {
        sendPostNameGreetingNudge();
      });
      return;
    }
    sendPostNameGreetingNudge();
  }, [clearPostNameGreetingTimer, sendPostNameGreetingNudge]);

  const appendSessionTranscript = useCallback((role: VoiceDemoCaptionRole, text: string) => {
    if (verticalRef.current !== "plumbers") return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const lines = sessionTranscriptRef.current;
    const last = lines[lines.length - 1];
    if (last?.role === role) {
      last.text = mergeTranscriptChunk(last.text, trimmed);
      return;
    }
    lines.push({ role, text: trimmed });
    if (lines.length > 80) {
      sessionTranscriptRef.current = lines.slice(-80);
    }
  }, []);

  const snapshotPlumbingTranscript = useCallback(() => {
    appendSessionTranscript("user", captionTextRef.current);
    appendSessionTranscript("assistant", lastAssistantTextRef.current);
    return [...sessionTranscriptRef.current];
  }, [appendSessionTranscript]);

  const requestPlumbingFinalize = useCallback(async () => {
    if (verticalRef.current !== "plumbers") return null;
    const transcript = snapshotPlumbingTranscript();
    try {
      const res = await fetch("/api/voice-demo/plumbing/finalize-booking", {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        result?: Record<string, unknown>;
        error?: string;
      };
      if (!res.ok) {
        logVoiceDemoOps({
          kind: "plumbing_booking_finalize",
          message: `Finalize-booking HTTP ${res.status}`,
          severity: "warn",
          meta: {
            status: res.status,
            error: body.error,
            transcriptLines: transcript.length,
          },
        });
        return null;
      }
      logVoiceDemoOps({
        kind: "plumbing_booking_finalize",
        message: "Pre-hangup finalize-booking",
        meta: { result: body.result, transcriptLines: transcript.length },
      });
      return body.result ?? null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logVoiceDemoOps({
        kind: "plumbing_booking_finalize",
        message: "Finalize-booking fetch failed",
        severity: "warn",
        meta: { error: message, transcriptLines: transcript.length },
      });
      console.warn("[voice-demo-live] plumbing finalize-booking", err);
      return null;
    }
  }, [snapshotPlumbingTranscript]);

  const emitCaption = useCallback((role: VoiceDemoCaptionRole, chunk: string) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;

    if (captionRoleRef.current !== role) {
      captionRoleRef.current = role;
      captionTextRef.current = trimmed;
    } else {
      captionTextRef.current = mergeTranscriptChunk(captionTextRef.current, trimmed);
    }

    if (role === "user") {
      optionsRef.current.onCaption?.({
        role,
        text: captionTextRef.current,
      });
    }
  }, []);

  const resetCaption = useCallback(() => {
    captionRoleRef.current = null;
    captionTextRef.current = "";
    sessionTranscriptRef.current = [];
  }, []);

  const clearPendingFallback = useCallback(() => {
    if (pendingFallbackTimerRef.current) {
      clearTimeout(pendingFallbackTimerRef.current);
      pendingFallbackTimerRef.current = null;
    }
  }, []);

  const clearPhoneSilenceTimer = useCallback(() => {
    if (phoneSilenceTimerRef.current) {
      clearTimeout(phoneSilenceTimerRef.current);
      phoneSilenceTimerRef.current = null;
    }
  }, []);

  const sendPhoneSilenceNudge = useCallback(() => {
    const session = sessionRef.current;
    const transcript = captionTextRef.current.trim();
    if (!session || !awaitingPhoneDigitsRef.current || !transcript) return;
    if (phoneNudgeTranscriptRef.current === transcript) return;
    if (playerRef.current?.isPlaying()) return;

    phoneNudgeTranscriptRef.current = transcript;
    try {
      void sendClientNudge(buildPhonePauseNudge(transcript));
    } catch (err) {
      console.warn("[voice-demo-live] phone silence nudge", err);
      phoneNudgeTranscriptRef.current = "";
    }
  }, []);

  const schedulePhoneSilenceNudge = useCallback(() => {
    if (!awaitingPhoneDigitsRef.current || modeRef.current !== "demo") return;
    clearPhoneSilenceTimer();
    phoneSilenceTimerRef.current = setTimeout(() => {
      sendPhoneSilenceNudge();
    }, PHONE_SILENCE_NUDGE_MS);
  }, [clearPhoneSilenceTimer, sendPhoneSilenceNudge]);

  const setAwaitingPhoneDigits = useCallback(
    (active: boolean) => {
      awaitingPhoneDigitsRef.current = active;
      if (active) {
        awaitingPhoneConfirmRef.current = false;
      }
      phoneNudgeTranscriptRef.current = "";
      if (!active) {
        clearPhoneSilenceTimer();
      }
    },
    [clearPhoneSilenceTimer]
  );

  const clearPhoneCollectionState = useCallback(() => {
    awaitingPhoneDigitsRef.current = false;
    awaitingPhoneConfirmRef.current = false;
    phoneNudgeTranscriptRef.current = "";
    clearPhoneSilenceTimer();
  }, [clearPhoneSilenceTimer]);

  const clearWrapUpTimer = useCallback(() => {
    if (wrapUpTimerRef.current) {
      clearTimeout(wrapUpTimerRef.current);
      wrapUpTimerRef.current = null;
    }
  }, []);


  const runTool = useCallback(async (name: string, args: Record<string, unknown>) => {
    const res = await fetch("/api/voice-demo/tool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, args, mode: modeRef.current }),
    });
    const data = (await res.json()) as {
      result?: Record<string, unknown>;
      error?: string;
    };
    if (!res.ok) {
      const message =
        res.status === 401
          ? "Session expired - refresh the page and start voice again."
          : typeof data.error === "string"
            ? data.error
            : `Tool HTTP ${res.status}`;
      return { ok: false, error: message };
    }
    return data.result ?? { ok: false, error: "Tool failed" };
  }, []);


  const sendClientNudge = useCallback(
    async (turns: string | string[], opts?: VoiceDemoClientNudgeOpts) => {
      const session = sessionRef.current;
      if (!session) return false;
      return sendVoiceDemoClientNudge(session, playerRef.current, turns, opts);
    },
    []
  );

  const flushClientNudges = useCallback(async () => {
    await flushVoiceDemoClientNudgeQueue(
      sessionRef.current,
      playerRef.current,
      clientNudgeQueueRef.current
    );
  }, []);

  const clearInputSilenceTimers = useCallback(() => {
    clearPhoneSilenceTimer();
    clearWrapUpTimer();
  }, [clearPhoneSilenceTimer, clearWrapUpTimer]);

  const clearSuppressAudioRecoveryTimer = useCallback(() => {
    if (suppressAudioRecoveryTimerRef.current) {
      clearTimeout(suppressAudioRecoveryTimerRef.current);
      suppressAudioRecoveryTimerRef.current = null;
    }
  }, []);

  const isFarewellLocked = useCallback(() => {
    return (
      jarvisFarewellSentRef.current ||
      farewellDisconnectingRef.current ||
      goodbyeNudgeSentRef.current
    );
  }, []);


  const sendWrapUpCueLeakRecovery = useCallback(() => {
    const session = sessionRef.current;
    if (!session || modeRef.current !== "demo" || isFarewellLocked()) return;
    if (wrapUpCueLeakRecoverySentRef.current) return;
    wrapUpCueLeakRecoverySentRef.current = true;
    clearWrapUpTimer();
    logVoiceDemoOps({
      kind: "session_anomaly",
      message: "Jarvis leaked hidden cue - wrap-up recovery nudge sent",
      severity: "warn",
    });
    try {
      void sendClientNudge(buildWrapUpCueLeakRecoveryNudge(wrapUpQuestionIndexRef.current));
    } catch (err) {
      console.warn("[voice-demo-live] wrap-up cue leak recovery", err);
      wrapUpCueLeakRecoverySentRef.current = false;
    }
  }, [clearWrapUpTimer, isFarewellLocked]);

  const sendWrapUpPauseNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || modeRef.current !== "demo") return;
    if (verticalRef.current === "plumbers") return;
    if (isFarewellLocked()) return;
    if (awaitingPhoneDigitsRef.current) {
      return;
    }
    if (playerRef.current?.isPlaying()) {
      clearWrapUpTimer();
      wrapUpTimerRef.current = setTimeout(() => {
        sendWrapUpPauseNudge();
      }, 400);
      return;
    }

    wrapUpCueLeakRecoverySentRef.current = false;
    const questionIndex = wrapUpQuestionIndexRef.current;
    try {
      void sendClientNudge(buildWrapUpPauseNudge(questionIndex));
      wrapUpQuestionIndexRef.current =
        (questionIndex + 1) % VOICE_DEMO_WRAPUP_QUESTIONS.length;
    } catch (err) {
      console.warn("[voice-demo-live] wrap-up pause nudge", err);
    }
  }, [clearWrapUpTimer, isFarewellLocked]);

  const scheduleWrapUpPause = useCallback(
    (delayMs = WRAPUP_POST_ANSWER_PAUSE_MS) => {
      if (verticalRef.current === "plumbers") return;
      if (modeRef.current !== "demo" || isFarewellLocked()) return;
      clearWrapUpTimer();
      wrapUpTimerRef.current = setTimeout(() => {
        sendWrapUpPauseNudge();
      }, delayMs);
    },
    [clearWrapUpTimer, isFarewellLocked, sendWrapUpPauseNudge]
  );

  const syncPhoneCollectionState = useCallback(
    (name: string, result: Record<string, unknown>) => {
      if (name === "save_name" && result.ok === true) {
        return;
      }

      if (name === "decline_secondary_contact" && result.ok === true) {
        clearPhoneCollectionState();
        return;
      }

      if (
        (name === "stage_phone_number" || name === "update_staged_phone") &&
        result.ok === true
      ) {
        if (result.phoneConfirmed === true) {
          clearPhoneCollectionState();
        } else if (result.spellOnce === true) {
          awaitingPhoneDigitsRef.current = false;
          awaitingPhoneConfirmRef.current = true;
          phoneNudgeTranscriptRef.current = "";
          clearPhoneSilenceTimer();
        }
        return;
      }

      if (name === "confirm_phone_number" && result.ok === true) {
        clearPhoneCollectionState();
      }
    },
    [clearPhoneCollectionState, clearPhoneSilenceTimer, setAwaitingPhoneDigits]
  );

  const clearCallIdleTimer = useCallback(() => {
    if (callIdleTimerRef.current) {
      clearTimeout(callIdleTimerRef.current);
      callIdleTimerRef.current = null;
    }
  }, []);

  const clearPostFarewellTimer = useCallback(() => {
    if (postFarewellTimerRef.current) {
      clearTimeout(postFarewellTimerRef.current);
      postFarewellTimerRef.current = null;
    }
  }, []);

  const clearEndCallGlow = useCallback(() => {
    if (endCallGlowTimerRef.current) {
      clearTimeout(endCallGlowTimerRef.current);
      endCallGlowTimerRef.current = null;
    }
    endCallBlinkArmedRef.current = false;
    setEndCallGlow(false);
  }, []);

  const armEndCallBlink = useCallback(() => {
    if (modeRef.current !== "demo" || !sessionRef.current) return;
    if (endCallBlinkArmedRef.current || endCallGlowTimerRef.current) return;
    endCallBlinkArmedRef.current = true;
    endCallGlowTimerRef.current = setTimeout(() => {
      endCallGlowTimerRef.current = null;
      if (farewellDisconnectingRef.current || !sessionRef.current) return;
      setEndCallGlow(true);
    }, VOICE_DEMO_END_CALL_BLINK_DELAY_MS);
  }, []);

  const clearPlumbingContactPause = useCallback(() => {
    plumbingContactPauseFieldRef.current = null;
  }, []);

  const clearPlumbingGoodbyeBeat = useCallback(() => {
    plumbingGoodbyeBeatUntilRef.current = 0;
    plumbingGoodbyeNudgeSentRef.current = false;
    plumbingGoodbyeAudioQueueRef.current = [];
    if (plumbingGoodbyeAudioFlushTimerRef.current) {
      clearTimeout(plumbingGoodbyeAudioFlushTimerRef.current);
      plumbingGoodbyeAudioFlushTimerRef.current = null;
    }
    if (plumbingGoodbyeNudgeTimerRef.current) {
      clearTimeout(plumbingGoodbyeNudgeTimerRef.current);
      plumbingGoodbyeNudgeTimerRef.current = null;
    }
  }, []);

  const clearPlumbingPostOpeningTimer = useCallback(() => {
    if (plumbingPostOpeningTimerRef.current) {
      clearTimeout(plumbingPostOpeningTimerRef.current);
      plumbingPostOpeningTimerRef.current = null;
    }
  }, []);

  const clearPlumbingMidCallSilenceTimer = useCallback(() => {
    if (plumbingMidCallSilenceTimerRef.current) {
      clearTimeout(plumbingMidCallSilenceTimerRef.current);
      plumbingMidCallSilenceTimerRef.current = null;
    }
  }, []);

  const schedulePlumbingMidCallSilenceCheck = useCallback(() => {
    if (verticalRef.current !== "plumbers" || modeRef.current !== "demo") return;
    if (!plumbingOpeningCompleteRef.current || !plumbingUserSpokeSinceOpeningRef.current) {
      return;
    }
    if (jarvisFarewellSentRef.current || farewellDisconnectingRef.current) return;
    clearPlumbingMidCallSilenceTimer();
    plumbingMidCallSilenceTimerRef.current = setTimeout(() => {
      plumbingMidCallSilenceTimerRef.current = null;
      if (verticalRef.current !== "plumbers" || modeRef.current !== "demo") return;
      if (!plumbingOpeningCompleteRef.current || !plumbingUserSpokeSinceOpeningRef.current) {
        return;
      }
      if (jarvisFarewellSentRef.current || farewellDisconnectingRef.current) return;
      if (playerRef.current?.isPlaying() || toolInFlightRef.current > 0) {
        schedulePlumbingMidCallSilenceCheck();
        return;
      }
      const now = Date.now();
      if (now - plumbingMidCallNudgeLastAtRef.current < PLUMBING_MID_CALL_NUDGE_COOLDOWN_MS) {
        return;
      }
      plumbingMidCallNudgeLastAtRef.current = now;
      logVoiceDemoOps({
        kind: "session_anomaly",
        message: "Plumbing mid-call silence - listen nudge sent",
        severity: "warn",
        meta: { phase: getSessionPhase() },
      });
      void sendClientNudge(buildPlumbingMidCallSilenceNudge()).catch((err) => {
        console.warn("[voice-demo-live] plumbing mid-call silence nudge", err);
        plumbingMidCallNudgeLastAtRef.current = 0;
      });
    }, PLUMBING_MID_CALL_SILENCE_MS);
  }, [clearPlumbingMidCallSilenceTimer, getSessionPhase, sendClientNudge]);

  const handleAssistantInterrupted = useCallback(() => {
    suppressAssistantAudioRef.current = true;
    playerRef.current?.hardStop();
    lastAssistantTextRef.current = "";
    clearInputSilenceTimers();
    clearSuppressAudioRecoveryTimer();
    suppressAudioRecoveryTimerRef.current = setTimeout(() => {
      suppressAudioRecoveryTimerRef.current = null;
      if (!suppressAssistantAudioRef.current || jarvisFarewellSentRef.current) return;
      if (playerRef.current?.isPlaying() || toolInFlightRef.current > 0) return;
      suppressAssistantAudioRef.current = false;
      logVoiceDemoOps({
        kind: "session_anomaly",
        message: "Cleared stuck suppressAssistantAudio after interrupt timeout",
        severity: "warn",
        meta: { phase: getSessionPhase() },
      });
      if (verticalRef.current === "plumbers" && plumbingOpeningCompleteRef.current) {
        schedulePlumbingMidCallSilenceCheck();
      }
    }, PLUMBING_SUPPRESS_AUDIO_RECOVERY_MS);
  }, [
    clearInputSilenceTimers,
    clearSuppressAudioRecoveryTimer,
    getSessionPhase,
    schedulePlumbingMidCallSilenceCheck,
  ]);

  const schedulePlumbingPostOpeningNudge = useCallback(() => {
    if (verticalRef.current !== "plumbers" || modeRef.current !== "demo") return;
    if (!plumbingOpeningCompleteRef.current || !plumbingUserSpokeSinceOpeningRef.current) {
      return;
    }
    if (plumbingPostOpeningNudgeSentRef.current || jarvisFarewellSentRef.current) return;
    clearPlumbingPostOpeningTimer();
    plumbingPostOpeningTimerRef.current = setTimeout(() => {
      plumbingPostOpeningTimerRef.current = null;
      if (verticalRef.current !== "plumbers" || modeRef.current !== "demo") return;
      if (!plumbingOpeningCompleteRef.current || !plumbingUserSpokeSinceOpeningRef.current) {
        return;
      }
      if (plumbingPostOpeningNudgeSentRef.current || jarvisFarewellSentRef.current) return;
      if (playerRef.current?.isPlaying() || toolInFlightRef.current > 0) {
        schedulePlumbingPostOpeningNudge();
        return;
      }
      plumbingPostOpeningNudgeSentRef.current = true;
      void sendClientNudge(buildPlumbingPostOpeningListenNudge()).catch((err) => {
        console.warn("[voice-demo-live] plumbing post-opening nudge", err);
        plumbingPostOpeningNudgeSentRef.current = false;
      });
    }, PLUMBING_POST_OPENING_IDLE_MS);
  }, [clearPlumbingPostOpeningTimer, sendClientNudge]);

  const flushPlumbingGoodbyeAudioQueue = useCallback(() => {
    if (plumbingGoodbyeAudioFlushTimerRef.current) {
      clearTimeout(plumbingGoodbyeAudioFlushTimerRef.current);
      plumbingGoodbyeAudioFlushTimerRef.current = null;
    }
    const queued = plumbingGoodbyeAudioQueueRef.current;
    plumbingGoodbyeAudioQueueRef.current = [];
    plumbingGoodbyeBeatUntilRef.current = 0;
    if (!playerRef.current) return;
    for (const chunk of queued) {
      playerRef.current.enqueueBase64Pcm(chunk);
    }
  }, []);

  const schedulePlumbingGoodbyeAudioFlush = useCallback(() => {
    if (plumbingGoodbyeAudioFlushTimerRef.current) return;
    const delay = Math.max(0, plumbingGoodbyeBeatUntilRef.current - Date.now());
    plumbingGoodbyeAudioFlushTimerRef.current = setTimeout(() => {
      plumbingGoodbyeAudioFlushTimerRef.current = null;
      flushPlumbingGoodbyeAudioQueue();
    }, delay);
  }, [flushPlumbingGoodbyeAudioQueue]);

  const schedulePlumbingGoodbyeBeat = useCallback(() => {
    clearPlumbingGoodbyeBeat();
    plumbingGoodbyeBeatUntilRef.current = Date.now() + PLUMBING_GOODBYE_BEAT_MS;
    plumbingGoodbyeNudgeSentRef.current = true;
    logVoiceDemoOps({
      kind: "goodbye_nudge",
      message: "Plumbing goodbye beat - delaying Jarvis sign-off",
      meta: { beatMs: PLUMBING_GOODBYE_BEAT_MS },
    });
    plumbingGoodbyeNudgeTimerRef.current = setTimeout(() => {
      plumbingGoodbyeNudgeTimerRef.current = null;
      if (!sessionRef.current || verticalRef.current !== "plumbers") return;
      void sendClientNudge(buildPlumbingFinalGoodbyeNudge());
    }, PLUMBING_GOODBYE_BEAT_MS);
    schedulePlumbingGoodbyeAudioFlush();
  }, [clearPlumbingGoodbyeBeat, schedulePlumbingGoodbyeAudioFlush, sendClientNudge]);

  const touchCallIdleReset = useCallback(() => {
    if (!callWindingDownRef.current) return;
    clearCallIdleTimer();
  }, [clearCallIdleTimer]);

  const applyMicMuted = useCallback(
    (muted: boolean) => {
      micRef.current?.setMuted(muted);
      micStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
      setMicMuted(muted);
    },
    []
  );

  const disconnect = useCallback((intentional = true) => {
    clearReconnectTimer();
    clearPostNameGreetingTimer();
    clearCallIdleTimer();
    clearPostFarewellTimer();
    clearEndCallGlow();
    clearPlumbingGoodbyeBeat();
    clearPlumbingContactPause();
    callWindingDownRef.current = false;
    applyMicMuted(false);
    intentionalDisconnectRef.current = intentional;
    if (intentional) {
      sessionResumptionHandleRef.current = null;
      sessionResumableRef.current = true;
      reconnectAttemptRef.current = 0;
      reconnectExhaustedBonusRef.current = false;
    }
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
    clearPhoneCollectionState();
    stopOrbLoop();
    setConnected(false);
    setConnecting(false);
  }, [
    applyMicMuted,
    clearCallIdleTimer,
    clearPhoneCollectionState,
    clearPostNameGreetingTimer,
    clearReconnectTimer,
    clearPlumbingGoodbyeBeat,
    clearPlumbingContactPause,
    clearEndCallGlow,
    clearPostFarewellTimer,
    stopOrbLoop,
  ]);

  const disconnectGraceful = useCallback(async () => {
    await playerRef.current?.whenPlaybackIdle(10000);
    await sleep(PHASE_TAIL_MS);
    disconnect(true);
  }, [disconnect]);

  const setMicMutedState = useCallback(
    (muted: boolean) => {
      if (!sessionRef.current) return;
      applyMicMuted(muted);
      if (muted) {
        optionsRef.current.onStatus?.("Microphone paused - tap the mic to resume.");
      } else {
        optionsRef.current.onStatus?.("Microphone on - Jarvis can hear you.");
        touchCallIdleReset();
      }
    },
    [applyMicMuted, touchCallIdleReset]
  );

  const toggleMicMute = useCallback(() => {
    setMicMutedState(!micMuted);
  }, [micMuted, setMicMutedState]);

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

  const latchFarewellClosing = useCallback(() => {
    if (jarvisFarewellSentRef.current) return;
    jarvisFarewellSentRef.current = true;
    clearInputSilenceTimers();
    clearCallIdleTimer();
    clearPlumbingContactPause();
  }, [clearCallIdleTimer, clearInputSilenceTimers, clearPlumbingContactPause]);

  const finishConversation = useCallback(async () => {
    if (farewellDisconnectingRef.current) return;
    farewellDisconnectingRef.current = true;
    try {
      await playerRef.current?.whenPlaybackIdle(FAREWELL_PLAYBACK_MAX_WAIT_MS);
      await requestPlumbingFinalize();
      latchFarewellClosing();
      await sleep(PHASE_TAIL_MS);
      optionsRef.current.onConversationEnd?.();
      optionsRef.current.onStatus?.("Call ended - tap Start voice to chat again.");
      disconnect(true);
    } finally {
      farewellDisconnectingRef.current = false;
      lastAssistantTextRef.current = "";
    }
  }, [disconnect, latchFarewellClosing, requestPlumbingFinalize]);

  const scheduleCallIdleHangup = useCallback(() => {
    if (!callWindingDownRef.current) return;
    if (farewellDisconnectingRef.current || reconnectingRef.current) return;
    clearCallIdleTimer();
    callIdleTimerRef.current = setTimeout(() => {
      callIdleTimerRef.current = null;
      if (!callWindingDownRef.current) return;
      if (farewellDisconnectingRef.current || reconnectingRef.current) return;
      if (playerRef.current?.isPlaying() || toolInFlightRef.current > 0) {
        scheduleCallIdleHangup();
        return;
      }
      hangupReasonRef.current = "plumbing_idle_silence";
      logVoiceDemoOps({
        kind: "client_hangup_scheduled",
        message: "Call idle silence - ending call",
        meta: { phase: getSessionPhase(), hangupReason: "plumbing_idle_silence" },
      });
      void finishConversation();
    }, VOICE_DEMO_CALL_IDLE_HANGUP_MS);
  }, [clearCallIdleTimer, finishConversation, getSessionPhase]);

  const scheduleFarewellHangup = useCallback(
    (reason: VoiceDemoHangupReason) => {
      if (farewellDisconnectingRef.current || reconnectingRef.current) return;
      hangupReasonRef.current = reason;
      logVoiceDemoOps({
        kind: "client_hangup_scheduled",
        message: `Client scheduling hangup: ${reason}`,
        meta: {
          phase: getSessionPhase(),
          hangupReason: reason,
          assistantTail: lastAssistantTextRef.current.slice(-120),
        },
      });
      void finishConversation();
    },
    [finishConversation, getSessionPhase]
  );

  const endCallNow = useCallback(
    async (reason: VoiceDemoHangupReason = "visitor_farewell_echo") => {
      if (farewellDisconnectingRef.current) return;
      farewellDisconnectingRef.current = true;
      hangupReasonRef.current = reason;
      logVoiceDemoOps({
        kind: "client_hangup_scheduled",
        message: "Visitor farewell echo - immediate hangup",
        meta: { phase: getSessionPhase(), hangupReason: reason },
      });
      await requestPlumbingFinalize();
      latchFarewellClosing();
      clearCallIdleTimer();
      clearPostFarewellTimer();
      clearEndCallGlow();
      postFarewellDeadlineRef.current = 0;
      micRef.current?.stop();
      optionsRef.current.onConversationEnd?.();
      optionsRef.current.onStatus?.("Call ended - tap Start voice to chat again.");
      disconnect(true);
      farewellDisconnectingRef.current = false;
      lastAssistantTextRef.current = "";
    },
    [
      clearCallIdleTimer,
      clearEndCallGlow,
      clearPostFarewellTimer,
      disconnect,
      getSessionPhase,
      latchFarewellClosing,
      requestPlumbingFinalize,
    ]
  );

  const endCall = useCallback(() => {
    if (!sessionRef.current || farewellDisconnectingRef.current) return;
    reconnectPausedRef.current = true;
    hadPlumbingLiveSessionRef.current = false;
    hangupReasonRef.current = "user_disconnect";
    logVoiceDemoOps({
      kind: "client_hangup_scheduled",
      message: "Caller tapped End call",
      meta: { phase: getSessionPhase(), hangupReason: "user_disconnect" },
    });
    void endCallNow("user_disconnect");
  }, [endCallNow, getSessionPhase]);

  const runPostFarewellHangupTick = useCallback(() => {
    if (modeRef.current !== "demo" || !jarvisFarewellSentRef.current) return;
    if (farewellDisconnectingRef.current || reconnectingRef.current) return;
    const isPlumbing = verticalRef.current === "plumbers";
    const idleMs = postFarewellIdleMsRef.current;
    const ackHangup = idleMs <= VOICE_DEMO_POST_FAREWELL_ACK_MS;
    const reason: VoiceDemoHangupReason = ackHangup
      ? isPlumbing
        ? "plumbing_post_farewell_ack"
        : "post_farewell_ack"
      : isPlumbing
        ? "plumbing_post_farewell_idle"
        : "post_farewell_idle";
    if (playerRef.current?.isPlaying() || toolInFlightRef.current > 0) {
      if (Date.now() < postFarewellDeadlineRef.current) {
        postFarewellTimerRef.current = setTimeout(() => {
          postFarewellTimerRef.current = null;
          runPostFarewellHangupTick();
        }, 250);
        return;
      }
    }
    logVoiceDemoOps({
      kind: "client_hangup_scheduled",
      message: "Post-farewell - ending call",
      meta: {
        phase: getSessionPhase(),
        hangupReason: reason,
        idleMs,
        vertical: verticalRef.current,
      },
    });
    void endCallNow(reason);
  }, [endCallNow, getSessionPhase]);

  const schedulePostFarewellHangup = useCallback(
    (delayMs = VOICE_DEMO_POST_FAREWELL_IDLE_MS) => {
      if (modeRef.current !== "demo") return;
      if (!jarvisFarewellSentRef.current) return;
      if (farewellDisconnectingRef.current || reconnectingRef.current) return;
      clearPostFarewellTimer();
      postFarewellIdleMsRef.current = delayMs;
      if (delayMs >= VOICE_DEMO_POST_FAREWELL_IDLE_MS) {
        if (postFarewellDeadlineRef.current === 0) {
          postFarewellDeadlineRef.current = Date.now() + 20_000;
        }
        armEndCallBlink();
      }
      postFarewellTimerRef.current = setTimeout(() => {
        postFarewellTimerRef.current = null;
        runPostFarewellHangupTick();
      }, delayMs);
    },
    [armEndCallBlink, clearPostFarewellTimer, runPostFarewellHangupTick]
  );

  schedulePostFarewellHangupRef.current = schedulePostFarewellHangup;

  const handleMessage = useCallback(
    async (message: LiveMessage) => {
      if (message.sessionResumptionUpdate) {
        const resumable = message.sessionResumptionUpdate.resumable === true;
        sessionResumableRef.current = resumable;
        const nextHandle = message.sessionResumptionUpdate.newHandle;
        if (nextHandle && nextHandle !== sessionResumptionHandleRef.current) {
          sessionResumptionHandleRef.current = nextHandle;
          resumptionHandleCountRef.current += 1;
          const now = Date.now();
          const shouldLog =
            !resumable ||
            now - lastResumptionOpsAtRef.current >= RESUMPTION_OPS_MIN_INTERVAL_MS;
          if (shouldLog) {
            lastResumptionOpsAtRef.current = now;
            logVoiceDemoOps({
              kind: "session_resumption",
              message: "Stored session resumption handle",
              meta: {
                resumable,
                handleCount: resumptionHandleCountRef.current,
              },
            });
          }
        } else if (nextHandle) {
          sessionResumptionHandleRef.current = nextHandle;
        } else if (!resumable) {
          logVoiceDemoOps({
            kind: "session_resumption",
            message: "Session not resumable (tool/gen in flight)",
            meta: { resumable: false },
          });
        }
        if (resumable) {
          flushPendingReconnect();
        }
      }

      if (message.goAway) {
        const durationMs = Date.now() - connectedAtRef.current;
        const timeLeft = message.goAway.timeLeft ?? null;
        logVoiceDemoOps({
          kind: "session_anomaly",
          message: "Gemini goAway - will reconnect after assistant finishes",
          severity: "warn",
          meta: {
            durationMs,
            timeLeft,
            toolInFlight: toolInFlightRef.current,
            resumable: sessionResumableRef.current,
          },
        });
        const scheduleGoAwayReconnect = async () => {
          if (playerRef.current?.isPlaying()) {
            await playerRef.current.whenPlaybackIdle(20_000);
          }
          if (farewellDisconnectingRef.current || intentionalDisconnectRef.current) return;
          requestLiveReconnect("goAway", { durationMs, timeLeft });
        };
        void scheduleGoAwayReconnect();
        return;
      }

      const earlyOut = message.serverContent?.outputTranscription?.text;
      if (earlyOut) {
        lastAssistantTextRef.current = mergeTranscriptChunk(
          lastAssistantTextRef.current,
          earlyOut
        );
        if (verticalRef.current === "plumbers" && earlyOut.trim()) {
          clearPlumbingPostOpeningTimer();
        }
        noteAssistantPostNameProgress(lastAssistantTextRef.current);
        if (
          modeRef.current === "demo" &&
          /cell number|mobile number|phone number|us cell|your cell/i.test(
            lastAssistantTextRef.current
          )
        ) {
          setAwaitingPhoneDigits(true);
        }
        if (modeRef.current === "demo" && isAssistantWrapUpQuestion(lastAssistantTextRef.current)) {
          clearWrapUpTimer();
        }
        if (modeRef.current === "demo") {
          if (isAssistantHiddenCueLeak(lastAssistantTextRef.current)) {
            sendWrapUpCueLeakRecovery();
          }
        }
      }

      const calls = message.toolCall?.functionCalls ?? [];
      if (calls.length > 0 && sessionRef.current) {
        const activeSession = sessionRef.current;
        const responses: VoiceDemoToolResponseEntry[] = [];
        toolInFlightRef.current += 1;

        try {
        for (const call of calls) {
          const name = call.name ?? "";
          const args = (call.args ?? {}) as Record<string, unknown>;

          const result = await runTool(name, args);
            syncPhoneCollectionState(name, result);

            if (name === "save_name" && result.ok === true) {
              nameSavedRef.current = true;
              const savedName = typeof result.name === "string" ? result.name.trim() : "";
              if (savedName) savedNameRef.current = savedName;
              const alreadyGreeted = postNameLineSpokenRef.current;
              responses.push(
                buildVoiceDemoToolResponse(call.id, name, {
                  ...result,
                  message: buildSaveNameToolMessage(savedName || "visitor", alreadyGreeted),
                })
              );
              continue;
            }

          if (name === "verify_code" && result.verified === true) {
              queuePhaseTransition({ kind: "verified", nextMode: "demo" });
            }

            if (verticalRef.current === "plumbers") {
              if (name === "save_plumbing_contact" && result.ok === true) {
                const field = result.reconfirmField;
                if (
                  field === "name" ||
                  field === "serviceAddress" ||
                  field === "email" ||
                  field === "phone"
                ) {
                  plumbingContactPauseFieldRef.current = field;
                }
                if (result.booked === true) {
                  clearPlumbingContactPause();
                  clearCallIdleTimer();
                }
              }
              if (name === "book_plumbing_appointment" && result.booked === true) {
                clearPlumbingContactPause();
                clearCallIdleTimer();
              }
            } else if (name === "request_callback" && result.callbackLogged === true) {
              callWindingDownRef.current = true;
            }

            if (name === "send_promo_email" && result.ok === true) {
              awaitingPromoConsentRef.current = false;
            }

            responses.push(buildVoiceDemoToolResponse(call.id, name, result));
          }

          if (
            activeSession === sessionRef.current &&
            !reconnectingRef.current &&
            !farewellDisconnectingRef.current
          ) {
            activeSession.sendToolResponse({ functionResponses: responses });
            pendingToolResponsesRef.current = null;
          } else {
            pendingToolResponsesRef.current = responses;
            logVoiceDemoOps({
              kind: "session_anomaly",
              message: "Deferred tool response until reconnect completes",
              severity: "warn",
              meta: {
                toolCount: responses.length,
                reconnecting: reconnectingRef.current,
              },
            });
          }
        } finally {
          toolInFlightRef.current = Math.max(0, toolInFlightRef.current - 1);
          flushPendingReconnect();
        }
      }

      if (message.serverContent?.interrupted) {
        assistantTurnInterruptedRef.current = true;
        handleAssistantInterrupted();
      }

      const parts = message.serverContent?.modelTurn?.parts ?? [];
      if (!suppressAssistantAudioRef.current) {
      for (const part of parts) {
        const data = part.inlineData?.data;
        const mime = part.inlineData?.mimeType ?? "";
        if (data && mime.includes("audio/pcm")) {
            if (postNameHoldSentRef.current) {
              playerRef.current?.hardStop();
              continue;
            }
            
            if (jarvisFarewellSentRef.current) {
              playerRef.current?.hardStop();
              if (!farewellHoldSentRef.current && sessionRef.current) {
                farewellHoldSentRef.current = true;
                logVoiceDemoOps({
                  kind: "farewell_hold",
                  message: "Muted repeat assistant audio after farewell - hold nudge sent",
                });
                try {
                  void sendClientNudge(buildFarewellHoldNudge());
                } catch (err) {
                  console.warn("[voice-demo-live] farewell hold nudge", err);
                  farewellHoldSentRef.current = false;
                }
              }
              continue;
            }
            clearInputSilenceTimers();
            touchCallIdleReset();
          playerRef.current ??= new VoiceDemoAudioPlayer();
            if (
              verticalRef.current === "plumbers" &&
              plumbingGoodbyeBeatUntilRef.current > Date.now()
            ) {
              plumbingGoodbyeAudioQueueRef.current.push(data);
              schedulePlumbingGoodbyeAudioFlush();
              continue;
            }
            clearPlumbingPostOpeningTimer();
            clearPlumbingMidCallSilenceTimer();
          playerRef.current.enqueueBase64Pcm(data);
        }
      }
      }

      const inText = message.serverContent?.inputTranscription?.text;
      if (inText) {
        if (inText.trim() && playerRef.current?.isPlaying()) {
          const deferInterruptForPostName =
            nameSavedRef.current && !postNameLineSpokenRef.current;
          const deferInterruptForPlumbingOpening =
            verticalRef.current === "plumbers" && !plumbingOpeningCompleteRef.current;
          if (!deferInterruptForPostName && !deferInterruptForPlumbingOpening) {
            handleAssistantInterrupted();
          }
        }
        clearWrapUpTimer();
        emitCaption("user", inText);
        if (verticalRef.current === "plumbers" && inText.trim()) {
          suppressAssistantAudioRef.current = false;
          clearSuppressAudioRecoveryTimer();
          if (plumbingOpeningCompleteRef.current) {
            plumbingUserSpokeSinceOpeningRef.current = true;
            schedulePlumbingPostOpeningNudge();
            schedulePlumbingMidCallSilenceCheck();
          }
        }
        if (
          inText.trim() &&
          plumbingContactPauseFieldRef.current &&
          userAnsweredPlumbingContactPause(captionTextRef.current.trim())
        ) {
          plumbingContactPauseFieldRef.current = null;
        }
        const userLine = captionTextRef.current.trim();

        if (
          jarvisFarewellSentRef.current &&
          modeRef.current === "demo"
        ) {
          const userLine = captionTextRef.current.trim();
          if (userLine && isVisitorFarewellAck(userLine)) {
            clearEndCallGlow();
            schedulePostFarewellHangup(VOICE_DEMO_POST_FAREWELL_ACK_MS);
          }
        } else {
          touchCallIdleReset();
        }

        if (modeRef.current === "demo") {
          if (
            verticalRef.current !== "plumbers" &&
            awaitingPromoConsentRef.current &&
            isUserPromoDecline(userLine)
          ) {
            awaitingPromoConsentRef.current = false;
          }
          if (verticalRef.current === "plumbers") {
            if (plumbingAwaitingConcernsAnswerRef.current) {
              if (isPlumbingVisitorConfirmedConcerns(userLine)) {
                plumbingAwaitingConcernsAnswerRef.current = false;
                visitorExplicitlyDoneRef.current = true;
                callWindingDownRef.current = true;
                schedulePlumbingGoodbyeBeat();
              } else if (
                isPlumbingVisitorDeclinedConcerns(userLine) ||
                isUserSubstantiveQuestion(userLine)
              ) {
                plumbingAwaitingConcernsAnswerRef.current = false;
                plumbingExitConcernsAskedRef.current = false;
                visitorExplicitlyDoneRef.current = false;
                callWindingDownRef.current = false;
                clearPlumbingGoodbyeBeat();
              } else if (isPlumbingVisitorEndingCall(userLine)) {
                plumbingAwaitingConcernsAnswerRef.current = false;
                visitorExplicitlyDoneRef.current = true;
                callWindingDownRef.current = true;
                schedulePlumbingGoodbyeBeat();
              }
            } else if (isPlumbingBookingContinuation(userLine)) {
              visitorExplicitlyDoneRef.current = false;
              callWindingDownRef.current = false;
              plumbingAwaitingConcernsAnswerRef.current = false;
              plumbingExitConcernsAskedRef.current = false;
              clearPlumbingGoodbyeBeat();
            } else if (isPlumbingVisitorEndingCall(userLine)) {
              if (jarvisFarewellSentRef.current) {
                if (isVisitorFarewellAck(userLine)) {
                  clearEndCallGlow();
                  schedulePostFarewellHangup(VOICE_DEMO_POST_FAREWELL_ACK_MS);
                }
                return;
              }
              if (!plumbingExitConcernsAskedRef.current) {
                plumbingExitConcernsAskedRef.current = true;
                plumbingAwaitingConcernsAnswerRef.current = true;
                visitorExplicitlyDoneRef.current = false;
                callWindingDownRef.current = false;
                clearPlumbingGoodbyeBeat();
                void sendClientNudge(buildPlumbingExitConcernsNudge());
              }
            }
          } else if (isUserExplicitlyDone(userLine)) {
            visitorExplicitlyDoneRef.current = true;
          }
          if (
            nameSavedRef.current &&
            !postNameLineSpokenRef.current &&
            userLine.trim() &&
            !playerRef.current?.isPlaying()
          ) {
            recoverIncompletePostNameGreeting();
          } else if (isUserSmallTalk(userLine)) {
            visitorAskedSubstantiveQuestionRef.current = false;
            clearWrapUpTimer();
          } else if (isUserSubstantiveQuestion(userLine)) {
            visitorAskedSubstantiveQuestionRef.current = true;
            visitorExplicitlyDoneRef.current = false;
          }
        }

        if (/\d/.test(inText)) {
          if (awaitingPhoneConfirmRef.current) {
            awaitingPhoneConfirmRef.current = false;
            awaitingPhoneDigitsRef.current = true;
            phoneNudgeTranscriptRef.current = "";
          }
          schedulePhoneSilenceNudge();
        }
      }

      if (message.serverContent?.turnComplete) {
        const assistantSnapshot = lastAssistantTextRef.current;
        if (verticalRef.current === "plumbers") {
          appendSessionTranscript("user", captionTextRef.current);
          appendSessionTranscript("assistant", assistantSnapshot);
          if (
            /confirmation email|confirmation text|you'?re (all )?set|appointment is (confirmed|booked)|scheduled for|see you (then|on)|coupon.+email/i.test(
              assistantSnapshot
            )
          ) {
            void requestPlumbingFinalize();
          }
        }
        if (
          verticalRef.current !== "plumbers" &&
          modeRef.current === "demo" &&
          isAssistantPromoOffer(assistantSnapshot)
        ) {
          awaitingPromoConsentRef.current = true;
          if (isAssistantPromoOfferBundledWithGoodbye(assistantSnapshot)) {
            void sendClientNudge(buildPromoOfferSplitNudge());
          }
        }
        if (!jarvisFarewellSentRef.current) {
          suppressAssistantAudioRef.current = false;
          clearSuppressAudioRecoveryTimer();
        }
        if (
          verticalRef.current === "plumbers" &&
          modeRef.current === "demo" &&
          !jarvisFarewellSentRef.current &&
          isPlumbingAssistantFarewell(assistantSnapshot)
        ) {
          latchFarewellClosing();
        }
        if (
          verticalRef.current !== "plumbers" &&
          modeRef.current === "demo" &&
          !jarvisFarewellSentRef.current &&
          isAssistantFarewell(assistantSnapshot)
        ) {
          latchFarewellClosing();
        }
        if (verticalRef.current === "plumbers" && assistantSnapshot.trim()) {
          if (
            isPlumbingOpeningLine(assistantSnapshot) ||
            (greetingSentRef.current &&
              /\bjarvis\b/i.test(assistantSnapshot) &&
              assistantSnapshot.trim().length > 40)
          ) {
            plumbingOpeningCompleteRef.current = true;
          }
        }
        const hadPostNameAtTurnStart = postNameLineSpokenRef.current;
        const wasInterrupted = assistantTurnInterruptedRef.current;
        assistantTurnInterruptedRef.current = false;
        finishPostNameGreetingTurn(assistantSnapshot, hadPostNameAtTurnStart, wasInterrupted);
        const hadPendingClientHangup = pendingClientHangupRef.current;
        if (hadPendingClientHangup) {
          pendingClientHangupRef.current = false;
        }

        const shouldWrapUpAfterThisTurn =
          modeRef.current === "demo" &&
          !callWindingDownRef.current &&
          shouldScheduleWrapUpAfterAnswer(assistantSnapshot, {
            awaitingCollection: awaitingPhoneDigitsRef.current,
            farewellSent: jarvisFarewellSentRef.current,
            visitorAskedSubstantiveQuestion: visitorAskedSubstantiveQuestionRef.current,
          });

        void (async () => {
          await playerRef.current?.whenPlaybackIdle(FAREWELL_PLAYBACK_MAX_WAIT_MS);
          const contactPauseField = plumbingContactPauseFieldRef.current;
          if (
            contactPauseField === "phone" &&
            assistantChainedSchedulingAfterPhone(assistantSnapshot)
          ) {
            await sendClientNudge(buildPlumbingPhoneSchedulingRecoveryNudge());
          }
          if (
            contactPauseField &&
            verticalRef.current === "plumbers" &&
            modeRef.current === "demo" &&
            !farewellDisconnectingRef.current &&
            !reconnectingRef.current
          ) {
            await sleep(plumbingContactPostReadbackPauseMs(contactPauseField));
            if (plumbingContactPauseFieldRef.current === contactPauseField) {
              await sendClientNudge(buildPlumbingContactPauseNudge(contactPauseField));
            }
          }
          await flushClientNudges();
          if (farewellDisconnectingRef.current || reconnectingRef.current) return;
          if (modeRef.current !== "demo" || !postNameLineSpokenRef.current) return;

          if (shouldWrapUpAfterThisTurn) return;

          if (
            hadPendingClientHangup &&
            verticalRef.current !== "plumbers" &&
            !awaitingPromoConsentRef.current
          ) {
            if (!jarvisFarewellSentRef.current) {
              latchFarewellClosing();
            }
            scheduleFarewellHangup(
              hangupReasonRef.current ?? "model_end_conversation_blocked"
            );
            return;
          }

          const plumbingHangup =
            verticalRef.current === "plumbers" &&
            shouldPlumbingClientHangup({
              visitorEndingCall: visitorExplicitlyDoneRef.current,
              assistantText: assistantSnapshot,
              farewellSent: jarvisFarewellSentRef.current,
              goodbyeNudgeSent: plumbingGoodbyeNudgeSentRef.current,
            });
          const marketingHangup =
            verticalRef.current !== "plumbers" &&
            shouldClientScheduleFarewellHangup(assistantSnapshot, {
              visitorExplicitlyDone: visitorExplicitlyDoneRef.current,
              farewellSent: jarvisFarewellSentRef.current,
              goodbyeNudgeSent: goodbyeNudgeSentRef.current,
              phase: getSessionPhase(),
              awaitingPromoConsent: awaitingPromoConsentRef.current,
            });
          if (plumbingHangup || marketingHangup) {
            if (!jarvisFarewellSentRef.current) {
              latchFarewellClosing();
            }
            schedulePostFarewellHangup(VOICE_DEMO_POST_FAREWELL_IDLE_MS);
          } else if (modeRef.current === "demo" && jarvisFarewellSentRef.current) {
            schedulePostFarewellHangup(VOICE_DEMO_POST_FAREWELL_IDLE_MS);
          } else if (callWindingDownRef.current && verticalRef.current !== "plumbers") {
            scheduleCallIdleHangup();
          }
        })();
        if (modeRef.current === "demo") {
          if (
            nameSavedRef.current &&
            !postNameLineSpokenRef.current &&
            !postNameGreetingNudgeSentRef.current
          ) {
            schedulePostNameGreetingNudge();
          }
          if (isAssistantHiddenCueLeak(assistantSnapshot)) {
            sendWrapUpCueLeakRecovery();
          } else if (isAssistantWrapUpQuestion(assistantSnapshot)) {
            wrapUpCueLeakRecoverySentRef.current = false;
            clearWrapUpTimer();
          }
          if (
            verticalRef.current !== "plumbers" &&
            !callWindingDownRef.current &&
            shouldScheduleWrapUpAfterAnswer(assistantSnapshot, {
              awaitingCollection: awaitingPhoneDigitsRef.current,
              farewellSent: jarvisFarewellSentRef.current,
              visitorAskedSubstantiveQuestion: visitorAskedSubstantiveQuestionRef.current,
            })
          ) {
            visitorAskedSubstantiveQuestionRef.current = false;
            scheduleWrapUpPause(WRAPUP_POST_ANSWER_PAUSE_MS);
          } else if (verticalRef.current !== "plumbers") {
            clearWrapUpTimer();
          }
        }
        lastAssistantTextRef.current = "";

        if (pendingPhaseRef.current) {
          void finishPendingPhase();
        }
      }
    },
    [
      clearInputSilenceTimers,
      clearPostNameGreetingTimer,
      clearWrapUpTimer,
      handleAssistantInterrupted,
      finishPostNameGreetingTurn,
      recoverIncompletePostNameGreeting,
      noteAssistantPostNameProgress,
      emitCaption,
      endCallNow,
      finishConversation,
      finishPendingPhase,
      scheduleFarewellHangup,
      queuePhaseTransition,
      runTool,
      schedulePhoneSilenceNudge,
      scheduleWrapUpPause,
      sendWrapUpCueLeakRecovery,
      isAssistantHiddenCueLeak,
      isAssistantWrapUpQuestion,
      sendClientNudge,
      flushClientNudges,
      setAwaitingPhoneDigits,
      syncPhoneCollectionState,
      getSessionPhase,
      latchFarewellClosing,
      requestLiveReconnect,
      scheduleLiveReconnect,
      flushPendingReconnect,
      schedulePostNameGreetingNudge,
      sendPostNameGreetingNudge,
      scheduleCallIdleHangup,
      schedulePostFarewellHangup,
      armEndCallBlink,
      clearEndCallGlow,
      touchCallIdleReset,
      schedulePlumbingGoodbyeBeat,
      clearPlumbingGoodbyeBeat,
      schedulePlumbingGoodbyeAudioFlush,
      clearPlumbingPostOpeningTimer,
      schedulePlumbingPostOpeningNudge,
      clearPlumbingMidCallSilenceTimer,
      schedulePlumbingMidCallSilenceCheck,
      clearSuppressAudioRecoveryTimer,
      handleAssistantInterrupted,
    ]
  );

  const connect = useCallback(
    async (mode: VoiceDemoLiveMode, connectOpts?: ConnectOptions) => {
      if (connectOpts?.userInitiated === true) {
        reconnectPausedRef.current = false;
        reconnectAttemptRef.current = 0;
        reconnectExhaustedBonusRef.current = false;
        connectInFlightWaitsRef.current = 0;
        lastReconnectRequestAtRef.current = 0;
      }
      const autoResumePlumbing =
        verticalRef.current === "plumbers" && hadPlumbingLiveSessionRef.current;
      const resume =
        connectOpts?.resume === true ||
        (autoResumePlumbing && !reconnectPausedRef.current);

      if (!resume) {
        pendingPhaseRef.current = null;
        pendingSinceRef.current = null;
        clearPendingFallback();
        clearPhoneCollectionState();
        finishingPhaseRef.current = false;
        jarvisFarewellSentRef.current = false;
        goodbyeNudgeSentRef.current = false;
        farewellHoldSentRef.current = false;
        farewellDisconnectingRef.current = false;
        pendingClientHangupRef.current = false;
        hangupReasonRef.current = null;
        lastAssistantTextRef.current = "";
        greetingSentRef.current = false;
        nameSavedRef.current = false;
        savedNameRef.current = "";
        postNameLineSpokenRef.current = isPlumbingDemo;
        postNameSalutationSpokenRef.current = false;
        postNameHoldSentRef.current = false;
        postNameGreetingNudgeSentRef.current = false;
        assistantTurnInterruptedRef.current = false;
        clearPostNameGreetingTimer();
        visitorExplicitlyDoneRef.current = false;
        sessionResumptionHandleRef.current = null;
        sessionResumableRef.current = true;
        callWindingDownRef.current = false;
        awaitingPromoConsentRef.current = false;
        plumbingExitConcernsAskedRef.current = false;
        plumbingAwaitingConcernsAnswerRef.current = false;
        clearPlumbingGoodbyeBeat();
        clearPlumbingPostOpeningTimer();
        clearPlumbingMidCallSilenceTimer();
        clearSuppressAudioRecoveryTimer();
        plumbingMidCallNudgeLastAtRef.current = 0;
        resumptionHandleCountRef.current = 0;
        lastResumptionOpsAtRef.current = 0;
        plumbingOpeningCompleteRef.current = false;
        plumbingUserSpokeSinceOpeningRef.current = false;
        plumbingPostOpeningNudgeSentRef.current = false;
        clearPlumbingContactPause();
        clearCallIdleTimer();
        clearPostFarewellTimer();
        clearEndCallGlow();
        postFarewellDeadlineRef.current = 0;
        endCallBlinkArmedRef.current = false;
        postFarewellIdleMsRef.current = VOICE_DEMO_POST_FAREWELL_IDLE_MS;
        reconnectAttemptRef.current = 0;
        reconnectExhaustedBonusRef.current = false;
        handleMessageChainRef.current = Promise.resolve();
        toolInFlightRef.current = 0;
        pendingToolResponsesRef.current = null;
        pendingReconnectRef.current = null;
        clearReconnectTimer();
        suppressAssistantAudioRef.current = false;
        visitorAskedSubstantiveQuestionRef.current = false;
        wrapUpQuestionIndexRef.current = 0;
        wrapUpCueLeakRecoverySentRef.current = false;
        resetCaption();
        disconnect(true);
      } else if (reconnectingRef.current) {
        return;
      } else {
        if (autoResumePlumbing && connectOpts?.resume !== true) {
          reconnectAttemptRef.current = 0;
          reconnectExhaustedBonusRef.current = false;
        }
        reconnectingRef.current = true;
        intentionalDisconnectRef.current = true;
        try {
          sessionRef.current?.close();
        } catch {
          /* ignore */
        }
        sessionRef.current = null;
        if (verticalRef.current === "plumbers") {
          plumbingOpeningCompleteRef.current = true;
          clearPlumbingPostOpeningTimer();
          clearPlumbingMidCallSilenceTimer();
          clearSuppressAudioRecoveryTimer();
          // Stale audio from the dropped socket causes re-asks and blocks resume nudges.
          playerRef.current?.hardStop();
          stopOrbLoop();
        } else {
          const playerStillPlaying = playerRef.current?.isPlaying() ?? false;
          if (!playerStillPlaying) {
            stopOrbLoop();
          } else if (orbFrameRef.current === null) {
            startOrbLoop();
          }
        }
        setConnecting(true);
        setConnected(false);
      }

      setError("");
      if (!resume) {
      setConnecting(true);
      }
      modeRef.current = mode;
      optionsRef.current.onStatus?.(resume ? "Reconnecting…" : "Connecting…");

      if (!resume && mode === "demo") {
        try {
          const statusRes = await fetch("/api/voice-demo/status");
          const statusData = (await statusRes.json()) as { fullName?: string | null };
          const seed = seedOnboardingFromFullName(statusData.fullName);
          if (seed.savedName) {
            savedNameRef.current = seed.savedName;
          }
        } catch {
          /* status optional - fresh onboarding if unavailable */
        }
      }

      try {
        let stream = micStreamRef.current;
        if (!stream || !resume) {
          stream?.getTracks().forEach((t) => t.stop());
          stream = await requestVoiceDemoMicStream();
        micStreamRef.current = stream;
        }

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
          reconnectingRef.current = false;
          if (!resume) {
          stream.getTracks().forEach((t) => t.stop());
          micStreamRef.current = null;
          setError(tokenData.error ?? "Could not start voice session.");
          setConnecting(false);
          } else {
            scheduleLiveReconnect("token_fetch_failed", {
              status: tokenRes.status,
              error: tokenData.error,
            });
          }
          return;
        }

        if (!resume) {
          clearPhoneCollectionState();
        }

        const ai = new GoogleGenAI({
          apiKey: tokenData.token,
          httpOptions: { apiVersion: "v1alpha" },
        });

        const resumptionHandle = sessionResumptionHandleRef.current ?? undefined;

        // Ephemeral live tokens lock connect config server-side - only pass
        // sessionResumption on resume (handle from prior SessionResumptionUpdate).
        const session = await ai.live.connect({
          model: tokenData.model ?? VOICE_DEMO_LIVE_MODEL,
          ...(resumptionHandle
            ? {
                config: {
                  sessionResumption: { handle: resumptionHandle, transparent: true },
                },
              }
            : {}),
          callbacks: {
            onopen: () => {
              setConnected(true);
              setConnecting(false);
              reconnectingRef.current = false;
              connectedAtRef.current = Date.now();
              if (verticalRef.current === "plumbers") {
                hadPlumbingLiveSessionRef.current = true;
              }
              if (!resume) {
                sessionResumableRef.current = true;
                reconnectAttemptRef.current = 0;
                reconnectExhaustedBonusRef.current = false;
              }
              startOrbLoop();
              optionsRef.current.onStatus?.(
                resume
                  ? "Back with you - keep talking."
                  : isPlumbingDemo
                    ? plumbingDemoOpeningStatus()
                    : voiceDemoOpeningStatus(mode)
              );
              if (!resume) {
                setTimeout(() => {
                  if (sessionRef.current) {
                    sendOpeningGreeting(sessionRef.current);
                  }
                }, 0);
              } else if (sessionRef.current) {
                const sendResumeWhenQuiet = async () => {
                  if (!sessionRef.current) return;
                  const isPlumbingResume = verticalRef.current === "plumbers";
                  if (isPlumbingResume) {
                    playerRef.current?.hardStop();
                  } else if (playerRef.current?.isPlaying()) {
                    void playerRef.current.whenPlaybackIdle(30_000).then(sendResumeWhenQuiet);
                    return;
                  }
                  flushPendingToolResponses(sessionRef.current);
                  let plumbingJob:
                    | {
                        status?: string;
                        serviceType?: string | null;
                        serviceAddress?: string | null;
                        customerEmail?: string | null;
                        appointmentDate?: string | null;
                        timeWindow?: string | null;
                      }
                    | null
                    | undefined;
                  let nameOnFile = savedNameRef.current.trim() || undefined;
                  if (verticalRef.current === "plumbers") {
                    try {
                      const statusRes = await fetch("/api/voice-demo/status");
                      const statusData = (await statusRes.json()) as {
                        plumbingJob?: typeof plumbingJob;
                        fullName?: string | null;
                      };
                      plumbingJob = statusData.plumbingJob ?? null;
                      const name = statusData.fullName?.trim();
                      if (name) {
                        savedNameRef.current = name;
                        nameOnFile = name;
                      }
                    } catch {
                      plumbingJob = null;
                    }
                  }
                  if (sessionRef.current) {
                    const midBooking =
                      Boolean(plumbingJob?.serviceAddress) ||
                      Boolean(plumbingJob?.appointmentDate) ||
                      Boolean(plumbingJob?.customerEmail) ||
                      Boolean(nameOnFile);
                    const nudgeCooldownOk =
                      midBooking ||
                      Date.now() - lastResumeNudgeAtRef.current >= RESUME_NUDGE_COOLDOWN_MS;
                    if (nudgeCooldownOk) {
                      lastResumeNudgeAtRef.current = Date.now();
                      sendSessionResumeNudge(sessionRef.current, plumbingJob, nameOnFile);
                    }
                  }
                };
                setTimeout(() => {
                  void sendResumeWhenQuiet();
                }, 0);
              }
              micRef.current?.stop();
              if (micStreamRef.current) {
                micRef.current = startVoiceDemoMic(micStreamRef.current, (base64) => {
                  if (!canSendVoiceDemoRealtimeInput(toolInFlightRef.current)) return;
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
              handleMessageChainRef.current = handleMessageChainRef.current
                .then(() => handleMessage(msg as LiveMessage))
                .catch((err) => {
                  console.warn("[voice-demo-live] handleMessage", err);
                });
            },
            onerror: (e) => {
              console.warn("[voice-demo-live]", e);
              const durationMs = Date.now() - connectedAtRef.current;
              logVoiceDemoOps({
                kind: "session_anomaly",
                message: "Live session error - scheduling reconnect",
                severity: "warn",
                meta: { durationMs },
              });
              if (!farewellDisconnectingRef.current && !intentionalDisconnectRef.current) {
                setConnecting(true);
                optionsRef.current.onStatus?.("Connection refreshing - one moment…");
                requestLiveReconnect("websocket_error", { durationMs });
              } else {
              setError("Voice connection error.");
              }
            },
            onclose: () => {
              const intentional =
                intentionalDisconnectRef.current || farewellDisconnectingRef.current;
              if (!intentional) {
                setConnecting(true);
                optionsRef.current.onStatus?.("Connection refreshing - one moment…");
                const durationMs = Date.now() - connectedAtRef.current;
                logVoiceDemoOps({
                  kind: "session_anomaly",
                  message: "Live WebSocket closed unexpectedly",
                  severity: "warn",
                  meta: {
                    durationMs,
                    hasHandle: Boolean(sessionResumptionHandleRef.current),
                    attempt: reconnectAttemptRef.current,
                  },
                });
                requestLiveReconnect("websocket_close", { durationMs });
              } else {
                stopOrbLoop();
                setConnecting(false);
              }
              setConnected(false);
              intentionalDisconnectRef.current = false;
            },
          },
        });

        sessionRef.current = session;
      } catch (err) {
        console.warn("[voice-demo-live] connect", err);
        reconnectingRef.current = false;
        if (!resume) {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
        }
        const detail = err instanceof Error ? err.message : String(err);
        const message =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Microphone blocked. Allow mic access in your browser, then tap Start voice again."
            : err instanceof Error && err.message.includes("not supported")
              ? err.message
              : detail && detail.length < 120
                ? detail
              : "Could not connect to voice assistant.";
        logVoiceDemoOps({
          kind: "session_anomaly",
          message: "Live connect failed",
          severity: "warn",
          meta: { resume, detail: detail.slice(0, 240) },
        });
        if (resume) {
          scheduleLiveReconnect("connect_failed", { detail: detail.slice(0, 120) });
        } else {
        setError(message);
        setConnecting(false);
        }
      }
    },
    [
      clearPendingFallback,
      clearPhoneCollectionState,
      disconnect,
      handleMessage,
      clearReconnectTimer,
      requestLiveReconnect,
      scheduleLiveReconnect,
      sendOpeningGreeting,
      sendSessionResumeNudge,
      flushPendingToolResponses,
      startOrbLoop,
      stopOrbLoop,
    ]
  );

  const connectRef = useRef(connect);
  connectRef.current = connect;

  const transitionToDemo = useCallback(async () => {
    optionsRef.current.onPhaseTransition?.({ kind: "verified", nextMode: "demo" });
    await disconnectGraceful();
    await sleep(RECONNECT_DELAY_MS);
    await connect("demo");
  }, [connect, disconnectGraceful]);

  const disconnectAndReset = useCallback(() => {
    hadPlumbingLiveSessionRef.current = false;
    sessionResumptionHandleRef.current = null;
    sessionResumableRef.current = true;
    callWindingDownRef.current = false;
    awaitingPromoConsentRef.current = false;
    reconnectPausedRef.current = false;
    reconnectAttemptRef.current = 0;
    reconnectExhaustedBonusRef.current = false;
    connectInFlightWaitsRef.current = 0;
    lastReconnectRequestAtRef.current = 0;
    lastResumeNudgeAtRef.current = 0;
    disconnect(true);
  }, [disconnect]);

  return {
    connect,
    disconnect: () => disconnect(true),
    endCall,
    disconnectAndReset,
    disconnectGraceful,
    transitionToDemo,
    connecting,
    connected,
    error,
    jarvisLevels,
    jarvisSpeaking,
    micMuted,
    endCallGlow,
    toggleMicMute,
    setMicMuted: setMicMutedState,
  };
}
