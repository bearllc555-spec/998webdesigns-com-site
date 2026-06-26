"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  AESTHETICS_BOOKING_INTENT_EVENT,
  type AestheticsBookingDetail,
  type AestheticsBookingIntent,
} from "@/lib/aesthetics-demo-booking";
import { formatPhoneInput } from "@/lib/format-phone-input";
import type { DemoBrandConfig } from "@/lib/demo-config/types";
import { MedSpaBookingModal, type MedSpaBookingSchedule } from "@/components/demo/aesthetics/MedSpaBookingModal";

type BookingFormIntent = AestheticsBookingIntent;

type GuestDetails = {
  name: string;
  email: string;
  phone: string;
  contactPref: "text" | "call" | "email";
};

type MedSpaBookingSectionProps = {
  config: DemoBrandConfig;
};

export function MedSpaBookingSection({ config }: MedSpaBookingSectionProps) {
  const [intent, setIntent] = useState<BookingFormIntent | null>(null);
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [contactPref, setContactPref] = useState<"text" | "call" | "email">("text");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [schedule, setSchedule] = useState<MedSpaBookingSchedule | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const fieldStyle: CSSProperties = {
    backgroundColor: config.palette.bg,
    color: config.palette.ink,
    borderColor: `${config.palette.muted}44`,
  };

  const phoneRequired = contactPref === "text" || contactPref === "call";
  const detailsEnabled = intent != null;

  useEffect(() => {
    function onBookingIntent(e: Event) {
      const detail = (e as CustomEvent<AestheticsBookingDetail>).detail;
      if (detail?.intent === "contact") {
        setIntent("contact");
        setSelectedService(undefined);
        window.setTimeout(() => {
          document.getElementById("booking-message")?.focus({ preventScroll: true });
        }, 450);
      } else if (detail?.intent === "book" || detail?.serviceName) {
        setIntent("book");
        if (detail?.serviceName) setSelectedService(detail.serviceName);
        window.setTimeout(() => {
          document.getElementById("booking-name")?.focus({ preventScroll: true });
        }, 450);
      }
    }

    window.addEventListener(AESTHETICS_BOOKING_INTENT_EVENT, onBookingIntent);
    return () => window.removeEventListener(AESTHETICS_BOOKING_INTENT_EVENT, onBookingIntent);
  }, []);

  function validateBase(): boolean {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      setError("Please enter your name.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email.");
      return false;
    }
    if (phoneRequired && !phone.trim()) {
      setError("Please add a cell number so we can reach you.");
      return false;
    }
    setError("");
    return true;
  }

  function handleSendMessage() {
    if (!intent) {
      setError("Choose how we can help — a question or a booking.");
      return;
    }
    if (!validateBase()) return;
    if (message.trim().length < 10) {
      setError("Please tell us what you'd like to know — a sentence or two is enough.");
      return;
    }
    setError("");
    setContactSubmitted(true);
  }

  function handleContinueToCalendar() {
    if (!intent) {
      setError("Choose how we can help — a question or a booking.");
      return;
    }
    if (!validateBase()) return;
    setModalOpen(true);
  }

  function handleReset() {
    setContactSubmitted(false);
    setBookingSubmitted(false);
    setSchedule(null);
    setIntent(null);
    setSelectedService(undefined);
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setContactPref("text");
    setError("");
  }

  function handleIntentChange(next: BookingFormIntent) {
    setIntent(next);
    setError("");
    if (next === "book") setMessage("");
  }

  const borderColor = `${config.palette.muted}44`;

  return (
    <section id="book" className="scroll-mt-24 py-14" aria-label="Contact and booking">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em]" style={{ color: config.palette.accent }}>
            {config.booking.eyebrow}
          </p>
          <h2
            className="text-4xl leading-[0.95] sm:text-5xl"
            style={{ fontFamily: config.fonts.display, color: config.palette.headline }}
          >
            <span className="font-light italic">{config.booking.headlineLead}</span>
            <br />
            <span className="font-semibold">{config.booking.headlineAccent}</span>
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed" style={{ color: config.palette.muted }}>
            {config.booking.sub}
          </p>
          <dl className="mt-8 space-y-3 text-sm" style={{ color: config.palette.ink }}>
            <div className="flex items-center gap-3">
              <dt className="w-16 text-[11px] uppercase tracking-[0.18em]" style={{ color: config.palette.muted }}>
                Where
              </dt>
              <dd>{config.address}</dd>
            </div>
            <div className="flex items-center gap-3">
              <dt className="w-16 text-[11px] uppercase tracking-[0.18em]" style={{ color: config.palette.muted }}>
                Hours
              </dt>
              <dd>{config.hours.replace(" · Closed Sun–Mon", "")}</dd>
            </div>
            <div className="flex items-center gap-3">
              <dt className="w-16 text-[11px] uppercase tracking-[0.18em]" style={{ color: config.palette.muted }}>
                Call
              </dt>
              <dd>
                <a href={`tel:${config.phoneTel}`} className="hover:underline">
                  {config.phone}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-7">
          {contactSubmitted ? (
            <SuccessPanel
              config={config}
              title="Got it. Thank you."
              body="The front desk will reply within 4 hours. Keep an eye on your inbox."
              detail={`Message for ${name.trim()} at ${email.trim()}.`}
              extra={message.trim()}
              onReset={handleReset}
              resetLabel="Send another message"
            />
          ) : bookingSubmitted && schedule ? (
            <SuccessPanel
              config={config}
              title="You're on the calendar."
              body={`${schedule.dateLabel} at ${schedule.selectedSlot} · ${schedule.treatment}.`}
              detail={`Confirmation for ${name.trim()} at ${email.trim()}.`}
              onReset={handleReset}
              resetLabel="Book another"
            />
          ) : (
            <div
              className="rounded-2xl border p-6 sm:p-8"
              style={{
                borderColor,
                backgroundColor: `${config.palette.surface}`,
              }}
            >
              <IntentToggle config={config} intent={intent} onChange={handleIntentChange} />

              {intent === "book" && selectedService ? (
                <div
                  className="mt-5 flex items-start justify-between gap-4 rounded-xl border px-4 py-3.5"
                  style={{
                    borderColor: `${config.palette.accent}55`,
                    backgroundColor: `${config.palette.accent}12`,
                  }}
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: config.palette.accent }}>
                      Selected treatment
                    </p>
                    <p className="mt-1 font-medium" style={{ fontFamily: config.fonts.display, color: config.palette.headline }}>
                      {selectedService}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedService(undefined)}
                    className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                    style={{ borderColor, color: config.palette.muted }}
                  >
                    Clear
                  </button>
                </div>
              ) : null}

              <fieldset
                disabled={!detailsEnabled}
                className={`mt-5 space-y-5 border-0 p-0 ${detailsEnabled ? "" : "pointer-events-none opacity-45"}`}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField
                    label="Your name"
                    id="booking-name"
                    value={name}
                    onChange={setName}
                    placeholder="First and last"
                    fieldStyle={fieldStyle}
                  />
                  <FormField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    fieldStyle={fieldStyle}
                  />
                </div>

                <div>
                  <label className="block sm:max-w-[50%]">
                    <span className="mb-2 block text-[11px] uppercase tracking-[0.18em]" style={{ color: config.palette.muted }}>
                      Cell number{phoneRequired ? "" : " (optional)"}
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                      placeholder="(000) 000-0000"
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2"
                      style={fieldStyle}
                    />
                  </label>
                  <fieldset className="mt-4 border-0 p-0">
                    <legend className="mb-2 block text-[11px] uppercase tracking-[0.18em]" style={{ color: config.palette.muted }}>
                      How should we reach you?
                    </legend>
                    <div className="flex flex-col gap-2">
                      <ContactPref label="I would prefer you to text message." value="text" current={contactPref} onChange={setContactPref} config={config} />
                      <ContactPref label="I would prefer you to call" value="call" current={contactPref} onChange={setContactPref} config={config} />
                      <ContactPref label="I would prefer you to email" value="email" current={contactPref} onChange={setContactPref} config={config} />
                    </div>
                  </fieldset>
                </div>

                {intent === "contact" ? (
                  <label className="block">
                    <span className="mb-2 block text-[11px] uppercase tracking-[0.18em]" style={{ color: config.palette.muted }}>
                      Your question
                    </span>
                    <textarea
                      id="booking-message"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="First visit, sensitive skin, pricing — anything that helps us reply."
                      className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none"
                      style={fieldStyle}
                    />
                  </label>
                ) : null}
              </fieldset>

              {error ? (
                <p className="mt-4 text-sm" style={{ color: config.palette.accent }}>
                  {error}
                </p>
              ) : null}

              {intent === "contact" ? (
                <div className="mt-5 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor }}>
                  <p className="text-xs uppercase tracking-[0.16em]" style={{ color: config.palette.muted }}>
                    Reply within 4 hours · No spam, ever
                  </p>
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    className="rounded-full px-6 py-3 text-sm font-medium text-white"
                    style={{ backgroundColor: config.palette.accent }}
                  >
                    Send message
                  </button>
                </div>
              ) : null}

              {intent === "book" ? (
                <div className="mt-5 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor }}>
                  <p className="text-xs uppercase tracking-[0.16em]" style={{ color: config.palette.muted }}>
                    Treatment & time on the next step
                  </p>
                  <button
                    type="button"
                    onClick={handleContinueToCalendar}
                    disabled={!detailsEnabled}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white disabled:opacity-40"
                    style={{ backgroundColor: config.palette.accent }}
                  >
                    Continue to calendar
                    <span aria-hidden>→</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <MedSpaBookingModal
        config={config}
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialTreatment={selectedService}
        guestName={name.trim()}
        guestEmail={email.trim().toLowerCase()}
        onConfirmed={(payload) => {
          setSchedule(payload);
          setBookingSubmitted(true);
          setModalOpen(false);
        }}
      />
    </section>
  );
}

function IntentToggle({
  config,
  intent,
  onChange,
}: {
  config: DemoBrandConfig;
  intent: BookingFormIntent | null;
  onChange: (next: BookingFormIntent) => void;
}) {
  const borderColor = `${config.palette.muted}44`;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: config.palette.muted }}>
        How can we help?
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="How can we help?">
        <IntentOption
          label="I have a question"
          description="Send a message — we'll reply within 4 hours."
          selected={intent === "contact"}
          onClick={() => onChange("contact")}
          config={config}
          borderColor={borderColor}
        />
        <IntentOption
          label="Choose a treatment & time"
          description="Pick a service on the calendar and confirm."
          selected={intent === "book"}
          onClick={() => onChange("book")}
          config={config}
          borderColor={borderColor}
        />
      </div>
    </div>
  );
}

function IntentOption({
  label,
  description,
  selected,
  onClick,
  config,
  borderColor,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  config: DemoBrandConfig;
  borderColor: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className="rounded-xl border px-4 py-3.5 text-left transition"
      style={{
        borderColor: selected ? config.palette.accent : borderColor,
        backgroundColor: selected ? `${config.palette.accent}14` : config.palette.bg,
      }}
    >
      <span className="block text-sm font-semibold" style={{ color: selected ? config.palette.headline : config.palette.muted }}>
        {label}
      </span>
      <span className="mt-1 block text-xs leading-relaxed" style={{ color: config.palette.muted }}>
        {description}
      </span>
    </button>
  );
}

function ContactPref({
  label,
  value,
  current,
  onChange,
  config,
}: {
  label: string;
  value: "text" | "call" | "email";
  current: "text" | "call" | "email";
  onChange: (v: "text" | "call" | "email") => void;
  config: DemoBrandConfig;
}) {
  const checked = current === value;
  return (
    <button type="button" role="radio" aria-checked={checked} onClick={() => onChange(value)} className="flex items-center gap-2 text-left">
      <span
        className="flex h-4 w-4 items-center justify-center rounded border"
        style={{
          borderColor: checked ? config.palette.accent : `${config.palette.muted}66`,
          backgroundColor: checked ? config.palette.accent : config.palette.bg,
        }}
      >
        {checked ? (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
            <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="text-[13px]" style={{ color: checked ? config.palette.ink : config.palette.muted }}>
        {label}
      </span>
    </button>
  );
}

function FormField({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  fieldStyle,
}: {
  label: string;
  id?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  fieldStyle: CSSProperties;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] opacity-70" style={{ color: fieldStyle.color }}>
        {label}
      </span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
        style={fieldStyle}
      />
    </label>
  );
}

function SuccessPanel({
  config,
  title,
  body,
  detail,
  extra,
  onReset,
  resetLabel,
}: {
  config: DemoBrandConfig;
  title: string;
  body: string;
  detail: string;
  extra?: string;
  onReset: () => void;
  resetLabel: string;
}) {
  const borderColor = `${config.palette.muted}44`;
  return (
    <div className="rounded-2xl border p-6 sm:p-8" style={{ borderColor, backgroundColor: config.palette.surface }}>
      <div
        className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: config.palette.accent }}
      >
        ✓
      </div>
      <p className="text-center text-2xl italic" style={{ fontFamily: config.fonts.display, color: config.palette.headline }}>
        {title}
      </p>
      <p className="mx-auto mt-3 max-w-md text-center text-sm" style={{ color: config.palette.muted }}>
        {body}
      </p>
      <p className="mt-2 text-center text-sm" style={{ color: config.palette.muted }}>
        {detail}
      </p>
      {extra ? (
        <p
          className="mx-auto mt-4 max-w-md rounded-xl border px-4 py-3 text-left text-sm"
          style={{ borderColor, color: config.palette.ink, backgroundColor: config.palette.bg }}
        >
          {extra}
        </p>
      ) : null}
      <p className="mt-6 text-center text-xs uppercase tracking-[0.16em]" style={{ color: config.palette.muted }}>
        Demo — nothing here is charged or saved.
      </p>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border px-5 py-2.5 text-sm font-medium"
          style={{ borderColor, color: config.palette.ink }}
        >
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
