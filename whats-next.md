# 998webdesigns.com - whats next

Curated queue for this repo. Forward-looking only.

## Now

- **Prod migration:** Run `POST /api/admin/migrate-inbound-sms-wd-lead` (Bearer `BALANCE_CAPTURE_SECRET`) so inbound SMS links to Client rows via `inbound_sms.wd_lead_id`.

## Soon

- *(empty)*

## Later

- **Twilio ConversationRelay + Gemini voice agent** - AI answers inbound calls (after-hours / overflow qualifier; path to AI receptionist add-on). Reference: [twilio-cr-gemini-python](https://github.com/rishabkumar7/twilio-cr-gemini-python) (FastAPI + ConversationRelay WebSocket + Gemini + Twilio TTS). **Hosting note (updated 2026-06-30):** The old "Vercel-only Next.js" caveat is historical — production is on **Cloudflare Workers (OpenNext)** now; Vercel is decommissioned. The constraint that remains is **architecture**, not the host brand: ConversationRelay opens a **long-lived server-side WebSocket** (Twilio → your app). That is not the same as today's browser Jarvis demos (`/demo/*`), which connect **browser → Gemini Live** and only use 998 for REST (`/api/voice-demo/*`). For inbound **phone** relay, still plan a dedicated WebSocket service (CF Durable Object, Railway, Fly, small VM, etc.) or evaluate Twilio's hosted path — do not fold the relay into the main OpenNext Worker as ordinary HTTP routes. First slice: call → short qualifier → SMS `/book` link via existing SMS stack. Full build adds 998 policy in system prompt (hosting rules, 50/40/10 deposit, no pricing drift from `Pricing.tsx`), post-call CRM log (discovery/client row + transcript summary), Telegram alert, recording/transcript compliance. Voice webhook is separate Twilio number config (same number can do SMS + voice if enabled).

- **Twilio WhatsApp** - Same Messages API + inbound webhook shape as SMS; Meta template rules for cold outbound. Revisit when clients ask for WhatsApp or richer two-way chat on Client row. Phase 1 would reuse inbound → CRM thread pattern.
