# Jarvis voice demo — ops monitoring

Every live session writes structured events to `voice_demo_leads.ops_log` (max 80 events). Reconnects, `goAway`, deferred tools, and circuit-breaker pauses are logged automatically from `hooks/use-voice-demo-live.ts`.

## During a call (plumbing demo)

On `/demo/plumbers`, after **Start voice**, a **Live session trace** panel appears under the mic when events fire. Expand it to see the timeline and auto-diagnosis. Warnings expand by default.

## After a call (Demo CRM)

Open `/demo/plumbers/crm` → expand the caller → **Session event log**. Use **Copy for debug** and paste into Cursor — no need to retell what happened.

## CLI report (local)

From repo root with `.env.local` wired to helmet:

```bash
npm run voice-demo:ops-report
npm run voice-demo:ops-report -- --plumbers
npm run voice-demo:ops-report -- --email you@example.com
npm run voice-demo:ops-report -- --id <lead-uuid>
npm run voice-demo:ops-report -- --plumbers --limit 10
```

## What to look for

| Log message | Meaning |
|-------------|---------|
| `Gemini goAway` | Google is ending the live socket (~10 min limit). Reconnect waits for assistant audio to finish. |
| `Scheduling live reconnect` | Client auto-retry (up to 4 on plumbing). |
| `Live reconnect paused` | Circuit breaker — tap **Start voice** once. |
| `Deferred tool response` | Drop happened during `save_plumbing_contact` / `book_plumbing_appointment`. |
| `Deferred live reconnect until tool completes` | Mic gated + reconnect held until book/save tool returns (1008 fix). |
| `Deferred live reconnect until session resumable` | goAway held until Gemini `resumable=true` (context-loss fix). |
| `Session not resumable` | Tool or generation in flight on server — normal during booking. |
| `Plumbing mid-call silence — listen nudge sent` | Caller spoke mid-call; Jarvis idle ~3.5s — client nudged model to respond. |
| `Cleared stuck suppressAssistantAudio after interrupt timeout` | Barge-in muted assistant audio; 4s safety valve cleared mute. |
| `token_fetch_failed` | Env/API issue, not caller behavior. |

## Files

| File | Role |
|------|------|
| `docs/jarvis-plumbing-appointment-flow.md` | Canonical golden-path appointment flow (intake, coupon, exit) |
| `lib/voice-demo-ops-client.ts` | Browser → `POST /api/voice-demo/ops-event` |
| `lib/voice-demo-ops-diagnose.ts` | Rule-based summary for CRM / CLI |
| `scripts/voice-demo-ops-report.mjs` | Pull timelines from Supabase |
| `components/demo/VoiceDemoOpsTimeline.tsx` | CRM + copy button |
| `components/demo/VoiceDemoLiveOpsTrace.tsx` | Live tail on plumbing widget |
