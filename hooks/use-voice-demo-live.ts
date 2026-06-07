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
  VOICE_DEMO_LIVE_MODEL,
  VOICE_DEMO_MIC_MUTE_DISCONNECT_MS,
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
  isAssistantExplicitGoodbye,
  isUserExplicitlyDone,
  isUserFarewellEcho,
  shouldClientScheduleFarewellHangup,
} from "@/lib/voice-demo-farewell";
import {
  createVoiceDemoNudgeQueue,
  enqueueVoiceDemoClientNudge,
  flushVoiceDemoClientNudgeQueue,
  sendVoiceDemoClientNudge,
  type VoiceDemoClientNudgeOpts,
} from "@/lib/voice-demo-client-nudge";
import {
  canClientScheduleHangup,
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
  buildPhonePauseNudge,
  PHONE_SILENCE_NUDGE_MS,
} from "@/lib/voice-demo-phone-nudge";
import {
  buildCloseQueueSkipToWrapUpNudge,
  buildPromoBlockedBeforeCloseQueueNudge,
  buildPromoDeclinedWrapUpNudge,
  buildWeatherForecastCoolReactionNudge,
  buildWeatherImplementAskNudge,
  buildWeatherPromoAskNudge,
  isAssistantImplementAsk,
  isAssistantWeatherCoolReaction,
  isCloseQueueAffirmative,
  isCloseQueueInterest,
  isCloseQueueNegative,
  type CloseQueuePhase,
} from "@/lib/voice-demo-close-queue";
import {
  buildWeatherLookupFailedNudge,
  buildWeatherLookupSpeakNudge,
  isAssistantWeatherForecast,
  isAssistantWeatherLookupPending,
  WEATHER_POST_CONFIRM_PAUSE_MS,
  WEATHER_POST_FORECAST_GOODBYE_PAUSE_MS,
} from "@/lib/voice-demo-weather";
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
import {
  assistantZipReadBackMissingStagedCity,
  isAssistantPromoAsk,
  shouldBlockPromoOffer,
  shouldStageWeatherZipFromUserInput,
  shouldSuppressAssistantAudioDuringWeather,
  isAssistantWeatherOfferPrompt,
  isAssistantZipCollectionPrompt,
  isAssistantZipReadBackPrompt,
  isWeatherDemoIncomplete,
  isWeatherZipFlowActive,
  shouldBlockClientFarewellHangup,
  WEATHER_CLIENT_NUDGE_COOLDOWN_MS,
} from "@/lib/voice-demo-weather-flow";
import { normalizeSpokenUsZipCode, normalizeUsZipCode } from "@/lib/voice-demo-weather";
import {
  buildPromoBlockedDuringZipConfirmNudge,
  buildPromoBlockedDuringWeatherNudge,
  buildZipOnlyAfterAmbiguousYesNudge,
  buildWeatherAcceptZipNudge,
  buildWeatherDeclineNudge,
  buildWeatherYesNoGiveUpNudge,
  buildWeatherYesNoPauseNudge,
  buildWeatherZipPrematureGoodbyeRecoveryNudge,
  buildWeatherZipWrapUpBlockedNudge,
  buildZipCityCorrectionNudge,
  buildZipPauseNudge,
  buildZipSilenceGiveUpNudge,
  buildZipSilenceRepeatNudge,
  buildZipStagedSpeakNudge,
  countSpokenZipDigits,
  isWeatherOfferAccept,
  isWeatherOfferDecline,
  isWeatherZipConfirmAccept,
  isWeatherZipConfirmDecline,
  isUserWeatherZipReminder,
  WEATHER_YESNO_SILENCE_NUDGE_MS,
  ZIP_SILENCE_NUDGE_MS,
  ZIP_STAGING_WATCHDOG_MS,
} from "@/lib/voice-demo-zip-nudge";
import {
  seedOnboardingFromFullName,
  TOOL_BLOCKED_CONFIRM_WEATHER_ZIP,
  TOOL_BLOCKED_LOOKUP_WEATHER,
  TOOL_BLOCKED_PROMO_WEATHER,
} from "@/lib/voice-demo-flow-policy";
import { logVoiceDemoOps } from "@/lib/voice-demo-ops-client";
import {
  detectZipCityDrift,
  shouldInterruptZipCityDrift,
  type StagedZipReadback,
} from "@/lib/voice-demo-ops";
import type { Session } from "@google/genai";

export type VoiceDemoLiveMode = "verify" | "demo";

type WeatherYesNoPhase = "first" | "repeat";
type ZipSilencePhase = "listening" | "repeat";

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
/** Wait for long FAQ answers to finish before farewell disconnect. */
const FAREWELL_PLAYBACK_MAX_WAIT_MS = 120_000;
const PHASE_MIN_SPOKEN_MS = 1800;
const MAX_RECONNECT_ATTEMPTS = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useVoiceDemoLive(options: UseVoiceDemoLiveOptions = {}) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [jarvisLevels, setJarvisLevels] = useState<JarvisAudioLevels>(JARVIS_AUDIO_IDLE);
  const [jarvisSpeaking, setJarvisSpeaking] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

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
  const zipSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zipStagingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const weatherYesNoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitingZipDigitsRef = useRef(false);
  const awaitingZipConfirmRef = useRef(false);
  const awaitingWeatherYesNoRef = useRef(false);
  const zipNudgeTranscriptRef = useRef("");
  const weatherYesNoPhaseRef = useRef<WeatherYesNoPhase>("first");
  const wrapUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitingWeatherForecastDeliveryRef = useRef(false);
  const zipSilenceNudgedRef = useRef(false);
  const zipSilencePhaseRef = useRef<ZipSilencePhase>("listening");
  const zipDigitsHeardMaxRef = useRef(0);
  const visitorAskedSubstantiveQuestionRef = useRef(false);
  const lastClientWeatherNudgeAtRef = useRef(0);
  const lastWeatherOfferSigRef = useRef("");
  const lastZipPromptSigRef = useRef("");
  const finishingPhaseRef = useRef(false);
  const jarvisFarewellSentRef = useRef(false);
  const goodbyeNudgeSentRef = useRef(false);
  const farewellHoldSentRef = useRef(false);
  const farewellDisconnectingRef = useRef(false);
  const pendingClientHangupRef = useRef(false);
  const hangupReasonRef = useRef<VoiceDemoHangupReason | null>(null);
  const weatherDemoAcceptedRef = useRef(false);
  const promoWeatherNudgeSentRef = useRef(false);
  const suppressPromoAudioDuringWeatherRef = useRef(false);
  const micMuteDisconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAssistantTextRef = useRef("");
  const stagedZipReadbackRef = useRef<StagedZipReadback | null>(null);
  const zipCityCorrectionSentRef = useRef(false);
  const zipLookupTriggeredRef = useRef(false);
  const weatherForecastGoodbyeScheduledRef = useRef(false);
  const weatherForecastCompleteRef = useRef(false);
  const lastUserWeatherZipRef = useRef<string | null>(null);
  const closeQueuePhaseRef = useRef<CloseQueuePhase>("idle");
  const wrapUpQuestionIndexRef = useRef(0);
  const wrapUpCueLeakRecoverySentRef = useRef(false);
  const captionRoleRef = useRef<VoiceDemoCaptionRole | null>(null);
  const captionTextRef = useRef("");
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
      triggerVoiceDemoOpening(session);
    } catch (err) {
      console.warn("[voice-demo-live] opening trigger", err);
      greetingSentRef.current = false;
    }
  }, []);

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
      awaitingWeatherYesNo: awaitingWeatherYesNoRef.current,
      awaitingZipDigits: awaitingZipDigitsRef.current,
      awaitingZipConfirm: awaitingZipConfirmRef.current,
      awaitingWeatherForecastDelivery: awaitingWeatherForecastDeliveryRef.current,
      closeQueuePhase: closeQueuePhaseRef.current,
      jarvisFarewellSent: jarvisFarewellSentRef.current,
      goodbyeNudgeSent: goodbyeNudgeSentRef.current,
      wrapUpTimerActive: wrapUpTimerRef.current !== null,
      farewellDisconnecting: farewellDisconnectingRef.current,
      visitorExplicitlyDone: visitorExplicitlyDoneRef.current,
    });
  }, []);

  const scheduleLiveReconnect = useCallback(
    (reason: string, meta?: Record<string, unknown>) => {
      if (farewellDisconnectingRef.current || finishingPhaseRef.current) return;
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        reconnectingRef.current = false;
        setConnecting(false);
        setConnected(false);
        stopOrbLoop();
        hangupReasonRef.current = "reconnect_exhausted";
        logVoiceDemoOps({
          kind: "client_hangup_scheduled",
          message: "Live reconnect attempts exhausted",
          severity: "warn",
          meta: { phase: getSessionPhase(), hangupReason: "reconnect_exhausted", reason },
        });
        optionsRef.current.onUnexpectedClose?.();
        return;
      }
      if (reconnectScheduledRef.current) return;
      reconnectScheduledRef.current = true;
      setConnecting(true);
      optionsRef.current.onStatus?.("Connection refreshing — one moment…");
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
      reconnectTimerRef.current = setTimeout(() => {
        reconnectScheduledRef.current = false;
        reconnectTimerRef.current = null;
        if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) return;
        if (reconnectingRef.current) return;
        reconnectAttemptRef.current += 1;
        void connectRef.current(modeRef.current, { resume: true });
      }, RECONNECT_DELAY_MS);
    },
    [getSessionPhase, stopOrbLoop]
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
        ? "Post-name help-only nudge — salutation spoken without help line"
        : "Post-name greeting nudge — model idle after save_name",
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
    (session: Session) => {
      void sendVoiceDemoClientNudge(
        session,
        playerRef.current,
        buildSessionResumeNudge({
          nameOnFile: savedNameRef.current || undefined,
          nameSavedThisSession: postNameLineSpokenRef.current,
          weatherForecastInProgress:
            zipLookupTriggeredRef.current ||
            awaitingWeatherForecastDeliveryRef.current,
        })
      ).catch((err) => {
        console.warn("[voice-demo-live] session resume nudge", err);
      });
    },
    []
  );

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

  const clearZipSilenceTimer = useCallback(() => {
    if (zipSilenceTimerRef.current) {
      clearTimeout(zipSilenceTimerRef.current);
      zipSilenceTimerRef.current = null;
    }
  }, []);

  const clearZipStagingWatchdog = useCallback(() => {
    if (zipStagingWatchdogRef.current) {
      clearTimeout(zipStagingWatchdogRef.current);
      zipStagingWatchdogRef.current = null;
    }
  }, []);

  const clearWeatherYesNoTimer = useCallback(() => {
    if (weatherYesNoTimerRef.current) {
      clearTimeout(weatherYesNoTimerRef.current);
      weatherYesNoTimerRef.current = null;
    }
  }, []);

  const clearWrapUpTimer = useCallback(() => {
    if (wrapUpTimerRef.current) {
      clearTimeout(wrapUpTimerRef.current);
      wrapUpTimerRef.current = null;
    }
  }, []);

  const clearWeatherZipState = useCallback(() => {
    awaitingZipDigitsRef.current = false;
    awaitingZipConfirmRef.current = false;
    awaitingWeatherYesNoRef.current = false;
    zipNudgeTranscriptRef.current = "";
    zipSilenceNudgedRef.current = false;
    zipSilencePhaseRef.current = "listening";
    zipDigitsHeardMaxRef.current = 0;
    lastWeatherOfferSigRef.current = "";
    lastZipPromptSigRef.current = "";
    weatherYesNoPhaseRef.current = "first";
    stagedZipReadbackRef.current = null;
    zipCityCorrectionSentRef.current = false;
    zipLookupTriggeredRef.current = false;
    weatherForecastGoodbyeScheduledRef.current = false;
    weatherForecastCompleteRef.current = false;
    lastUserWeatherZipRef.current = null;
    closeQueuePhaseRef.current = "idle";
    weatherDemoAcceptedRef.current = false;
    promoWeatherNudgeSentRef.current = false;
    suppressPromoAudioDuringWeatherRef.current = false;
    clearZipSilenceTimer();
    clearZipStagingWatchdog();
    clearWeatherYesNoTimer();
  }, [clearWeatherYesNoTimer, clearZipSilenceTimer, clearZipStagingWatchdog]);

  const getWeatherZipFlowRefs = useCallback(
    () => ({
      awaitingWeatherYesNo: awaitingWeatherYesNoRef.current,
      awaitingZipDigits: awaitingZipDigitsRef.current,
      awaitingZipConfirm: awaitingZipConfirmRef.current,
      awaitingWeatherForecastDelivery: awaitingWeatherForecastDeliveryRef.current,
      zipDigitsHeardMax: zipDigitsHeardMaxRef.current,
      weatherDemoAccepted: weatherDemoAcceptedRef.current,
    }),
    []
  );

  const getWeatherDemoProgress = useCallback(
    () => ({
      ...getWeatherZipFlowRefs(),
      stagedZipPending: Boolean(stagedZipReadbackRef.current),
      zipLookupTriggered: zipLookupTriggeredRef.current,
      forecastComplete: weatherForecastCompleteRef.current,
      closeQueuePhase: closeQueuePhaseRef.current,
    }),
    [getWeatherZipFlowRefs]
  );

  const isInWeatherZipFlow = useCallback(() => {
    return isWeatherZipFlowActive(getWeatherZipFlowRefs());
  }, [getWeatherZipFlowRefs]);

  const weatherDemoStillIncomplete = useCallback(() => {
    return isWeatherDemoIncomplete(getWeatherDemoProgress());
  }, [getWeatherDemoProgress]);

  const isCollectingWeatherZip = useCallback(() => {
    return (
      awaitingZipDigitsRef.current ||
      (weatherDemoAcceptedRef.current &&
        !awaitingZipConfirmRef.current &&
        !zipLookupTriggeredRef.current &&
        !awaitingWeatherForecastDeliveryRef.current)
    );
  }, []);

  const shouldBlockFarewellHangup = useCallback(() => {
    return shouldBlockClientFarewellHangup({
      goodbyeNudgeSent: goodbyeNudgeSentRef.current,
      progress: getWeatherDemoProgress(),
    });
  }, [getWeatherDemoProgress]);

  const stagedZipFromToolResult = useCallback(
    (result: Record<string, unknown>): StagedZipReadback | null => {
      if (result.ok !== true) return null;
      const spokenConfirm =
        typeof result.spokenConfirm === "string" ? result.spokenConfirm.trim() : "";
      const city = typeof result.city === "string" ? result.city.trim() : "";
      const zip = typeof result.zip === "string" ? result.zip.trim() : "";
      if (!spokenConfirm || !city || !zip) return null;
      return { zip, city, spokenConfirm };
    },
    []
  );

  const rememberStagedZipReadback = useCallback(
    (staged: StagedZipReadback, source: "client" | "tool") => {
      stagedZipReadbackRef.current = staged;
      zipCityCorrectionSentRef.current = false;
      zipLookupTriggeredRef.current = false;
      logVoiceDemoOps({
        kind: "zip_confirm_staged",
        message: `ZIP ${staged.zip} staged (${staged.city}) via ${source}`,
        meta: { zip: staged.zip, city: staged.city, source },
      });
    },
    []
  );

  const canSendClientWeatherNudge = useCallback(() => {
    return Date.now() - lastClientWeatherNudgeAtRef.current >= WEATHER_CLIENT_NUDGE_COOLDOWN_MS;
  }, []);

  const markClientWeatherNudgeSent = useCallback(() => {
    lastClientWeatherNudgeAtRef.current = Date.now();
  }, []);

  const runTool = useCallback(async (name: string, args: Record<string, unknown>) => {
    const res = await fetch("/api/voice-demo/tool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, args, mode: modeRef.current }),
    });
    const data = (await res.json()) as { result?: Record<string, unknown> };
    return data.result ?? { ok: false, error: "Tool failed" };
  }, []);

  const sendClientNudge = useCallback(
    async (turns: string | string[], opts?: VoiceDemoClientNudgeOpts) => {
      const session = sessionRef.current;
      if (!session) return false;
      if (playerRef.current?.isPlaying() && !opts?.hardStop) {
        enqueueVoiceDemoClientNudge(clientNudgeQueueRef.current, turns, opts);
        return true;
      }
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
    clearZipSilenceTimer();
    clearZipStagingWatchdog();
    clearWeatherYesNoTimer();
    clearWrapUpTimer();
  }, [
    clearPhoneSilenceTimer,
    clearWeatherYesNoTimer,
    clearWrapUpTimer,
    clearZipSilenceTimer,
    clearZipStagingWatchdog,
  ]);

  const handleAssistantInterrupted = useCallback(() => {
    suppressAssistantAudioRef.current = true;
    playerRef.current?.hardStop();
    lastAssistantTextRef.current = "";
    clearInputSilenceTimers();
  }, [clearInputSilenceTimers]);

  const isFarewellLocked = useCallback(() => {
    return (
      jarvisFarewellSentRef.current ||
      farewellDisconnectingRef.current ||
      goodbyeNudgeSentRef.current
    );
  }, []);

  const scheduleZipStagingWatchdog = useCallback(() => {
    clearZipStagingWatchdog();
    zipStagingWatchdogRef.current = setTimeout(() => {
      const staged = stagedZipReadbackRef.current;
      if (!staged || zipLookupTriggeredRef.current || !awaitingZipConfirmRef.current) {
        return;
      }
      if (playerRef.current?.isPlaying()) return;
      const session = sessionRef.current;
      if (!session || isFarewellLocked()) return;
      markClientWeatherNudgeSent();
      logVoiceDemoOps({
        kind: "zip_confirm_staged",
        message: "ZIP staging watchdog — no read-back heard within 8s",
        severity: "warn",
        meta: { zip: staged.zip, city: staged.city },
      });
      try {
        void sendClientNudge(buildZipStagedSpeakNudge(staged.spokenConfirm));
      } catch (err) {
        console.warn("[voice-demo-live] zip staging watchdog nudge", err);
      }
    }, ZIP_STAGING_WATCHDOG_MS);
  }, [clearZipStagingWatchdog, isFarewellLocked, markClientWeatherNudgeSent]);

  const sendZipCityCorrection = useCallback(
    (message: string, selfCorrected: boolean, heardCity: string | null) => {
      const session = sessionRef.current;
      const staged = stagedZipReadbackRef.current;
      if (!session || !staged || zipCityCorrectionSentRef.current || isFarewellLocked()) {
        return;
      }

      zipCityCorrectionSentRef.current = true;
      logVoiceDemoOps({
        kind: selfCorrected ? "zip_city_self_correction" : "zip_city_drift",
        message,
        meta: {
          zip: staged.zip,
          expectedCity: staged.city,
          heardCity,
          assistantSnippet: lastAssistantTextRef.current.slice(0, 240),
        },
      });

      markClientWeatherNudgeSent();
      try {
        void sendClientNudge(buildZipCityCorrectionNudge(staged.spokenConfirm), {
          hardStop: true,
        });
        logVoiceDemoOps({
          kind: "zip_city_correction_sent",
          message: `Correction nudge sent for ZIP ${staged.zip}`,
          meta: { zip: staged.zip, expectedCity: staged.city },
        });
      } catch (err) {
        console.warn("[voice-demo-live] zip city correction nudge", err);
        zipCityCorrectionSentRef.current = false;
      }
    },
    [isFarewellLocked, markClientWeatherNudgeSent]
  );

  const sendZipDigitConfirmNudge = useCallback(
    async (transcript: string): Promise<boolean> => {
      const session = sessionRef.current;
      const trimmed = transcript.trim();
      if (isFarewellLocked()) return false;
      if (!session || !trimmed || awaitingZipConfirmRef.current) return false;
      if (zipNudgeTranscriptRef.current === trimmed) return false;

      const zip = normalizeSpokenUsZipCode(trimmed);
      if (playerRef.current?.isPlaying()) {
        if (!zip) return false;
        playerRef.current.hardStop();
      }
      let turns: string;

      if (zip) {
        optionsRef.current.onStatus?.(`Confirming ZIP ${zip}…`);
        const result = await runTool("confirm_weather_zip", { zipCode: zip });
        if (result.ok !== true) {
          const partialNudge = buildZipPauseNudge(trimmed);
          if (!partialNudge) return false;
          turns = partialNudge;
        } else {
          const staged = stagedZipFromToolResult(result);
          if (!staged) return false;
          rememberStagedZipReadback(staged, "client");
          awaitingZipDigitsRef.current = false;
          awaitingZipConfirmRef.current = true;
          zipSilenceNudgedRef.current = true;
          clearZipSilenceTimer();
          turns = buildZipStagedSpeakNudge(staged.spokenConfirm);
        }
      } else {
        const nudge = buildZipPauseNudge(trimmed);
        if (!nudge) return false;
        turns = nudge;
      }

      zipNudgeTranscriptRef.current = trimmed;
      markClientWeatherNudgeSent();
      suppressPromoAudioDuringWeatherRef.current = false;
      try {
        const sent = await sendClientNudge(turns);
        if (!sent) throw new Error("nudge not sent");
        if (zip && stagedZipReadbackRef.current) {
          scheduleZipStagingWatchdog();
        }
        return true;
      } catch (err) {
        console.warn("[voice-demo-live] zip digit confirm nudge", err);
        zipNudgeTranscriptRef.current = "";
        if (zip) {
          awaitingZipDigitsRef.current = true;
          awaitingZipConfirmRef.current = false;
        }
        return false;
      }
    },
    [
      clearZipSilenceTimer,
      isFarewellLocked,
      markClientWeatherNudgeSent,
      rememberStagedZipReadback,
      runTool,
      scheduleZipStagingWatchdog,
      stagedZipFromToolResult,
    ]
  );

  const sendWeatherZipPrematureGoodbyeRecovery = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isFarewellLocked()) return;

    const transcript = captionTextRef.current.trim();
    if (
      awaitingZipDigitsRef.current &&
      !awaitingZipConfirmRef.current &&
      normalizeSpokenUsZipCode(transcript)
    ) {
      void sendZipDigitConfirmNudge(transcript);
      return;
    }

    logVoiceDemoOps({
      kind: "session_anomaly",
      message: "Blocked premature goodbye during weather ZIP flow — recovery nudge sent",
      severity: "warn",
      meta: {
        awaitingZipDigits: awaitingZipDigitsRef.current,
        awaitingZipConfirm: awaitingZipConfirmRef.current,
        zipDigitsHeardMax: zipDigitsHeardMaxRef.current,
      },
    });

    try {
      void sendClientNudge(buildWeatherZipPrematureGoodbyeRecoveryNudge());
    } catch (err) {
      console.warn("[voice-demo-live] zip premature goodbye recovery", err);
    }
  }, [isFarewellLocked, sendZipDigitConfirmNudge]);

  const sendZipSilenceNudge = useCallback(() => {
    const session = sessionRef.current;
    const transcript = captionTextRef.current.trim();
    if (isFarewellLocked()) return;
    if (!session || !awaitingZipDigitsRef.current || awaitingZipConfirmRef.current) return;
    if (zipSilenceNudgedRef.current) return;
    if (!canSendClientWeatherNudge()) return;
    if (playerRef.current?.isPlaying()) {
      clearZipSilenceTimer();
      zipSilenceTimerRef.current = setTimeout(() => {
        sendZipSilenceNudge();
      }, 400);
      return;
    }

    if (transcript) {
      void sendZipDigitConfirmNudge(transcript);
      return;
    }

    if (
      zipDigitsHeardMaxRef.current > 0 ||
      countSpokenZipDigits(captionTextRef.current) > 0
    ) {
      zipSilencePhaseRef.current = "listening";
      clearZipSilenceTimer();
      zipSilenceTimerRef.current = setTimeout(() => {
        sendZipSilenceNudge();
      }, ZIP_SILENCE_NUDGE_MS);
      return;
    }

    if (zipSilencePhaseRef.current === "listening") {
      zipSilencePhaseRef.current = "repeat";
      clearWeatherYesNoTimer();
      awaitingWeatherYesNoRef.current = false;
      markClientWeatherNudgeSent();
      try {
        void sendClientNudge(buildZipSilenceRepeatNudge());
      } catch (err) {
        console.warn("[voice-demo-live] zip silence repeat nudge", err);
        zipSilencePhaseRef.current = "listening";
        return;
      }
      void (async () => {
        await playerRef.current?.whenPlaybackIdle(10000);
        if (!awaitingZipDigitsRef.current || awaitingZipConfirmRef.current) return;
        if (zipSilencePhaseRef.current !== "repeat") return;
        clearZipSilenceTimer();
        zipSilenceTimerRef.current = setTimeout(() => {
          sendZipSilenceNudge();
        }, ZIP_SILENCE_NUDGE_MS);
      })();
      return;
    }

    awaitingZipDigitsRef.current = false;
    zipSilencePhaseRef.current = "listening";
    goodbyeNudgeSentRef.current = true;
    markClientWeatherNudgeSent();
    try {
      void sendClientNudge(buildZipSilenceGiveUpNudge());
    } catch (err) {
      console.warn("[voice-demo-live] zip silence give-up", err);
      awaitingZipDigitsRef.current = true;
      zipSilencePhaseRef.current = "repeat";
    }
  }, [
    canSendClientWeatherNudge,
    clearWeatherYesNoTimer,
    clearZipSilenceTimer,
    isFarewellLocked,
    markClientWeatherNudgeSent,
    sendZipDigitConfirmNudge,
  ]);

  const scheduleZipSilenceNudge = useCallback(() => {
    if (!awaitingZipDigitsRef.current || modeRef.current !== "demo") return;
    if (awaitingZipConfirmRef.current || zipSilenceNudgedRef.current) return;
    if (playerRef.current?.isPlaying()) return;
    clearZipSilenceTimer();
    zipSilenceTimerRef.current = setTimeout(() => {
      sendZipSilenceNudge();
    }, ZIP_SILENCE_NUDGE_MS);
  }, [clearZipSilenceTimer, sendZipSilenceNudge]);

  const scheduleZipSilenceAfterIdle = useCallback(async () => {
    if (!awaitingZipDigitsRef.current || modeRef.current !== "demo") return;
    if (awaitingZipConfirmRef.current || zipSilenceNudgedRef.current) return;
    await playerRef.current?.whenPlaybackIdle(10000);
    if (!awaitingZipDigitsRef.current || awaitingZipConfirmRef.current) return;
    if (zipSilenceNudgedRef.current) return;

    const transcript = captionTextRef.current.trim();
    const zip = normalizeUsZipCode(transcript);
    if (zip) {
      void sendZipDigitConfirmNudge(transcript);
      return;
    }
    if (countSpokenZipDigits(transcript) > 0) {
      scheduleZipSilenceNudge();
      return;
    }
    scheduleZipSilenceNudge();
  }, [scheduleZipSilenceNudge, sendZipDigitConfirmNudge]);

  const sendWeatherYesNoNudge = useCallback(() => {
    const session = sessionRef.current;
    if (isFarewellLocked()) return;
    if (!session || !awaitingWeatherYesNoRef.current) return;
    if (awaitingZipDigitsRef.current || awaitingZipConfirmRef.current) return;
    if (!canSendClientWeatherNudge()) return;
    if (playerRef.current?.isPlaying()) {
      clearWeatherYesNoTimer();
      weatherYesNoTimerRef.current = setTimeout(() => {
        sendWeatherYesNoNudge();
      }, 400);
      return;
    }

    if (weatherYesNoPhaseRef.current === "first") {
      weatherYesNoPhaseRef.current = "repeat";
      markClientWeatherNudgeSent();
      try {
        void sendClientNudge(buildWeatherYesNoPauseNudge());
      } catch (err) {
        console.warn("[voice-demo-live] weather yes/no nudge", err);
        weatherYesNoPhaseRef.current = "first";
      }
      return;
    }

    clearWeatherYesNoTimer();
    awaitingWeatherYesNoRef.current = false;
    goodbyeNudgeSentRef.current = true;
    markClientWeatherNudgeSent();
    try {
      void sendClientNudge(buildWeatherYesNoGiveUpNudge());
    } catch (err) {
      console.warn("[voice-demo-live] weather yes/no give-up", err);
      awaitingWeatherYesNoRef.current = true;
    }
  }, [canSendClientWeatherNudge, clearWeatherYesNoTimer, isFarewellLocked, markClientWeatherNudgeSent]);

  const scheduleWeatherYesNoNudge = useCallback(() => {
    if (!awaitingWeatherYesNoRef.current || modeRef.current !== "demo") return;
    if (awaitingZipDigitsRef.current || awaitingZipConfirmRef.current) return;
    clearWeatherYesNoTimer();
    weatherYesNoTimerRef.current = setTimeout(() => {
      sendWeatherYesNoNudge();
    }, WEATHER_YESNO_SILENCE_NUDGE_MS);
  }, [clearWeatherYesNoTimer, sendWeatherYesNoNudge]);

  const scheduleWeatherYesNoAfterIdle = useCallback(async () => {
    if (!awaitingWeatherYesNoRef.current || modeRef.current !== "demo") return;
    await playerRef.current?.whenPlaybackIdle(10000);
    if (!awaitingWeatherYesNoRef.current) return;
    if (awaitingZipDigitsRef.current || awaitingZipConfirmRef.current) return;
    scheduleWeatherYesNoNudge();
  }, [scheduleWeatherYesNoNudge]);

  const sendWeatherCoolReactionNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || modeRef.current !== "demo") return;
    if (isFarewellLocked()) return;
    if (playerRef.current?.isPlaying()) {
      clearWrapUpTimer();
      wrapUpTimerRef.current = setTimeout(() => {
        sendWeatherCoolReactionNudge();
      }, 400);
      return;
    }

    markClientWeatherNudgeSent();
    try {
      void sendClientNudge(buildWeatherForecastCoolReactionNudge());
    } catch (err) {
      console.warn("[voice-demo-live] weather cool reaction nudge", err);
    }
  }, [clearWrapUpTimer, isFarewellLocked, markClientWeatherNudgeSent]);

  const scheduleWeatherCloseQueueStart = useCallback(() => {
    if (modeRef.current !== "demo" || isFarewellLocked()) return;
    if (weatherForecastGoodbyeScheduledRef.current) return;
    weatherForecastGoodbyeScheduledRef.current = true;
    clearWrapUpTimer();
    void (async () => {
      try {
        await playerRef.current?.whenPlaybackIdle(20000);
        await sleep(WEATHER_POST_FORECAST_GOODBYE_PAUSE_MS);
        if (modeRef.current !== "demo" || isFarewellLocked()) return;
        sendWeatherCoolReactionNudge();
      } finally {
        weatherForecastGoodbyeScheduledRef.current = false;
      }
    })();
  }, [clearWrapUpTimer, isFarewellLocked, sendWeatherCoolReactionNudge]);

  const sendCloseQueueImplementAskNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isFarewellLocked()) return;
    closeQueuePhaseRef.current = "awaiting_implement_interest";
    markClientWeatherNudgeSent();
    try {
      void sendClientNudge(buildWeatherImplementAskNudge());
    } catch (err) {
      console.warn("[voice-demo-live] close queue implement nudge", err);
    }
  }, [isFarewellLocked, markClientWeatherNudgeSent]);

  const sendCloseQueuePromoAskNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isFarewellLocked()) return;
    closeQueuePhaseRef.current = "awaiting_promo_consent";
    promoWeatherNudgeSentRef.current = false;
    markClientWeatherNudgeSent();
    try {
      void sendClientNudge(buildWeatherPromoAskNudge());
    } catch (err) {
      console.warn("[voice-demo-live] close queue promo nudge", err);
    }
  }, [isFarewellLocked, markClientWeatherNudgeSent]);

  const sendCloseQueueSkipToWrapUp = useCallback(
    (reason: string) => {
      const session = sessionRef.current;
      if (!session || isFarewellLocked()) return;
      closeQueuePhaseRef.current = "skipped_to_wrapup";
      markClientWeatherNudgeSent();
      try {
        void sendClientNudge(buildCloseQueueSkipToWrapUpNudge(reason));
      } catch (err) {
        console.warn("[voice-demo-live] close queue skip wrap-up", err);
      }
    },
    [isFarewellLocked, markClientWeatherNudgeSent]
  );

  const sendCloseQueuePromoDeclinedWrapUp = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isFarewellLocked()) return;
    closeQueuePhaseRef.current = "skipped_to_wrapup";
    markClientWeatherNudgeSent();
    try {
      void sendClientNudge(buildPromoDeclinedWrapUpNudge());
    } catch (err) {
      console.warn("[voice-demo-live] promo declined wrap-up", err);
    }
  }, [isFarewellLocked, markClientWeatherNudgeSent]);

  const detectCloseQueuePrompt = useCallback((assistantText: string) => {
    const trimmed = assistantText.trim();
    if (!trimmed) return;

    if (isAssistantWeatherCoolReaction(trimmed)) {
      closeQueuePhaseRef.current = "awaiting_cool_reaction";
      return;
    }
    if (isAssistantImplementAsk(trimmed)) {
      closeQueuePhaseRef.current = "awaiting_implement_interest";
      return;
    }
    if (isAssistantPromoAsk(trimmed) && weatherForecastCompleteRef.current) {
      closeQueuePhaseRef.current = "awaiting_promo_consent";
    }
  }, []);

  const sendWrapUpCueLeakRecovery = useCallback(() => {
    const session = sessionRef.current;
    if (!session || modeRef.current !== "demo" || isFarewellLocked()) return;
    if (wrapUpCueLeakRecoverySentRef.current) return;
    wrapUpCueLeakRecoverySentRef.current = true;
    clearWrapUpTimer();
    logVoiceDemoOps({
      kind: "session_anomaly",
      message: "Jarvis leaked hidden cue — wrap-up recovery nudge sent",
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
    if (isFarewellLocked()) return;
    if (
      awaitingPhoneDigitsRef.current ||
      awaitingZipDigitsRef.current ||
      awaitingZipConfirmRef.current ||
      awaitingWeatherYesNoRef.current ||
      isInWeatherZipFlow()
    ) {
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
  }, [clearWrapUpTimer, isFarewellLocked, isInWeatherZipFlow]);

  const scheduleWrapUpPause = useCallback(
    (delayMs = WRAPUP_POST_ANSWER_PAUSE_MS) => {
      if (modeRef.current !== "demo" || isFarewellLocked() || isInWeatherZipFlow()) return;
      clearWrapUpTimer();
      wrapUpTimerRef.current = setTimeout(() => {
        sendWrapUpPauseNudge();
      }, delayMs);
    },
    [clearWrapUpTimer, isFarewellLocked, isInWeatherZipFlow, sendWrapUpPauseNudge]
  );

  const sendWeatherDeclineNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isFarewellLocked()) return;
    if (!canSendClientWeatherNudge()) return;
    clearWeatherZipState();
    goodbyeNudgeSentRef.current = true;
    markClientWeatherNudgeSent();
    try {
      void sendClientNudge(buildWeatherDeclineNudge());
    } catch (err) {
      console.warn("[voice-demo-live] weather decline nudge", err);
    }
  }, [canSendClientWeatherNudge, clearWeatherZipState, isFarewellLocked, markClientWeatherNudgeSent]);

  const sendWeatherAcceptZipNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isFarewellLocked()) return;
    if (!canSendClientWeatherNudge()) return;
    markClientWeatherNudgeSent();
    promoWeatherNudgeSentRef.current = false;
    try {
      void sendClientNudge(buildWeatherAcceptZipNudge());
    } catch (err) {
      console.warn("[voice-demo-live] weather accept zip nudge", err);
    }
  }, [canSendClientWeatherNudge, isFarewellLocked, markClientWeatherNudgeSent]);

  const sendStagedZipReadBackNudge = useCallback(
    (reason: string) => {
      const session = sessionRef.current;
      const staged = stagedZipReadbackRef.current;
      if (!session || !staged || isFarewellLocked() || zipLookupTriggeredRef.current) return;
      awaitingZipConfirmRef.current = true;
      awaitingZipDigitsRef.current = false;
      markClientWeatherNudgeSent();
      suppressPromoAudioDuringWeatherRef.current = false;
      logVoiceDemoOps({
        kind: "zip_confirm_staged",
        message: reason,
        meta: { zip: staged.zip, city: staged.city },
      });
      try {
        void sendClientNudge(buildZipStagedSpeakNudge(staged.spokenConfirm));
        scheduleZipStagingWatchdog();
      } catch (err) {
        console.warn("[voice-demo-live] staged zip read-back nudge", err);
      }
    },
    [isFarewellLocked, markClientWeatherNudgeSent, scheduleZipStagingWatchdog]
  );

  const sendWeatherZipWrapUpBlockedNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isFarewellLocked() || !weatherDemoStillIncomplete()) return;
    if (!canSendClientWeatherNudge()) return;
    clearWrapUpTimer();
    markClientWeatherNudgeSent();
    logVoiceDemoOps({
      kind: "session_anomaly",
      message: "Blocked wrap-up question during weather ZIP flow — ZIP redirect sent",
      severity: "warn",
    });
    try {
      void sendClientNudge(buildWeatherZipWrapUpBlockedNudge());
    } catch (err) {
      console.warn("[voice-demo-live] zip wrap-up blocked nudge", err);
    }
  }, [
    canSendClientWeatherNudge,
    clearWrapUpTimer,
    isFarewellLocked,
    isInWeatherZipFlow,
    markClientWeatherNudgeSent,
  ]);

  const sendPromoBlockedDuringWeatherNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isFarewellLocked() || promoWeatherNudgeSentRef.current) return;
    promoWeatherNudgeSentRef.current = true;
    suppressPromoAudioDuringWeatherRef.current = true;
    playerRef.current?.hardStop();
    markClientWeatherNudgeSent();
    const staged = stagedZipReadbackRef.current;
    let turns: string;
    if (weatherForecastCompleteRef.current) {
      turns = buildPromoBlockedBeforeCloseQueueNudge();
    } else if (staged && !zipLookupTriggeredRef.current) {
      turns = buildPromoBlockedDuringZipConfirmNudge(staged.spokenConfirm);
    } else {
      turns = buildPromoBlockedDuringWeatherNudge();
    }
    logVoiceDemoOps({
      kind: "tool_blocked_promo_weather",
      message: "Jarvis asked for promo before weather finished — correction nudge sent",
      meta: { zip: staged?.zip, hasStaged: Boolean(staged) },
    });
    try {
      void sendClientNudge(turns, { hardStop: true });
    } catch (err) {
      console.warn("[voice-demo-live] promo weather blocked nudge", err);
      promoWeatherNudgeSentRef.current = false;
      suppressPromoAudioDuringWeatherRef.current = false;
    }
  }, [isFarewellLocked, markClientWeatherNudgeSent, weatherDemoStillIncomplete]);

  const sendZipOnlyAfterAmbiguousYesNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isFarewellLocked()) return;
    if (!canSendClientWeatherNudge()) return;
    markClientWeatherNudgeSent();
    try {
      void sendClientNudge(buildZipOnlyAfterAmbiguousYesNudge());
    } catch (err) {
      console.warn("[voice-demo-live] zip ambiguous yes nudge", err);
    }
  }, [canSendClientWeatherNudge, isFarewellLocked, markClientWeatherNudgeSent]);

  const maybeCorrectPromoDuringWeather = useCallback(
    (assistantText: string) => {
      if (!isAssistantPromoAsk(assistantText)) return;
      if (
        !shouldBlockPromoOffer({
          forecastComplete: weatherForecastCompleteRef.current,
          closeQueuePhase: closeQueuePhaseRef.current,
        })
      ) {
        return;
      }
      sendPromoBlockedDuringWeatherNudge();
    },
    [sendPromoBlockedDuringWeatherNudge]
  );

  const captureUserWeatherZip = useCallback(
    (userLine: string, heardZip: string) => {
      lastUserWeatherZipRef.current = heardZip;
      if (!awaitingZipDigitsRef.current) {
        awaitingZipDigitsRef.current = true;
        awaitingWeatherYesNoRef.current = false;
        clearWeatherYesNoTimer();
      }
      awaitingZipConfirmRef.current = false;
      zipSilenceNudgedRef.current = false;
      zipNudgeTranscriptRef.current = "";
      clearWrapUpTimer();
      clearZipSilenceTimer();
      playerRef.current?.hardStop();
      void sendZipDigitConfirmNudge(userLine);
    },
    [clearWeatherYesNoTimer, clearWrapUpTimer, clearZipSilenceTimer, sendZipDigitConfirmNudge]
  );

  const recoverWeatherZipAfterPromoSkip = useCallback(
    (assistantText: string) => {
      if (!weatherDemoStillIncomplete()) return;
      const trimmed = assistantText.trim();
      if (!trimmed || !isAssistantPromoAsk(trimmed)) return;

      playerRef.current?.hardStop();
      promoWeatherNudgeSentRef.current = false;

      const heardZip =
        lastUserWeatherZipRef.current ||
        normalizeSpokenUsZipCode(captionTextRef.current.trim());

      if (!stagedZipReadbackRef.current && heardZip && !zipLookupTriggeredRef.current) {
        logVoiceDemoOps({
          kind: "session_anomaly",
          message: "Promo asked before ZIP staging — client recovery staging",
          severity: "warn",
          meta: { zip: heardZip },
        });
        captureUserWeatherZip(heardZip, heardZip);
      } else if (stagedZipReadbackRef.current && !zipLookupTriggeredRef.current) {
        sendStagedZipReadBackNudge("Promo skipped ZIP read-back — recovery nudge");
      }

      maybeCorrectPromoDuringWeather(trimmed);
    },
    [
      captureUserWeatherZip,
      maybeCorrectPromoDuringWeather,
      sendStagedZipReadBackNudge,
      weatherDemoStillIncomplete,
    ]
  );

  const detectAssistantWeatherPrompt = useCallback(
    (assistantText: string) => {
      const trimmed = assistantText.trim();
      if (!trimmed) return;
      clearWrapUpTimer();

      if (
        zipLookupTriggeredRef.current ||
        awaitingWeatherForecastDeliveryRef.current
      ) {
        if (
          isAssistantWeatherOfferPrompt(trimmed) ||
          isAssistantZipCollectionPrompt(trimmed)
        ) {
          return;
        }
      }

      if (isAssistantWeatherOfferPrompt(trimmed)) {
        const sig = trimmed.toLowerCase();
        if (lastWeatherOfferSigRef.current === sig) return;
        lastWeatherOfferSigRef.current = sig;

        awaitingWeatherYesNoRef.current = true;
        awaitingZipDigitsRef.current = false;
        awaitingZipConfirmRef.current = false;
        zipNudgeTranscriptRef.current = "";
        zipSilenceNudgedRef.current = false;
        zipSilencePhaseRef.current = "listening";
        zipDigitsHeardMaxRef.current = 0;
        lastZipPromptSigRef.current = "";
        clearZipSilenceTimer();
        weatherYesNoPhaseRef.current = "first";
        void scheduleWeatherYesNoAfterIdle();
        return;
      }

      if (isAssistantZipCollectionPrompt(trimmed)) {
        const sig = trimmed.toLowerCase();
        if (lastZipPromptSigRef.current === sig) return;
        lastZipPromptSigRef.current = sig;
        weatherDemoAcceptedRef.current = true;

        awaitingWeatherYesNoRef.current = false;
        weatherYesNoPhaseRef.current = "first";
        clearWeatherYesNoTimer();
        awaitingZipConfirmRef.current = false;
        awaitingZipDigitsRef.current = true;
        zipNudgeTranscriptRef.current = "";
        zipSilenceNudgedRef.current = false;
        zipSilencePhaseRef.current = "listening";
        zipDigitsHeardMaxRef.current = 0;
        promoWeatherNudgeSentRef.current = false;
        void scheduleZipSilenceAfterIdle();
        maybeCorrectPromoDuringWeather(trimmed);
        return;
      }

      if (isAssistantZipReadBackPrompt(trimmed)) {
        awaitingZipDigitsRef.current = false;
        awaitingZipConfirmRef.current = true;
        zipSilenceNudgedRef.current = true;
        clearZipSilenceTimer();
        clearZipStagingWatchdog();
      }

      maybeCorrectPromoDuringWeather(trimmed);
    },
    [
      clearWrapUpTimer,
      clearWeatherYesNoTimer,
      clearZipSilenceTimer,
      clearZipStagingWatchdog,
      maybeCorrectPromoDuringWeather,
      scheduleWeatherYesNoAfterIdle,
      scheduleZipSilenceAfterIdle,
    ]
  );

  const syncWeatherCollectionState = useCallback(
    (name: string, result: Record<string, unknown>) => {
      if (name === "confirm_weather_zip" && result.ok === true) {
        const staged = stagedZipFromToolResult(result);
        if (staged) {
          rememberStagedZipReadback(staged, "tool");
        }
        awaitingZipDigitsRef.current = false;
        awaitingZipConfirmRef.current = true;
        zipNudgeTranscriptRef.current = "";
        zipSilenceNudgedRef.current = true;
        clearZipSilenceTimer();
        return;
      }

      if (name === "lookup_weather" && result.ok === true) {
        awaitingZipConfirmRef.current = false;
        awaitingZipDigitsRef.current = false;
        awaitingWeatherYesNoRef.current = false;
        zipDigitsHeardMaxRef.current = 0;
        zipNudgeTranscriptRef.current = "";
        zipSilenceNudgedRef.current = false;
        clearZipSilenceTimer();
        clearWeatherYesNoTimer();
        awaitingWeatherForecastDeliveryRef.current = true;
      }
    },
    [clearZipSilenceTimer, rememberStagedZipReadback, stagedZipFromToolResult]
  );

  const sendWeatherLookupAfterZipConfirm = useCallback(async () => {
    const session = sessionRef.current;
    const staged = stagedZipReadbackRef.current;
    if (!session || !staged || zipLookupTriggeredRef.current || isFarewellLocked()) {
      return;
    }

    zipLookupTriggeredRef.current = true;
    awaitingZipConfirmRef.current = false;
    clearZipSilenceTimer();
    clearZipStagingWatchdog();
    clearWrapUpTimer();

    logVoiceDemoOps({
      kind: "weather_lookup_client",
      message: `Client lookup_weather for ZIP ${staged.zip} after yes`,
      meta: { zip: staged.zip, city: staged.city },
    });

    try {
      await playerRef.current?.whenPlaybackIdle(10000);
      await sleep(WEATHER_POST_CONFIRM_PAUSE_MS);
      optionsRef.current.onStatus?.("Looking up weather…");

      let result: Record<string, unknown> | null = null;
      let errorDetail = "lookup failed";
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (attempt > 0) {
          await sleep(700);
          optionsRef.current.onStatus?.("Retrying weather lookup…");
        }
        result = await runTool("lookup_weather", {
          zipCode: staged.zip,
          userConfirmed: true,
        });
        if (result.ok === true) break;
        errorDetail = typeof result.error === "string" ? result.error : errorDetail;
      }

      if (!result || result.ok !== true) {
        zipLookupTriggeredRef.current = false;
        logVoiceDemoOps({
          kind: "weather_lookup_failed",
          message: `lookup_weather failed for ZIP ${staged.zip}`,
          severity: "warn",
          meta: { zip: staged.zip, error: errorDetail },
        });
        markClientWeatherNudgeSent();
        await sendClientNudge(
          buildWeatherLookupFailedNudge(errorDetail, { retriesExhausted: true })
        );
        return;
      }

      syncWeatherCollectionState("lookup_weather", result);

      const spokenLookup =
        typeof result.spokenLookup === "string" ? result.spokenLookup.trim() : "";
      const briefReport =
        typeof result.briefReport === "string" ? result.briefReport.trim() : "";
      if (!spokenLookup || !briefReport) {
        logVoiceDemoOps({
          kind: "weather_lookup_failed",
          message: `lookup_weather missing spoken lines for ZIP ${staged.zip}`,
          severity: "warn",
          meta: { zip: staged.zip },
        });
        zipLookupTriggeredRef.current = false;
        markClientWeatherNudgeSent();
        await sendClientNudge(
          buildWeatherLookupFailedNudge("missing forecast lines", {
            retriesExhausted: true,
          })
        );
        return;
      }

      logVoiceDemoOps({
        kind: "weather_lookup_success",
        message: `Weather fetched for ZIP ${staged.zip}`,
        meta: { zip: staged.zip, city: staged.city },
      });

      markClientWeatherNudgeSent();
      await sendClientNudge(buildWeatherLookupSpeakNudge(spokenLookup, briefReport));
    } catch (err) {
      console.warn("[voice-demo-live] client weather lookup", err);
      zipLookupTriggeredRef.current = false;
      awaitingZipConfirmRef.current = true;
      logVoiceDemoOps({
        kind: "weather_lookup_failed",
        message: "Client lookup_weather threw",
        severity: "error",
        meta: { zip: staged.zip, error: String(err) },
      });
      try {
        markClientWeatherNudgeSent();
        await sendClientNudge(
          buildWeatherLookupFailedNudge(String(err), { retriesExhausted: true })
        );
      } catch (sendErr) {
        console.warn("[voice-demo-live] weather lookup failed nudge", sendErr);
      }
    }
  }, [
    clearWrapUpTimer,
    clearZipSilenceTimer,
    isFarewellLocked,
    markClientWeatherNudgeSent,
    runTool,
    syncWeatherCollectionState,
  ]);

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

  const clearMicMuteDisconnectTimer = useCallback(() => {
    if (micMuteDisconnectTimerRef.current) {
      clearTimeout(micMuteDisconnectTimerRef.current);
      micMuteDisconnectTimerRef.current = null;
    }
  }, []);

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
    clearMicMuteDisconnectTimer();
    applyMicMuted(false);
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
    clearPhoneCollectionState();
    clearWeatherZipState();
    stopOrbLoop();
    setConnected(false);
    setConnecting(false);
  }, [
    applyMicMuted,
    clearMicMuteDisconnectTimer,
    clearPhoneCollectionState,
    clearPostNameGreetingTimer,
    clearReconnectTimer,
    clearWeatherZipState,
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
      clearMicMuteDisconnectTimer();
      applyMicMuted(muted);
      if (muted) {
        optionsRef.current.onStatus?.(
          "Microphone muted — unmute within 10 seconds or the call will end."
        );
        const scheduleMuteDisconnect = () => {
          clearMicMuteDisconnectTimer();
          micMuteDisconnectTimerRef.current = setTimeout(() => {
            micMuteDisconnectTimerRef.current = null;
            if (playerRef.current?.isPlaying()) {
              scheduleMuteDisconnect();
              return;
            }
            optionsRef.current.onStatus?.(
              "Muted too long — session ended. Tap Start voice to chat again."
            );
            hangupReasonRef.current = "mic_mute_timeout";
            logVoiceDemoOps({
              kind: "client_hangup_scheduled",
              message: "Mic muted too long — hangup",
              meta: { phase: getSessionPhase(), hangupReason: "mic_mute_timeout" },
            });
            disconnect(true);
          }, VOICE_DEMO_MIC_MUTE_DISCONNECT_MS);
        };
        scheduleMuteDisconnect();
      } else {
        optionsRef.current.onStatus?.("Microphone on — Jarvis can hear you again.");
      }
    },
    [applyMicMuted, clearMicMuteDisconnectTimer, disconnect, getSessionPhase]
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
  }, [clearInputSilenceTimers]);

  const finishConversation = useCallback(async () => {
    if (farewellDisconnectingRef.current) return;
    farewellDisconnectingRef.current = true;
    try {
      await playerRef.current?.whenPlaybackIdle(FAREWELL_PLAYBACK_MAX_WAIT_MS);
      latchFarewellClosing();
      await sleep(PHASE_TAIL_MS);
      optionsRef.current.onConversationEnd?.();
      optionsRef.current.onStatus?.("Call ended — tap Start voice to chat again.");
      disconnect(true);
    } finally {
      farewellDisconnectingRef.current = false;
      lastAssistantTextRef.current = "";
    }
  }, [disconnect, latchFarewellClosing]);

  const scheduleFarewellHangup = useCallback(
    (reason: VoiceDemoHangupReason) => {
      if (farewellDisconnectingRef.current || reconnectingRef.current) return;
      if (weatherDemoStillIncomplete()) return;
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
    [finishConversation, getSessionPhase, weatherDemoStillIncomplete]
  );

  const endCallNow = useCallback(() => {
    if (farewellDisconnectingRef.current) return;
    farewellDisconnectingRef.current = true;
    hangupReasonRef.current = "visitor_farewell_echo";
    logVoiceDemoOps({
      kind: "client_hangup_scheduled",
      message: "Visitor farewell echo — immediate hangup",
      meta: { phase: getSessionPhase(), hangupReason: "visitor_farewell_echo" },
    });
    latchFarewellClosing();
    micRef.current?.stop();
    optionsRef.current.onConversationEnd?.();
    optionsRef.current.onStatus?.("Call ended — tap Start voice to chat again.");
    disconnect(true);
    farewellDisconnectingRef.current = false;
    lastAssistantTextRef.current = "";
  }, [disconnect, getSessionPhase, latchFarewellClosing]);

  const handleMessage = useCallback(
    async (message: LiveMessage) => {
      if (message.sessionResumptionUpdate?.newHandle) {
        sessionResumptionHandleRef.current = message.sessionResumptionUpdate.newHandle;
        logVoiceDemoOps({
          kind: "session_resumption",
          message: "Stored session resumption handle",
          meta: {
            resumable: message.sessionResumptionUpdate.resumable === true,
          },
        });
      }

      if (message.goAway) {
        const durationMs = Date.now() - connectedAtRef.current;
        logVoiceDemoOps({
          kind: "session_anomaly",
          message: "Gemini goAway — reconnecting before disconnect",
          severity: "warn",
          meta: {
            durationMs,
            timeLeft: message.goAway.timeLeft ?? null,
          },
        });
        setConnecting(true);
        optionsRef.current.onStatus?.("Connection refreshing — one moment…");
        scheduleLiveReconnect("goAway", {
          durationMs,
          timeLeft: message.goAway.timeLeft ?? null,
        });
        return;
      }

      const earlyOut = message.serverContent?.outputTranscription?.text;
      if (earlyOut) {
        lastAssistantTextRef.current = mergeTranscriptChunk(
          lastAssistantTextRef.current,
          earlyOut
        );
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
          if (isInWeatherZipFlow()) {
            sendWeatherZipWrapUpBlockedNudge();
          }
        }
        if (
          modeRef.current === "demo" &&
          awaitingZipConfirmRef.current &&
          stagedZipReadbackRef.current &&
          !zipCityCorrectionSentRef.current &&
          shouldInterruptZipCityDrift(lastAssistantTextRef.current, stagedZipReadbackRef.current)
        ) {
          sendZipCityCorrection("Interrupted wrong city during ZIP read-back stream", false, null);
        }
        if (modeRef.current === "demo") {
          if (
            shouldSuppressAssistantAudioDuringWeather({
              weatherDemoIncomplete: weatherDemoStillIncomplete(),
              assistantText: lastAssistantTextRef.current,
              forecastComplete: weatherForecastCompleteRef.current,
              closeQueuePhase: closeQueuePhaseRef.current,
            })
          ) {
            suppressPromoAudioDuringWeatherRef.current = true;
          }
          detectAssistantWeatherPrompt(lastAssistantTextRef.current);
          detectCloseQueuePrompt(lastAssistantTextRef.current);
          maybeCorrectPromoDuringWeather(lastAssistantTextRef.current);
          if (isAssistantHiddenCueLeak(lastAssistantTextRef.current)) {
            sendWrapUpCueLeakRecovery();
          }
        }
      }

      const calls = message.toolCall?.functionCalls ?? [];
      if (calls.length > 0 && sessionRef.current) {
        const responses: VoiceDemoToolResponseEntry[] = [];
        const bundledWeatherLookup =
          calls.some((c) => c.name === "confirm_weather_zip") &&
          calls.some((c) => c.name === "lookup_weather");

        for (const call of calls) {
          const name = call.name ?? "";
          const args = (call.args ?? {}) as Record<string, unknown>;

          if (name === "lookup_weather" && bundledWeatherLookup) {
            logVoiceDemoOps({
              kind: "tool_bundled_weather",
              message: "Blocked confirm_weather_zip + lookup_weather in one turn",
            });
            responses.push(buildVoiceDemoToolResponse(call.id, name, {
                ok: false,
                error:
                  "Speak spokenConfirm and wait for yes — then call lookup_weather alone with userConfirmed true, not in the same turn as confirm_weather_zip.",
              }));
            continue;
          }

          if (
            name === "confirm_weather_zip" &&
            (awaitingZipConfirmRef.current || stagedZipReadbackRef.current)
          ) {
            logVoiceDemoOps({
              kind: "tool_blocked_confirm_zip",
              message: "Blocked duplicate model confirm_weather_zip — client owns staging",
            });
            responses.push(buildVoiceDemoToolResponse(call.id, name, { ok: false, error: TOOL_BLOCKED_CONFIRM_WEATHER_ZIP }));
            continue;
          }

          if (name === "lookup_weather" && zipLookupTriggeredRef.current) {
            logVoiceDemoOps({
              kind: "tool_blocked_lookup_weather",
              message: "Blocked duplicate model lookup_weather — client already fetched",
            });
            responses.push(buildVoiceDemoToolResponse(call.id, name, { ok: false, error: TOOL_BLOCKED_LOOKUP_WEATHER }));
            continue;
          }

          if (
            (name === "send_promo_email" ||
              name === "send_promo_sms" ||
              name === "capture_email_for_promo") &&
            shouldBlockPromoOffer({
              forecastComplete: weatherForecastCompleteRef.current,
              closeQueuePhase: closeQueuePhaseRef.current,
            })
          ) {
            logVoiceDemoOps({
              kind: "tool_blocked_promo_weather",
              message: `Blocked ${name} during incomplete weather ZIP flow`,
            });
            responses.push(buildVoiceDemoToolResponse(call.id, name, { ok: false, error: TOOL_BLOCKED_PROMO_WEATHER }));
            continue;
          }

          if (name === "confirm_weather_zip") {
            const zip = typeof args.zipCode === "string" ? args.zipCode.trim() : "";
            optionsRef.current.onStatus?.(
              zip ? `Confirming ZIP ${zip}…` : "Confirming ZIP…"
            );
          } else if (name === "lookup_weather") {
            optionsRef.current.onStatus?.("One moment — looking up weather…");
            await playerRef.current?.whenPlaybackIdle(10000);
            await sleep(WEATHER_POST_CONFIRM_PAUSE_MS);
          }

          const result = await runTool(name, args);
          syncPhoneCollectionState(name, result);
          syncWeatherCollectionState(name, result);

          if (name === "save_name" && result.ok === true) {
            nameSavedRef.current = true;
            const savedName = typeof result.name === "string" ? result.name.trim() : "";
            if (savedName) savedNameRef.current = savedName;
            const alreadyGreeted = postNameLineSpokenRef.current;
            responses.push(buildVoiceDemoToolResponse(call.id, name, {
                ...result,
                message: buildSaveNameToolMessage(savedName || "visitor", alreadyGreeted),
              }));
            continue;
          }

          if (name === "send_promo_email" && result.ok === true) {
            closeQueuePhaseRef.current = "promo_sent";
          }

          if (name === "lookup_weather") {
            if (result.ok === true) {
              zipLookupTriggeredRef.current = true;
              logVoiceDemoOps({
                kind: "weather_lookup_success",
                message: "Model lookup_weather succeeded",
                meta: {
                  zip: typeof result.zip === "string" ? result.zip : undefined,
                },
              });
            } else if (!zipLookupTriggeredRef.current && stagedZipReadbackRef.current) {
              logVoiceDemoOps({
                kind: "weather_lookup_failed",
                message: "Model lookup_weather failed — handing off to client retry",
                severity: "warn",
                meta: {
                  error: typeof result.error === "string" ? result.error : "unknown",
                },
              });
              void sendWeatherLookupAfterZipConfirm();
            } else if (!zipLookupTriggeredRef.current) {
              logVoiceDemoOps({
                kind: "weather_lookup_failed",
                message: "Model lookup_weather failed",
                severity: "warn",
                meta: {
                  error: typeof result.error === "string" ? result.error : "unknown",
                },
              });
            }
          }

          if (name === "verify_code" && result.verified === true) {
            queuePhaseTransition({ kind: "verified", nextMode: "demo" });
          }

          responses.push(buildVoiceDemoToolResponse(call.id, name, result));
        }
        sessionRef.current.sendToolResponse({ functionResponses: responses });
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
            if (
              suppressPromoAudioDuringWeatherRef.current ||
              (modeRef.current === "demo" &&
                shouldSuppressAssistantAudioDuringWeather({
                  weatherDemoIncomplete: weatherDemoStillIncomplete(),
                  assistantText: lastAssistantTextRef.current,
                  forecastComplete: weatherForecastCompleteRef.current,
                  closeQueuePhase: closeQueuePhaseRef.current,
                }))
            ) {
              playerRef.current?.hardStop();
              continue;
            }
            if (jarvisFarewellSentRef.current) {
              playerRef.current?.hardStop();
              if (!farewellHoldSentRef.current && sessionRef.current) {
                farewellHoldSentRef.current = true;
                logVoiceDemoOps({
                  kind: "farewell_hold",
                  message: "Muted repeat assistant audio after farewell — hold nudge sent",
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
            playerRef.current ??= new VoiceDemoAudioPlayer();
            playerRef.current.enqueueBase64Pcm(data);
          }
        }
      }

      const inText = message.serverContent?.inputTranscription?.text;
      if (inText) {
        if (inText.trim() && playerRef.current?.isPlaying()) {
          if (!(nameSavedRef.current && !postNameLineSpokenRef.current)) {
            handleAssistantInterrupted();
          }
        }
        clearWrapUpTimer();
        emitCaption("user", inText);
        const userLine = captionTextRef.current.trim();

        if (modeRef.current === "demo") {
          if (isUserExplicitlyDone(userLine)) {
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

        if (awaitingWeatherYesNoRef.current && isWeatherOfferDecline(userLine)) {
          sendWeatherDeclineNudge();
        } else if (awaitingWeatherYesNoRef.current && isWeatherOfferAccept(userLine)) {
          awaitingWeatherYesNoRef.current = false;
          weatherYesNoPhaseRef.current = "first";
          lastWeatherOfferSigRef.current = "";
          clearWeatherYesNoTimer();
          clearWrapUpTimer();
          weatherDemoAcceptedRef.current = true;
          awaitingZipDigitsRef.current = true;
          zipSilenceNudgedRef.current = false;
          zipSilencePhaseRef.current = "listening";
          zipDigitsHeardMaxRef.current = 0;
          zipNudgeTranscriptRef.current = "";
          promoWeatherNudgeSentRef.current = false;
          sendWeatherAcceptZipNudge();
          void scheduleZipSilenceAfterIdle();
        }

        if (awaitingZipConfirmRef.current && isWeatherZipConfirmDecline(userLine)) {
          awaitingZipConfirmRef.current = false;
          awaitingZipDigitsRef.current = true;
          stagedZipReadbackRef.current = null;
          zipLookupTriggeredRef.current = false;
          zipSilenceNudgedRef.current = false;
          zipSilencePhaseRef.current = "listening";
          zipNudgeTranscriptRef.current = "";
          lastZipPromptSigRef.current = "";
        } else if (
          stagedZipReadbackRef.current &&
          isWeatherZipConfirmAccept(userLine) &&
          !zipLookupTriggeredRef.current
        ) {
          clearZipSilenceTimer();
          void sendWeatherLookupAfterZipConfirm();
        }

        const zipDigits = countSpokenZipDigits(userLine);
        if (zipDigits >= 3 && awaitingWeatherYesNoRef.current) {
          awaitingWeatherYesNoRef.current = false;
          weatherYesNoPhaseRef.current = "first";
          lastWeatherOfferSigRef.current = "";
          clearWeatherYesNoTimer();
          awaitingZipDigitsRef.current = true;
          zipSilenceNudgedRef.current = false;
          zipSilencePhaseRef.current = "listening";
        }

        if (awaitingZipDigitsRef.current && !zipSilenceNudgedRef.current) {
          zipSilencePhaseRef.current = "listening";
          zipNudgeTranscriptRef.current = "";
          const heard = countSpokenZipDigits(userLine);
          if (heard > zipDigitsHeardMaxRef.current) {
            zipDigitsHeardMaxRef.current = heard;
          }
        }

        if (
          awaitingZipDigitsRef.current &&
          !awaitingZipConfirmRef.current &&
          isWeatherOfferAccept(userLine) &&
          countSpokenZipDigits(userLine) < 3 &&
          !normalizeSpokenUsZipCode(userLine)
        ) {
          sendZipOnlyAfterAmbiguousYesNudge();
        }

        if (closeQueuePhaseRef.current === "awaiting_cool_reaction") {
          if (isCloseQueueAffirmative(userLine)) {
            sendCloseQueueImplementAskNudge();
          } else if (isCloseQueueNegative(userLine)) {
            sendCloseQueueSkipToWrapUp("Visitor declined cool reaction");
          }
        } else if (closeQueuePhaseRef.current === "awaiting_implement_interest") {
          if (isCloseQueueInterest(userLine)) {
            sendCloseQueuePromoAskNudge();
          } else if (isCloseQueueNegative(userLine)) {
            sendCloseQueueSkipToWrapUp("Visitor declined implement ask");
          }
        } else if (closeQueuePhaseRef.current === "awaiting_promo_consent") {
          if (isCloseQueueNegative(userLine)) {
            sendCloseQueuePromoDeclinedWrapUp();
          }
        }

        if (isUserWeatherZipReminder(userLine) && isInWeatherZipFlow()) {
          clearWrapUpTimer();
          if (
            awaitingZipConfirmRef.current &&
            stagedZipReadbackRef.current &&
            !zipLookupTriggeredRef.current
          ) {
            markClientWeatherNudgeSent();
            void sendClientNudge(
              buildZipStagedSpeakNudge(stagedZipReadbackRef.current.spokenConfirm)
            );
          } else {
            sendWeatherZipWrapUpBlockedNudge();
          }
        }

        const heardZip = normalizeSpokenUsZipCode(userLine);
        if (
          heardZip &&
          shouldStageWeatherZipFromUserInput({
            awaitingZipDigits: awaitingZipDigitsRef.current,
            weatherDemoAccepted: weatherDemoAcceptedRef.current,
            zipPromptSeen: Boolean(lastZipPromptSigRef.current),
            zipDigitsHeardMax: zipDigitsHeardMaxRef.current,
          })
        ) {
          captureUserWeatherZip(userLine, heardZip);
        }

        if (/\d/.test(inText)) {
          if (awaitingPhoneConfirmRef.current) {
            awaitingPhoneConfirmRef.current = false;
            awaitingPhoneDigitsRef.current = true;
            phoneNudgeTranscriptRef.current = "";
          }
          if (awaitingZipConfirmRef.current && zipDigits >= 1) {
            awaitingZipConfirmRef.current = false;
            awaitingZipDigitsRef.current = true;
            zipSilenceNudgedRef.current = false;
            zipNudgeTranscriptRef.current = "";
          }
          if (awaitingZipDigitsRef.current && !zipSilenceNudgedRef.current) {
            scheduleZipSilenceNudge();
          }
          schedulePhoneSilenceNudge();
        } else if (awaitingZipDigitsRef.current && !zipSilenceNudgedRef.current) {
          scheduleZipSilenceNudge();
        }
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
        const assistantSnapshot = lastAssistantTextRef.current;
        if (!jarvisFarewellSentRef.current) {
          suppressAssistantAudioRef.current = false;
        }
        if (isAssistantPromoAsk(assistantSnapshot)) {
          suppressPromoAudioDuringWeatherRef.current = true;
        } else {
          suppressPromoAudioDuringWeatherRef.current = false;
        }
        if (isInWeatherZipFlow()) {
          promoWeatherNudgeSentRef.current = false;
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
          shouldScheduleWrapUpAfterAnswer(assistantSnapshot, {
            awaitingCollection:
              awaitingPhoneDigitsRef.current ||
              awaitingZipDigitsRef.current ||
              awaitingZipConfirmRef.current ||
              awaitingWeatherYesNoRef.current ||
              awaitingWeatherForecastDeliveryRef.current,
            weatherFlowActive: weatherDemoStillIncomplete(),
            farewellSent: jarvisFarewellSentRef.current,
            visitorAskedSubstantiveQuestion: visitorAskedSubstantiveQuestionRef.current,
          });

        void (async () => {
          await playerRef.current?.whenPlaybackIdle(FAREWELL_PLAYBACK_MAX_WAIT_MS);
          await flushClientNudges();
          if (farewellDisconnectingRef.current || reconnectingRef.current) return;
          if (modeRef.current !== "demo" || !postNameLineSpokenRef.current) return;

          if (shouldWrapUpAfterThisTurn) return;

          if (hadPendingClientHangup) {
            if (shouldBlockFarewellHangup()) {
              sendWeatherZipPrematureGoodbyeRecovery();
            } else {
              if (!jarvisFarewellSentRef.current) {
                latchFarewellClosing();
              }
              scheduleFarewellHangup(
                hangupReasonRef.current ?? "model_end_conversation_blocked"
              );
            }
            return;
          }

          if (
            shouldClientScheduleFarewellHangup(assistantSnapshot, {
              visitorExplicitlyDone: visitorExplicitlyDoneRef.current,
              farewellSent: jarvisFarewellSentRef.current,
              goodbyeNudgeSent: goodbyeNudgeSentRef.current,
              phase: getSessionPhase(),
            }) &&
            !shouldBlockFarewellHangup()
          ) {
            if (!jarvisFarewellSentRef.current) {
              latchFarewellClosing();
            }
            const reason: VoiceDemoHangupReason = goodbyeNudgeSentRef.current
              ? "goodbye_nudge_complete"
              : "client_final_goodbye";
            scheduleFarewellHangup(reason);
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
          detectAssistantWeatherPrompt(assistantSnapshot);
          detectCloseQueuePrompt(assistantSnapshot);
          recoverWeatherZipAfterPromoSkip(assistantSnapshot);
          if (isAssistantHiddenCueLeak(assistantSnapshot)) {
            sendWrapUpCueLeakRecovery();
          } else if (isAssistantWrapUpQuestion(assistantSnapshot)) {
            wrapUpCueLeakRecoverySentRef.current = false;
            clearWrapUpTimer();
          }
          if (
            stagedZipReadbackRef.current &&
            !zipLookupTriggeredRef.current &&
            assistantSnapshot.trim() &&
            assistantZipReadBackMissingStagedCity(
              assistantSnapshot,
              stagedZipReadbackRef.current
            )
          ) {
            sendStagedZipReadBackNudge(
              "Assistant ZIP confirm omitted staged city — re-send spokenConfirm"
            );
          }
          if (
            awaitingZipConfirmRef.current &&
            stagedZipReadbackRef.current &&
            assistantSnapshot.trim()
          ) {
            const drift = detectZipCityDrift(assistantSnapshot, stagedZipReadbackRef.current);
            if (drift.drift) {
              if (drift.selfCorrected) {
                logVoiceDemoOps({
                  kind: "zip_city_self_correction",
                  message: `Jarvis self-corrected ZIP city for ${stagedZipReadbackRef.current.zip}`,
                  meta: {
                    zip: stagedZipReadbackRef.current.zip,
                    expectedCity: stagedZipReadbackRef.current.city,
                    heardCity: drift.heardCity,
                  },
                });
              } else if (!zipCityCorrectionSentRef.current) {
                sendZipCityCorrection(
                  `Wrong city on ZIP read-back for ${stagedZipReadbackRef.current.zip}`,
                  false,
                  drift.heardCity
                );
              }
            }
          }
          if (isAssistantWrapUpQuestion(assistantSnapshot)) {
            clearWrapUpTimer();
            if (isInWeatherZipFlow()) {
              sendWeatherZipWrapUpBlockedNudge();
            }
          } else if (isAssistantWeatherForecast(assistantSnapshot)) {
            weatherForecastCompleteRef.current = true;
            suppressPromoAudioDuringWeatherRef.current = false;
            promoWeatherNudgeSentRef.current = false;
            awaitingWeatherForecastDeliveryRef.current = false;
            scheduleWeatherCloseQueueStart();
          } else if (
            awaitingWeatherForecastDeliveryRef.current ||
            isAssistantWeatherLookupPending(assistantSnapshot)
          ) {
            clearWrapUpTimer();
          } else if (
            shouldScheduleWrapUpAfterAnswer(assistantSnapshot, {
              awaitingCollection:
                awaitingPhoneDigitsRef.current ||
                awaitingZipDigitsRef.current ||
                awaitingZipConfirmRef.current ||
                awaitingWeatherYesNoRef.current ||
                awaitingWeatherForecastDeliveryRef.current,
              weatherFlowActive: weatherDemoStillIncomplete(),
              farewellSent: jarvisFarewellSentRef.current,
              visitorAskedSubstantiveQuestion: visitorAskedSubstantiveQuestionRef.current,
            })
          ) {
            visitorAskedSubstantiveQuestionRef.current = false;
            scheduleWrapUpPause(WRAPUP_POST_ANSWER_PAUSE_MS);
          } else {
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
      captureUserWeatherZip,
      detectAssistantWeatherPrompt,
      maybeCorrectPromoDuringWeather,
      recoverWeatherZipAfterPromoSkip,
      emitCaption,
      endCallNow,
      finishConversation,
      finishPendingPhase,
      isCollectingWeatherZip,
      isInWeatherZipFlow,
      scheduleFarewellHangup,
      queuePhaseTransition,
      runTool,
      schedulePhoneSilenceNudge,
      scheduleZipSilenceAfterIdle,
      scheduleZipSilenceNudge,
      sendWeatherAcceptZipNudge,
      sendZipOnlyAfterAmbiguousYesNudge,
      scheduleWeatherYesNoNudge,
      detectCloseQueuePrompt,
      scheduleWeatherCloseQueueStart,
      sendCloseQueueImplementAskNudge,
      sendCloseQueuePromoAskNudge,
      sendCloseQueuePromoDeclinedWrapUp,
      sendCloseQueueSkipToWrapUp,
      scheduleWrapUpPause,
      sendWrapUpCueLeakRecovery,
      isAssistantHiddenCueLeak,
      isAssistantWrapUpQuestion,
      sendWeatherDeclineNudge,
      sendWeatherLookupAfterZipConfirm,
      sendStagedZipReadBackNudge,
      sendPromoBlockedDuringWeatherNudge,
      sendWeatherZipWrapUpBlockedNudge,
      sendWeatherZipPrematureGoodbyeRecovery,
      weatherDemoStillIncomplete,
      sendZipCityCorrection,
      sendZipDigitConfirmNudge,
      shouldBlockFarewellHangup,
      shouldSuppressAssistantAudioDuringWeather,
      setAwaitingPhoneDigits,
      syncPhoneCollectionState,
      syncWeatherCollectionState,
      getSessionPhase,
      latchFarewellClosing,
      scheduleLiveReconnect,
      schedulePostNameGreetingNudge,
      sendPostNameGreetingNudge,
    ]
  );

  const connect = useCallback(
    async (mode: VoiceDemoLiveMode, connectOpts?: ConnectOptions) => {
      const resume = connectOpts?.resume === true;

      if (!resume) {
        pendingPhaseRef.current = null;
        pendingSinceRef.current = null;
        clearPendingFallback();
        clearPhoneCollectionState();
        clearWeatherZipState();
        finishingPhaseRef.current = false;
        jarvisFarewellSentRef.current = false;
        goodbyeNudgeSentRef.current = false;
        farewellHoldSentRef.current = false;
        farewellDisconnectingRef.current = false;
        pendingClientHangupRef.current = false;
        hangupReasonRef.current = null;
        weatherDemoAcceptedRef.current = false;
        promoWeatherNudgeSentRef.current = false;
        suppressPromoAudioDuringWeatherRef.current = false;
        lastAssistantTextRef.current = "";
        greetingSentRef.current = false;
        nameSavedRef.current = false;
        savedNameRef.current = "";
        postNameLineSpokenRef.current = false;
        postNameSalutationSpokenRef.current = false;
        postNameHoldSentRef.current = false;
        postNameGreetingNudgeSentRef.current = false;
        assistantTurnInterruptedRef.current = false;
        clearPostNameGreetingTimer();
        visitorExplicitlyDoneRef.current = false;
        sessionResumptionHandleRef.current = null;
        reconnectAttemptRef.current = 0;
        clearReconnectTimer();
        suppressAssistantAudioRef.current = false;
        awaitingWeatherForecastDeliveryRef.current = false;
        visitorAskedSubstantiveQuestionRef.current = false;
        zipSilenceNudgedRef.current = false;
        lastClientWeatherNudgeAtRef.current = 0;
        lastWeatherOfferSigRef.current = "";
        lastZipPromptSigRef.current = "";
        stagedZipReadbackRef.current = null;
        zipCityCorrectionSentRef.current = false;
        zipLookupTriggeredRef.current = false;
        weatherForecastGoodbyeScheduledRef.current = false;
        weatherForecastCompleteRef.current = false;
        lastUserWeatherZipRef.current = null;
        closeQueuePhaseRef.current = "idle";
        wrapUpQuestionIndexRef.current = 0;
        wrapUpCueLeakRecoverySentRef.current = false;
        resetCaption();
        disconnect(true);
      } else if (reconnectingRef.current) {
        return;
      } else {
        reconnectingRef.current = true;
        intentionalDisconnectRef.current = true;
        try {
          sessionRef.current?.close();
        } catch {
          /* ignore */
        }
        sessionRef.current = null;
        // Keep the audio player so an in-flight answer can finish during resume.
        const playerStillPlaying = playerRef.current?.isPlaying() ?? false;
        if (!playerStillPlaying) {
          stopOrbLoop();
        } else if (orbFrameRef.current === null) {
          startOrbLoop();
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
          /* status optional — fresh onboarding if unavailable */
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
          }
          setError(tokenData.error ?? "Could not start voice session.");
          setConnecting(false);
          if (resume) {
            optionsRef.current.onUnexpectedClose?.();
          }
          return;
        }

        if (!resume) {
          clearPhoneCollectionState();
          clearWeatherZipState();
        }

        const ai = new GoogleGenAI({
          apiKey: tokenData.token,
          httpOptions: { apiVersion: "v1alpha" },
        });

        const resumptionHandle = sessionResumptionHandleRef.current ?? undefined;

        // Ephemeral live tokens lock connect config server-side — only pass
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
              if (!resume) {
                reconnectAttemptRef.current = 0;
              }
              startOrbLoop();
              optionsRef.current.onStatus?.(
                resume ? "Back with you — keep talking." : voiceDemoOpeningStatus(mode)
              );
              if (!resume) {
                setTimeout(() => {
                  if (sessionRef.current) {
                    sendOpeningGreeting(sessionRef.current);
                  }
                }, 0);
              } else if (sessionRef.current) {
                const sendResumeWhenQuiet = () => {
                  if (!sessionRef.current) return;
                  if (playerRef.current?.isPlaying()) {
                    void playerRef.current.whenPlaybackIdle(30_000).then(sendResumeWhenQuiet);
                    return;
                  }
                  sendSessionResumeNudge(sessionRef.current);
                };
                setTimeout(sendResumeWhenQuiet, 0);
              }
              micRef.current?.stop();
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
              const durationMs = Date.now() - connectedAtRef.current;
              logVoiceDemoOps({
                kind: "session_anomaly",
                message: "Live session error",
                severity: "warn",
                meta: { durationMs },
              });
              setError("Voice connection error.");
            },
            onclose: () => {
              const intentional =
                intentionalDisconnectRef.current || farewellDisconnectingRef.current;
              if (!intentional) {
                setConnecting(true);
                optionsRef.current.onStatus?.("Connection refreshing — one moment…");
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
                scheduleLiveReconnect("websocket_close", { durationMs });
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
        setError(message);
        setConnecting(false);
        if (resume) {
          optionsRef.current.onUnexpectedClose?.();
        }
      }
    },
    [
      clearPendingFallback,
      clearPhoneCollectionState,
      clearWeatherZipState,
      disconnect,
      handleMessage,
      clearReconnectTimer,
      sendOpeningGreeting,
      sendSessionResumeNudge,
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

  return {
    connect,
    disconnect: () => disconnect(true),
    disconnectGraceful,
    transitionToDemo,
    connecting,
    connected,
    error,
    jarvisLevels,
    jarvisSpeaking,
    micMuted,
    toggleMicMute,
    setMicMuted: setMicMutedState,
  };
}
