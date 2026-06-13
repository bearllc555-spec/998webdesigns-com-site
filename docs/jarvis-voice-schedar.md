# Jarvis voice - Schedar (locked reference)

Canonical snapshot of the 998 homepage voice demo stack as of **v34.17**.  
Use this file to restore or compare voice settings if production drifts.

## One-liner

```
Jarvis = Gemini Live gemini-2.5-flash-native-audio-preview-12-2025 + prebuilt voice "Schedar" + client playback 0.95 + British butler persona
```

## Gemini Live (server - locked at ephemeral token creation)

| Parameter | Value |
|-----------|--------|
| Prebuilt voice name | `Schedar` |
| Model | `gemini-2.5-flash-native-audio-preview-12-2025` |
| API version | `v1alpha` |
| Response modality | `AUDIO` only |

**Not set in repo** (Gemini defaults apply): `temperature`, `languageCode`, `speakingRate`, `pitch`, custom voice IDs.

### `speechConfig` JSON (as wired today)

```json
{
  "voiceName": "Schedar",
  "model": "gemini-2.5-flash-native-audio-preview-12-2025",
  "apiVersion": "v1alpha",
  "responseModalities": ["AUDIO"],
  "speechConfig": {
    "voiceConfig": {
      "prebuiltVoiceConfig": {
        "voiceName": "Schedar"
      }
    }
  },
  "inputAudioTranscription": {},
  "outputAudioTranscription": {},
  "sessionResumption": {}
}
```

### Ephemeral token limits

| Parameter | Value |
|-----------|--------|
| Uses per token | `1` |
| Token expire | 30 minutes |
| New session expire | 2 minutes |

## Client playback (browser)

| Parameter | Value |
|-----------|--------|
| Assistant playback rate | `0.95` (5% slower) |
| Mic send sample rate | `16000` Hz PCM |
| Assistant receive sample rate | `24000` Hz PCM |
| Mic MIME sent to Gemini | `audio/pcm;rate=16000` |

## Persona (system prompt - shapes delivery, not a voice API knob)

From `VOICE_DEMO_PERSONA` in `lib/voice-demo-system-prompt.ts`:

- **Character:** Jarvis - refined British butler; calm, precise, understated dry wit
- **Address:** "sir" / "madam" until the visitor shares a name
- **Tone:** Laid-back and chill - never salesy, cartoonish, or theatrical
- **Pacing:** Speak slowly; one thought at a time; brief pauses between sentences; one question per turn
- **Barge-in:** Stop immediately when the visitor speaks; do not talk over them

## Repo source of truth

| File | What it controls |
|------|------------------|
| `lib/voice-demo-constants.ts` | `VOICE_DEMO_VOICE_NAME`, `VOICE_DEMO_LIVE_MODEL`, `VOICE_DEMO_PLAYBACK_RATE` |
| `lib/voice-demo-live-token.ts` | `speechConfig` + model locked into Gemini auth token |
| `lib/voice-demo-audio-client.ts` | 16 kHz in / 24 kHz out, `playbackRate` on assistant audio |
| `lib/voice-demo-system-prompt.ts` | Jarvis persona, pacing, closing etiquette |

## Constants (copy-paste)

```ts
export const VOICE_DEMO_LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
export const VOICE_DEMO_VOICE_NAME = "Schedar";
export const VOICE_DEMO_PLAYBACK_RATE = 0.95;
```

## Why the voice can sound slightly different between sessions

The **voice name has not changed** - it is always `Schedar`. Perceived drift usually comes from:

- Google updating the native-audio **preview** model
- Session **reconnect** / `goAway` resumption
- Different **utterance length** or interruption patterns
- Client **playback rate** `0.95` vs raw model output

## Restore checklist

1. Confirm `VOICE_DEMO_VOICE_NAME === "Schedar"` in `lib/voice-demo-constants.ts`
2. Confirm `VOICE_DEMO_LIVE_MODEL` matches the table above
3. Confirm `lib/voice-demo-live-token.ts` still passes `prebuiltVoiceConfig: { voiceName: VOICE_DEMO_VOICE_NAME }`
4. Confirm `VOICE_DEMO_PLAYBACK_RATE === 0.95` in `lib/voice-demo-audio-client.ts`
5. Re-read `VOICE_DEMO_PERSONA` has not been softened or rushed
