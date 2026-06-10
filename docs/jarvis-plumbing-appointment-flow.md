# Jarvis plumbing — appointment flow (canonical reference)

**Status:** Golden-path reference — validated on production **v35.1** (2026-06).  
**Demo surface:** https://998webdesigns.com/demo/plumbers  
**Local:** http://localhost:3000/demo/plumbers  

This doc is the **operational spec** for how a perfect plumbing Jarvis call should run — intake order, coupon pitch, confirmations, booking, email, and hang-up. Product copy and FAQ ground truth live in [`jarvis_plumbing_complete.md`](./jarvis_plumbing_complete.md). Voice stack (Schedar, Gemini Live) lives in [`jarvis-voice-schedar.md`](./jarvis-voice-schedar.md). Session debugging: [`../VOICE-DEMO-OPS.md`](../VOICE-DEMO-OPS.md).

---

## What “perfect” looks like

A caller signs in with email → taps **Start voice** → Jarvis opens → they describe a problem (e.g. water heater) → Jarvis answers from knowledge → offers to schedule with the **$50 coupon** → collects contact info in **PA order** with read-backs → books → confirmation email (coupon inside, never read aloud) → optional FAQ → clean exit.

Jarvis stays on the line through the whole booking. No mid-call goodbye, no re-asking fields already confirmed, no reading promo codes on the phone.

---

## Call phases

| Phase | Jarvis behavior | Client safeguards |
|-------|-----------------|-------------------|
| **1. Sign-in** | Email gate before voice (`/api/voice-demo/plumbing/start`). | Lead row + `plumbing_demo` CRM source. |
| **2. Opening** | Fixed line: *"Thanks for calling Metro Plumbing and Drain — I'm Jarvis. How can I help you today?"* | Barge-in deferred during opening; post-opening silence nudge if model idle after caller speaks. |
| **3. Discovery / FAQ** | Listen first; answer from knowledge; one question per turn; offer next step after answers. | Mid-call silence nudge (3.5s) if caller spoke and Jarvis stays quiet; suppress-audio recovery after barge-in (4s). |
| **4. Booking offer** | First schedule invite includes **$50 coupon** in the same turn, before intake. | Prompt block: `PLUMBING_BOOKING_OFFER_BLOCK`. |
| **5. Contact intake** | PA order with one field per tool call + read-back + pause. | Hard block on address/phone/email until **full name** (first + last). Client contact-pause nudges after read-backs. |
| **6. Scheduling** | Service type, date, time window — only after contact confirmed. | `plumbingBookingMissingFields()` gates `book_plumbing_appointment`. |
| **7. Book + recap** | `book_plumbing_appointment` → warm recap (address, date, time, email on the way with coupon inside). | Confirmation email via Resend (`after()` — non-blocking for live WS). Unique promo code in email only. |
| **8. Continue or exit** | FAQ continues until caller clearly ends. | Exit triggers: bye, *that's all for now*, standalone *thank you* / *thanks* → concerns check → sign-off → hang-up. |

---

## Booking offer ($50 coupon)

**When:** The **first** time Jarvis invites scheduling — *before* collecting name, address, phone, or email.

**Say (natural paraphrase):**  
*"If you book an appointment with me right now, I'll send you a $50 coupon off any service with Metro Plumbing & Drain."*  
Then ask if they'd like to book (or start intake if they already said yes).

**Rules:**
- Do **not** save the coupon pitch for price hesitation or end of intake — lead with it at the offer.
- May mention again only if caller hesitates on price.
- **Never read the coupon code aloud** — it lives only in the confirmation email.
- After booking, Jarvis says the coupon is **inside the confirmation email** (check inbox and spam).

Source: `lib/voice-demo-plumbing-booking-offer.ts`

---

## Contact intake order (personal-assistant flow)

Collect and confirm **one field at a time**. After each field: `save_plumbing_contact` with **only that field**, read-back, wait for yes, then next field.

| # | Field | Notes |
|---|--------|--------|
| 1 | **Full name** | If only first name on file: *"I have [First] as your first name. How do I spell your last name?"* Spell last name letter-by-letter; confirm. **Blocked:** no address/phone/email until last name saved. |
| 2 | **Service address** | Read back; confirm; pause. |
| 3 | **Phone** | Read digits spaced; confirm; **extra pause** before jumping to scheduling. |
| 4 | **Email** | Pronounce full address; spell local part **one letter at a time** before @, then domain; confirm. Use demo-login email when on file. |
| 5 | **Service + schedule** | Service type, appointment date, time window — after contact complete. |

**Email spelling example:** `ademeo@gmail.com` → *"a d e m e o at gmail dot com"* — never *"a d e meo"*.

Source: `lib/voice-demo-plumbing-contact-confirm.ts` → `PLUMBING_BOOKING_INTAKE_ORDER`

---

## Tools (Gemini function calls)

| Tool | When |
|------|------|
| `save_plumbing_contact` | After each contact field — one field per call; returns reconfirm message + pause cue. |
| `book_plumbing_appointment` | All required fields present and confirmed; sends confirmation email + unique promo. |
| `send_plumbing_email` | Quote follow-up or after-hours only — **not** for standard booked appointments. |

**Required before book:** full name, service address, phone, email, service type, appointment date, time window (`lib/voice-demo-plumbing-booking-readiness.ts`).

---

## Exit sequence

Plumbing demo **does not** hang up mid-FAQ. Wrap-up only after the caller clearly ends the call.

**Triggers exit path:** bye, goodbye, hang up, *I gotta go*, *that's all for now*, standalone *thank you* / *thanks* (not *thank you for…* or *thanks and…*).

**Flow:**
1. Jarvis: *"Did I address all your concerns today?"*
2. If yes → final sign-off → post-farewell idle → End call glow → disconnect.
3. If no / new question → resume FAQ or booking; reset exit flags.

Booking continuation speech (address, water heater, schedule keywords, etc.) **resets** a false exit signal.

Source: `lib/voice-demo-plumbing-session.ts`, `hooks/use-voice-demo-live.ts`

---

## Emails (after book)

| Template | Trigger |
|----------|---------|
| `appointment` | Standard booked job |
| `emergency` | `isEmergency: true` on book |

Confirmation includes date, time window, address, service type, and **unique $50 promo code** when applied. Sent from `demo@metroplumbingdrain.com`. Full copy: `jarvis_plumbing_complete.md` + `lib/voice-demo-plumbing-email.ts`.

---

## CRM

Real plumbing demo sign-ins appear on main **`/crm`** under **Plumbing Jarvis demos** (`source: plumbing_demo`), one row per sign-in. Fake seed data for the demo CRM UI lives at `/demo/plumbers/crm` only.

Session ops timeline: expand caller → **Session event log** or live **Live session trace** on the widget during a call.

---

## Reliability (v35.1+)

| Symptom | Mechanism |
|---------|-----------|
| Silent after opening | Post-opening listen nudge (once). |
| Silent mid-call (e.g. during water-heater FAQ) | Mid-call silence nudge every 15s max after caller spoke. |
| Muted after barge-in | `suppressAssistantAudio` cleared on user speech, `turnComplete`, or 4s timeout. |
| WebSocket drop | Session resumption + auto-reconnect (up to 4 attempts on plumbing). |
| Ops noise | Session resumption handle logs throttled to 1× per 10s. |

---

## Implementation map

| Area | Files |
|------|--------|
| Live session hook | `hooks/use-voice-demo-live.ts` |
| System prompt | `lib/voice-demo-plumbing-system-prompt.ts` |
| Booking offer / coupon | `lib/voice-demo-plumbing-booking-offer.ts` |
| Intake order + read-backs | `lib/voice-demo-plumbing-contact-confirm.ts` |
| Booking readiness | `lib/voice-demo-plumbing-booking-readiness.ts` |
| Exit / continuation | `lib/voice-demo-plumbing-session.ts` |
| Opening + post-opening nudge | `lib/voice-demo-plumbing-opening.ts` |
| Mid-call silence | `lib/voice-demo-plumbing-mid-call-silence.ts` |
| Tools + email schedule | `lib/voice-demo-plumbing-tools.ts` |
| Knowledge (spoken answers) | `lib/voice-demo-plumbing-knowledge.ts` |
| Constants / opening line | `lib/voice-demo-plumbing-constants.ts` |
| Demo page | `app/demo/plumbers/` |
| Ops | `VOICE-DEMO-OPS.md`, `lib/voice-demo-ops-client.ts` |

---

## Changing this flow

1. **Prompt / behavior** — edit the `lib/voice-demo-plumbing-*` modules above; bump `lib/version.ts` on ship-visible changes.
2. **Product copy / FAQ / email bodies** — edit `docs/jarvis_plumbing_complete.md` and matching email templates; keep pricing/promo terms aligned.
3. **Regression check** — run a full call: sign-in → FAQ → booking offer with coupon → PA intake → book → email received → clean exit. Paste ops log from CRM if anything drifts.
