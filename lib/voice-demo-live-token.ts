import { GoogleGenAI, Modality } from "@google/genai";
import {
  VOICE_DEMO_LIVE_MODEL,
  VOICE_DEMO_VOICE_NAME,
} from "@/lib/voice-demo-constants";
import { getVoiceDemoLead } from "@/lib/voice-demo-db";
import {
  voiceDemoDemoSystemPrompt,
  voiceDemoVerifySystemPrompt,
} from "@/lib/voice-demo-system-prompt";
import {
  voiceDemoToolDeclarations,
  type VoiceDemoToolMode,
} from "@/lib/voice-demo-tools";

export function geminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

export async function createVoiceDemoLiveToken(
  leadId: string,
  mode: VoiceDemoToolMode
): Promise<{ ok: true; token: string; model: string } | { ok: false; error: string }> {
  const apiKey = geminiApiKey();
  if (!apiKey) {
    return { ok: false, error: "Voice demo is not configured (GEMINI_API_KEY)." };
  }

  const row = await getVoiceDemoLead(leadId);
  if (!row) {
    return { ok: false, error: "Session not found." };
  }

  if (mode === "demo" && !row.email_verified_at && !row.phone_verified_at) {
    return { ok: false, error: "Verify your code first." };
  }

  const systemInstruction =
    mode === "verify" ? voiceDemoVerifySystemPrompt(row) : voiceDemoDemoSystemPrompt(row);

  const ai = new GoogleGenAI({ apiKey });
  const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  try {
    const authToken = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        liveConnectConstraints: {
          model: VOICE_DEMO_LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            tools: voiceDemoToolDeclarations(mode),
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: VOICE_DEMO_VOICE_NAME },
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
      },
    });

    const token = authToken.name;
    if (!token) {
      return { ok: false, error: "Could not create live session token." };
    }

    return { ok: true, token, model: VOICE_DEMO_LIVE_MODEL };
  } catch (err) {
    console.warn("[voice-demo-live-token]", err);
    return { ok: false, error: "Could not start voice session." };
  }
}
