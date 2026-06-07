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
import {
  JARVIS_AUDIO_IDLE,
  readJarvisAudioLevels,
  smoothJarvisAudioLevels,
  type JarvisAudioLevels,
} from "@/lib/voice-demo-jarvis-audio-level";
import {
  buildFarewellHoldNudge,
  isAssistantFarewell,
  isUserFarewellEcho,
} from "@/lib/voice-demo-farewell";
import {
  triggerVoiceDemoOpening,
  voiceDemoOpeningStatus,
} from "@/lib/voice-demo-greeting";
import {
  buildPhonePauseNudge,
  PHONE_SILENCE_NUDGE_MS,
} from "@/lib/voice-demo-phone-nudge";
import {
  buildWeatherForecastGoodbyeNudge,
  isAssistantWeatherForecast,
  isAssistantWeatherLookupPending,
  WEATHER_POST_CONFIRM_PAUSE_MS,
  WEATHER_POST_FORECAST_GOODBYE_PAUSE_MS,
} from "@/lib/voice-demo-weather";
import {
  buildWrapUpPauseNudge,
  isAssistantWrapUpQuestion,
  isUserSmallTalk,
  isUserSubstantiveQuestion,
  shouldScheduleWrapUpAfterAnswer,
  WRAPUP_POST_ANSWER_PAUSE_MS,
} from "@/lib/voice-demo-wrapup-nudge";
import {
  isAssistantWeatherOfferPrompt,
  isAssistantZipCollectionPrompt,
  isAssistantZipReadBackPrompt,
  WEATHER_CLIENT_NUDGE_COOLDOWN_MS,
} from "@/lib/voice-demo-weather-flow";
import { normalizeUsZipCode } from "@/lib/voice-demo-weather";
import {
  buildWeatherDeclineNudge,
  buildWeatherYesNoGiveUpNudge,
  buildWeatherYesNoPauseNudge,
  buildZipPauseNudge,
  buildZipSilenceGiveUpNudge,
  buildZipSilenceRepeatNudge,
  buildZipStagedSpeakNudge,
  countSpokenZipDigits,
  isWeatherOfferAccept,
  isWeatherOfferDecline,
  isWeatherZipConfirmAccept,
  isWeatherZipConfirmDecline,
  WEATHER_YESNO_SILENCE_NUDGE_MS,
  ZIP_SILENCE_NUDGE_MS,
} from "@/lib/voice-demo-zip-nudge";
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
  const [jarvisLevels, setJarvisLevels] = useState<JarvisAudioLevels>(JARVIS_AUDIO_IDLE);
  const [jarvisSpeaking, setJarvisSpeaking] = useState(false);

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
  const lastAssistantTextRef = useRef("");
  const captionRoleRef = useRef<VoiceDemoCaptionRole | null>(null);
  const captionTextRef = useRef("");
  const greetingSentRef = useRef(false);
  const suppressAssistantAudioRef = useRef(false);
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
      session.sendClientContent({
        turns: buildPhonePauseNudge(transcript),
        turnComplete: true,
      });
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
    clearZipSilenceTimer();
    clearWeatherYesNoTimer();
  }, [clearWeatherYesNoTimer, clearZipSilenceTimer]);

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

  const clearInputSilenceTimers = useCallback(() => {
    clearPhoneSilenceTimer();
    clearZipSilenceTimer();
    clearWeatherYesNoTimer();
    clearWrapUpTimer();
  }, [clearPhoneSilenceTimer, clearWeatherYesNoTimer, clearWrapUpTimer, clearZipSilenceTimer]);

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

  const sendZipDigitConfirmNudge = useCallback(
    async (transcript: string): Promise<boolean> => {
      const session = sessionRef.current;
      const trimmed = transcript.trim();
      if (isFarewellLocked()) return false;
      if (!session || !trimmed || awaitingZipConfirmRef.current) return false;
      if (zipNudgeTranscriptRef.current === trimmed) return false;
      if (!canSendClientWeatherNudge()) return false;
      if (playerRef.current?.isPlaying()) return false;

      const zip = normalizeUsZipCode(trimmed);
      let turns: string;

      if (zip) {
        optionsRef.current.onStatus?.(`Confirming ZIP ${zip}…`);
        const result = await runTool("confirm_weather_zip", { zipCode: zip });
        if (result.ok !== true) {
          const partialNudge = buildZipPauseNudge(trimmed);
          if (!partialNudge) return false;
          turns = partialNudge;
        } else {
          const spokenConfirm =
            typeof result.spokenConfirm === "string" ? result.spokenConfirm.trim() : "";
          if (!spokenConfirm) return false;
          awaitingZipDigitsRef.current = false;
          awaitingZipConfirmRef.current = true;
          zipSilenceNudgedRef.current = true;
          clearZipSilenceTimer();
          turns = buildZipStagedSpeakNudge(spokenConfirm);
        }
      } else {
        const nudge = buildZipPauseNudge(trimmed);
        if (!nudge) return false;
        turns = nudge;
      }

      zipNudgeTranscriptRef.current = trimmed;
      markClientWeatherNudgeSent();
      try {
        session.sendClientContent({
          turns,
          turnComplete: true,
        });
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
    [canSendClientWeatherNudge, clearZipSilenceTimer, isFarewellLocked, markClientWeatherNudgeSent, runTool]
  );

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
        session.sendClientContent({
          turns: buildZipSilenceRepeatNudge(),
          turnComplete: true,
        });
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
      session.sendClientContent({
        turns: buildZipSilenceGiveUpNudge(),
        turnComplete: true,
      });
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
        session.sendClientContent({
          turns: buildWeatherYesNoPauseNudge(),
          turnComplete: true,
        });
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
      session.sendClientContent({
        turns: buildWeatherYesNoGiveUpNudge(),
        turnComplete: true,
      });
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

  const sendWeatherForecastGoodbyeNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || modeRef.current !== "demo") return;
    if (isFarewellLocked()) return;
    if (
      awaitingPhoneDigitsRef.current ||
      awaitingZipDigitsRef.current ||
      awaitingZipConfirmRef.current ||
      awaitingWeatherYesNoRef.current ||
      awaitingWeatherForecastDeliveryRef.current ||
      zipDigitsHeardMaxRef.current > 0
    ) {
      return;
    }
    if (playerRef.current?.isPlaying()) {
      clearWrapUpTimer();
      wrapUpTimerRef.current = setTimeout(() => {
        sendWeatherForecastGoodbyeNudge();
      }, 400);
      return;
    }

    goodbyeNudgeSentRef.current = true;
    try {
      session.sendClientContent({
        turns: buildWeatherForecastGoodbyeNudge(),
        turnComplete: true,
      });
    } catch (err) {
      console.warn("[voice-demo-live] weather forecast goodbye nudge", err);
      goodbyeNudgeSentRef.current = false;
    }
  }, [clearWrapUpTimer, isFarewellLocked]);

  const scheduleWeatherForecastGoodbye = useCallback(() => {
    if (modeRef.current !== "demo" || isFarewellLocked()) return;
    clearWrapUpTimer();
    wrapUpTimerRef.current = setTimeout(() => {
      sendWeatherForecastGoodbyeNudge();
    }, WEATHER_POST_FORECAST_GOODBYE_PAUSE_MS);
  }, [clearWrapUpTimer, isFarewellLocked, sendWeatherForecastGoodbyeNudge]);

  const sendWrapUpPauseNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || modeRef.current !== "demo") return;
    if (isFarewellLocked()) return;
    if (
      awaitingPhoneDigitsRef.current ||
      awaitingZipDigitsRef.current ||
      awaitingZipConfirmRef.current ||
      awaitingWeatherYesNoRef.current
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

    try {
      session.sendClientContent({
        turns: buildWrapUpPauseNudge(),
        turnComplete: true,
      });
    } catch (err) {
      console.warn("[voice-demo-live] wrap-up pause nudge", err);
    }
  }, [clearWrapUpTimer, isFarewellLocked]);

  const scheduleWrapUpPause = useCallback(
    (delayMs = WRAPUP_POST_ANSWER_PAUSE_MS) => {
      if (modeRef.current !== "demo" || isFarewellLocked()) return;
      clearWrapUpTimer();
      wrapUpTimerRef.current = setTimeout(() => {
        sendWrapUpPauseNudge();
      }, delayMs);
    },
    [clearWrapUpTimer, isFarewellLocked, sendWrapUpPauseNudge]
  );

  const sendWeatherDeclineNudge = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isFarewellLocked()) return;
    if (!canSendClientWeatherNudge()) return;
    clearWeatherZipState();
    goodbyeNudgeSentRef.current = true;
    markClientWeatherNudgeSent();
    try {
      session.sendClientContent({
        turns: buildWeatherDeclineNudge(),
        turnComplete: true,
      });
    } catch (err) {
      console.warn("[voice-demo-live] weather decline nudge", err);
    }
  }, [canSendClientWeatherNudge, clearWeatherZipState, isFarewellLocked, markClientWeatherNudgeSent]);

  const detectAssistantWeatherPrompt = useCallback(
    (assistantText: string) => {
      const trimmed = assistantText.trim();
      if (!trimmed) return;

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
        weatherYesNoPhaseRef.current = /before you go/.test(sig) ? "first" : "repeat";
        void scheduleWeatherYesNoAfterIdle();
        return;
      }

      if (isAssistantZipCollectionPrompt(trimmed)) {
        const sig = trimmed.toLowerCase();
        if (lastZipPromptSigRef.current === sig) return;
        lastZipPromptSigRef.current = sig;

        awaitingWeatherYesNoRef.current = false;
        weatherYesNoPhaseRef.current = "first";
        clearWeatherYesNoTimer();
        awaitingZipConfirmRef.current = false;
        awaitingZipDigitsRef.current = true;
        zipNudgeTranscriptRef.current = "";
        zipSilenceNudgedRef.current = false;
        zipSilencePhaseRef.current = "listening";
        zipDigitsHeardMaxRef.current = 0;
        void scheduleZipSilenceAfterIdle();
        return;
      }

      if (isAssistantZipReadBackPrompt(trimmed)) {
        awaitingZipDigitsRef.current = false;
        awaitingZipConfirmRef.current = true;
        zipSilenceNudgedRef.current = true;
        clearZipSilenceTimer();
      }
    },
    [clearWeatherYesNoTimer, clearZipSilenceTimer, scheduleWeatherYesNoAfterIdle, scheduleZipSilenceAfterIdle]
  );

  const syncWeatherCollectionState = useCallback(
    (name: string, result: Record<string, unknown>) => {
      if (name === "confirm_weather_zip" && result.ok === true) {
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
    [clearWeatherZipState, clearZipSilenceTimer]
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
    clearPhoneCollectionState();
    clearWeatherZipState();
    stopOrbLoop();
    setConnected(false);
    setConnecting(false);
  }, [clearPhoneCollectionState, clearWeatherZipState, stopOrbLoop]);

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

  const latchFarewellClosing = useCallback(() => {
    if (jarvisFarewellSentRef.current) return;
    jarvisFarewellSentRef.current = true;
    awaitingWeatherForecastDeliveryRef.current = false;
    awaitingZipDigitsRef.current = false;
    awaitingZipConfirmRef.current = false;
    awaitingWeatherYesNoRef.current = false;
    zipDigitsHeardMaxRef.current = 0;
    clearInputSilenceTimers();
  }, [clearInputSilenceTimers]);

  const finishConversation = useCallback(async () => {
    if (farewellDisconnectingRef.current) return;
    farewellDisconnectingRef.current = true;
    latchFarewellClosing();
    try {
      await playerRef.current?.whenPlaybackIdle(12000);
      await sleep(PHASE_TAIL_MS);
      optionsRef.current.onConversationEnd?.();
      optionsRef.current.onStatus?.("Call ended — tap Start voice to chat again.");
      disconnect(true);
    } finally {
      farewellDisconnectingRef.current = false;
      lastAssistantTextRef.current = "";
    }
  }, [disconnect, latchFarewellClosing]);

  const scheduleFarewellHangup = useCallback(() => {
    if (farewellDisconnectingRef.current) return;
    void (async () => {
      await playerRef.current?.whenPlaybackIdle(12000);
      if (
        jarvisFarewellSentRef.current &&
        !farewellDisconnectingRef.current &&
        sessionRef.current
      ) {
        void finishConversation();
      }
    })();
  }, [finishConversation]);

  const endCallNow = useCallback(() => {
    if (farewellDisconnectingRef.current) return;
    farewellDisconnectingRef.current = true;
    latchFarewellClosing();
    micRef.current?.stop();
    optionsRef.current.onConversationEnd?.();
    optionsRef.current.onStatus?.("Call ended — tap Start voice to chat again.");
    disconnect(true);
    farewellDisconnectingRef.current = false;
    lastAssistantTextRef.current = "";
  }, [disconnect, latchFarewellClosing]);

  const handleMessage = useCallback(
    async (message: LiveMessage) => {
      const calls = message.toolCall?.functionCalls ?? [];
      if (calls.length > 0 && sessionRef.current) {
        const responses = [];
        const bundledWeatherLookup =
          calls.some((c) => c.name === "confirm_weather_zip") &&
          calls.some((c) => c.name === "lookup_weather");

        for (const call of calls) {
          const name = call.name ?? "";
          const args = (call.args ?? {}) as Record<string, unknown>;

          if (name === "lookup_weather" && bundledWeatherLookup) {
            responses.push({
              id: call.id,
              name,
              response: {
                ok: false,
                error:
                  "Speak spokenConfirm and wait for yes — then call lookup_weather alone with userConfirmed true, not in the same turn as confirm_weather_zip.",
              },
            });
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

          if (name === "verify_code" && result.verified === true) {
            queuePhaseTransition({ kind: "verified", nextMode: "demo" });
          }

          if (name === "end_conversation") {
            if (farewellDisconnectingRef.current || jarvisFarewellSentRef.current) {
              responses.push({
                id: call.id,
                name,
                response: {
                  ok: true,
                  endCall: true,
                  message: "Call already ending. Stay completely silent.",
                },
              });
              continue;
            }

            const inWeatherZipFlow =
              awaitingZipDigitsRef.current ||
              awaitingZipConfirmRef.current ||
              awaitingWeatherForecastDeliveryRef.current ||
              zipDigitsHeardMaxRef.current > 0;
            if (inWeatherZipFlow && result.endCall === true && !goodbyeNudgeSentRef.current) {
              responses.push({
                id: call.id,
                name,
                response: {
                  ok: false,
                  error:
                    "Weather ZIP flow is incomplete. Call confirm_weather_zip with the ZIP you heard, read it back, wait for yes, then lookup_weather. Do not end the call yet.",
                },
              });
              continue;
            }
            if (result.endCall === true) {
              void finishConversation();
            }
          }

          responses.push({
            id: call.id,
            name,
            response: result,
          });
        }
        sessionRef.current.sendToolResponse({ functionResponses: responses });
      }

      if (message.serverContent?.interrupted) {
        handleAssistantInterrupted();
      }

      const parts = message.serverContent?.modelTurn?.parts ?? [];
      if (!suppressAssistantAudioRef.current) {
        for (const part of parts) {
          const data = part.inlineData?.data;
          const mime = part.inlineData?.mimeType ?? "";
          if (data && mime.includes("audio/pcm")) {
            if (jarvisFarewellSentRef.current) {
              playerRef.current?.hardStop();
              if (!farewellHoldSentRef.current && sessionRef.current) {
                farewellHoldSentRef.current = true;
                try {
                  sessionRef.current.sendClientContent({
                    turns: buildFarewellHoldNudge(),
                    turnComplete: true,
                  });
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

      const outText = message.serverContent?.outputTranscription?.text;
      if (outText) {
        lastAssistantTextRef.current = mergeTranscriptChunk(
          lastAssistantTextRef.current,
          outText
        );
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
      }
      const inText = message.serverContent?.inputTranscription?.text;
      if (inText) {
        if (inText.trim() && playerRef.current?.isPlaying()) {
          handleAssistantInterrupted();
        }
        clearWrapUpTimer();
        emitCaption("user", inText);
        const userLine = captionTextRef.current.trim();

        if (modeRef.current === "demo") {
          if (isUserSmallTalk(userLine)) {
            visitorAskedSubstantiveQuestionRef.current = false;
            clearWrapUpTimer();
          } else if (isUserSubstantiveQuestion(userLine)) {
            visitorAskedSubstantiveQuestionRef.current = true;
          }
        }

        if (awaitingWeatherYesNoRef.current && isWeatherOfferDecline(userLine)) {
          sendWeatherDeclineNudge();
        } else if (awaitingWeatherYesNoRef.current && isWeatherOfferAccept(userLine)) {
          awaitingWeatherYesNoRef.current = false;
          weatherYesNoPhaseRef.current = "first";
          lastWeatherOfferSigRef.current = "";
          clearWeatherYesNoTimer();
          awaitingZipDigitsRef.current = true;
          zipSilenceNudgedRef.current = false;
          zipSilencePhaseRef.current = "listening";
          zipDigitsHeardMaxRef.current = 0;
          zipNudgeTranscriptRef.current = "";
        }

        if (awaitingZipConfirmRef.current && isWeatherZipConfirmDecline(userLine)) {
          awaitingZipConfirmRef.current = false;
          awaitingZipDigitsRef.current = true;
          zipSilenceNudgedRef.current = false;
          zipSilencePhaseRef.current = "listening";
          zipNudgeTranscriptRef.current = "";
          lastZipPromptSigRef.current = "";
        } else if (awaitingZipConfirmRef.current && isWeatherZipConfirmAccept(userLine)) {
          clearZipSilenceTimer();
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

        if (awaitingZipDigitsRef.current && normalizeUsZipCode(userLine)) {
          clearZipSilenceTimer();
          if (!playerRef.current?.isPlaying()) {
            void sendZipDigitConfirmNudge(userLine);
          } else {
            void playerRef.current.whenPlaybackIdle(10000).then(() => {
              if (!awaitingZipDigitsRef.current || awaitingZipConfirmRef.current) return;
              void sendZipDigitConfirmNudge(captionTextRef.current.trim());
            });
          }
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
        if (!jarvisFarewellSentRef.current) {
          suppressAssistantAudioRef.current = false;
        }
        const assistantSnapshot = lastAssistantTextRef.current;
        if (modeRef.current === "demo" && isAssistantFarewell(assistantSnapshot)) {
          if (!jarvisFarewellSentRef.current) {
            latchFarewellClosing();
            scheduleFarewellHangup();
          }
        }
        if (modeRef.current === "demo") {
          detectAssistantWeatherPrompt(assistantSnapshot);
          if (isAssistantWrapUpQuestion(assistantSnapshot)) {
            clearWrapUpTimer();
            awaitingWeatherForecastDeliveryRef.current = false;
          } else if (isAssistantWeatherForecast(assistantSnapshot)) {
            awaitingWeatherForecastDeliveryRef.current = false;
            scheduleWeatherForecastGoodbye();
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
      clearWrapUpTimer,
      handleAssistantInterrupted,
      detectAssistantWeatherPrompt,
      emitCaption,
      endCallNow,
      finishConversation,
      finishPendingPhase,
      latchFarewellClosing,
      scheduleFarewellHangup,
      queuePhaseTransition,
      runTool,
      schedulePhoneSilenceNudge,
      scheduleZipSilenceNudge,
      scheduleWeatherYesNoNudge,
      scheduleWeatherForecastGoodbye,
      scheduleWrapUpPause,
      sendWeatherDeclineNudge,
      sendZipDigitConfirmNudge,
      setAwaitingPhoneDigits,
      syncPhoneCollectionState,
      syncWeatherCollectionState,
    ]
  );

  const connect = useCallback(
    async (mode: VoiceDemoLiveMode) => {
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
      lastAssistantTextRef.current = "";
      greetingSentRef.current = false;
      suppressAssistantAudioRef.current = false;
      awaitingWeatherForecastDeliveryRef.current = false;
      visitorAskedSubstantiveQuestionRef.current = false;
      zipSilenceNudgedRef.current = false;
      lastClientWeatherNudgeAtRef.current = 0;
      lastWeatherOfferSigRef.current = "";
      lastZipPromptSigRef.current = "";
      resetCaption();
      disconnect(true);
      setError("");
      setConnecting(true);
      modeRef.current = mode;
      optionsRef.current.onStatus?.(
        "Connecting…"
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

        clearPhoneCollectionState();
        clearWeatherZipState();

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
              startOrbLoop();
              optionsRef.current.onStatus?.(voiceDemoOpeningStatus(mode));
              setTimeout(() => {
                if (sessionRef.current) {
                  sendOpeningGreeting(sessionRef.current);
                }
              }, 0);
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
    [
      clearPendingFallback,
      clearPhoneCollectionState,
      clearWeatherZipState,
      disconnect,
      handleMessage,
      sendOpeningGreeting,
      startOrbLoop,
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
  };
}
