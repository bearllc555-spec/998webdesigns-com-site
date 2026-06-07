import { GoogleGenAI, Modality } from "@google/genai";

function loadKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY missing (use: vercel env run -e production -- node …)");
  return key;
}

const MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

async function tryCreate(label, config) {
  const apiKey = loadKey();
  const ai = new GoogleGenAI({ apiKey });
  try {
    const authToken = await ai.authTokens.create({ config });
    console.log(label, "OK", authToken.name?.slice(0, 40) + "...");
    return true;
  } catch (err) {
    console.error(label, "FAIL", err?.message ?? err);
    if (err?.cause) console.error(" cause:", err.cause);
    return false;
  }
}

const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

await tryCreate("without-v1alpha", {
  uses: 1,
  expireTime,
  liveConnectConstraints: {
    model: MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  },
});

await tryCreate("with-v1alpha", {
  uses: 1,
  expireTime,
  liveConnectConstraints: {
    model: MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  },
  httpOptions: { apiVersion: "v1alpha" },
});
