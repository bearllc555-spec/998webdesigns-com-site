"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DemoBrandConfig } from "@/lib/demo-config/types";

export type MedSpaBookingSchedule = {
  treatment: string;
  selectedDay: number;
  selectedSlot: string;
  dateLabel: string;
  guestName: string;
  guestEmail: string;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const TIME_SLOTS = ["10:00 AM", "11:30 AM", "1:00 PM", "3:00 PM", "5:30 PM"];

type DayStatus = "blank" | "past" | "closed" | "booked" | "available";
type DayCell = { day: number | null; status: DayStatus };

function takenSlotsFor(day: number): Set<string> {
  if (day % 3 === 0) return new Set(["11:30 AM", "3:00 PM"]);
  if (day % 2 === 0) return new Set(["1:00 PM"]);
  return new Set(["10:00 AM", "5:30 PM"]);
}

type MedSpaBookingModalProps = {
  config: DemoBrandConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTreatment?: string;
  guestName: string;
  guestEmail: string;
  onConfirmed: (payload: MedSpaBookingSchedule) => void;
};

export function MedSpaBookingModal({
  config,
  open,
  onOpenChange,
  initialTreatment,
  guestName,
  guestEmail,
  onConfirmed,
}: MedSpaBookingModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [treatment, setTreatment] = useState(initialTreatment ?? "");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const calendar = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

    const cells: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, status: "blank" });
    for (let d = 1; d <= daysInMonth; d++) {
      const wd = new Date(year, month, d).getDay();
      let status: DayStatus;
      if (d < todayDate) status = "past";
      else if (wd === 0 || wd === 1) status = "closed";
      else if (d % 5 === 0) status = "booked";
      else status = "available";
      cells.push({ day: d, status });
    }
    return { year, month, monthLabel, cells };
  }, []);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    setTreatment(initialTreatment ?? "");
    setSelectedDay(null);
    setSelectedSlot(null);
    setConfirmed(false);
  }, [open, initialTreatment]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [open, close]);

  const selectedDateLabel = useMemo(() => {
    if (selectedDay == null) return "";
    return new Date(calendar.year, calendar.month, selectedDay).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [selectedDay, calendar]);

  const canConfirm = Boolean(treatment && selectedDay != null && selectedSlot);

  function confirm() {
    if (!canConfirm || selectedDay == null || !selectedSlot) return;
    const payload: MedSpaBookingSchedule = {
      treatment,
      selectedDay,
      selectedSlot,
      dateLabel: selectedDateLabel,
      guestName,
      guestEmail,
    };
    setConfirmed(true);
    onConfirmed(payload);
  }

  if (!open) return null;

  const taken = selectedDay != null ? takenSlotsFor(selectedDay) : new Set<string>();
  const fieldBorder = `${config.palette.muted}44`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={close} aria-hidden />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="medspa-booking-title"
        tabIndex={-1}
        className="relative z-10 max-h-[85svh] w-full max-w-[880px] overflow-y-auto rounded-t-3xl border shadow-2xl outline-none sm:max-h-[90vh] sm:rounded-3xl"
        style={{
          borderColor: fieldBorder,
          backgroundColor: config.palette.surface,
        }}
      >
        <div
          className="flex items-start justify-between gap-6 border-b px-7 py-6 sm:px-10"
          style={{ borderColor: fieldBorder }}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: config.palette.accent }}>
              Reserve · Live demo
            </p>
            <h2
              id="medspa-booking-title"
              className="mt-2 text-[28px] leading-tight sm:text-[34px]"
              style={{ fontFamily: config.fonts.display, color: config.palette.headline }}
            >
              Choose your time
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-full px-3 py-1 text-sm opacity-60 hover:opacity-100"
            style={{ color: config.palette.ink }}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {confirmed ? (
          <div className="px-7 py-10 text-center sm:px-10">
            <div
              className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: config.palette.accent }}
            >
              ✓
            </div>
            <p className="text-2xl italic" style={{ fontFamily: config.fonts.display, color: config.palette.headline }}>
              You&apos;re on the calendar.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: config.palette.muted }}>
              {selectedDateLabel} at {selectedSlot} · {treatment}. Confirmation for {guestName} at{" "}
              {guestEmail}.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.16em]" style={{ color: config.palette.muted }}>
              Demo — nothing here is charged or saved.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-6 rounded-full border px-5 py-2.5 text-sm font-medium"
              style={{ borderColor: fieldBorder, color: config.palette.ink }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="grid gap-8 px-7 py-8 sm:grid-cols-2 sm:px-10">
            <div>
              <label className="block">
                <span
                  className="mb-2 block text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: config.palette.muted }}
                >
                  Treatment
                </span>
                <select
                  value={treatment}
                  onChange={(e) => {
                    setTreatment(e.target.value);
                    setSelectedDay(null);
                    setSelectedSlot(null);
                  }}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  style={{
                    borderColor: fieldBorder,
                    backgroundColor: config.palette.bg,
                    color: config.palette.ink,
                  }}
                >
                  <option value="">Select a treatment</option>
                  {config.services.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mb-4 mt-6 flex items-baseline justify-between">
                <p className="text-xl italic" style={{ fontFamily: config.fonts.display, color: config.palette.headline }}>
                  {calendar.monthLabel}
                </p>
                <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: config.palette.muted }}>
                  Tue – Sat
                </p>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    className="pb-1 text-center text-[10px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: config.palette.muted }}
                  >
                    {w}
                  </div>
                ))}
                {calendar.cells.map((cell, i) => {
                  if (cell.status === "blank") {
                    return <div key={`b-${i}`} className="aspect-square" />;
                  }
                  if (cell.status === "available") {
                    const isSel = selectedDay === cell.day;
                    return (
                      <button
                        key={cell.day}
                        type="button"
                        disabled={!treatment}
                        onClick={() => {
                          setSelectedDay(cell.day);
                          setSelectedSlot(null);
                        }}
                        className="flex aspect-square items-center justify-center rounded-xl text-sm font-medium transition"
                        style={{
                          backgroundColor: isSel ? config.palette.accent : config.palette.bg,
                          color: isSel ? "#fff" : treatment ? config.palette.ink : `${config.palette.muted}88`,
                          border: `1px solid ${isSel ? config.palette.accent : `${config.palette.muted}44`}`,
                        }}
                      >
                        {cell.day}
                      </button>
                    );
                  }
                  if (cell.status === "booked") {
                    return (
                      <div
                        key={cell.day}
                        className="flex aspect-square flex-col items-center justify-center rounded-xl text-xs line-through opacity-40"
                        style={{ backgroundColor: config.palette.bg, color: config.palette.muted }}
                      >
                        {cell.day}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={cell.day}
                      className="flex aspect-square items-center justify-center rounded-xl text-xs opacity-30"
                      style={{ color: config.palette.muted }}
                    >
                      {cell.day}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col">
              <p className="mb-1 text-xs uppercase tracking-[0.18em]" style={{ color: config.palette.muted }}>
                {selectedDay != null ? "Open times" : "Available times"}
              </p>
              {selectedDay == null ? (
                <div
                  className="flex flex-1 items-center rounded-2xl border border-dashed px-5 py-8 text-sm"
                  style={{ borderColor: fieldBorder, color: config.palette.muted }}
                >
                  {treatment
                    ? "Pick an available day on the calendar to see open appointment times."
                    : "Choose a treatment, then pick an available day."}
                </div>
              ) : (
                <>
                  <p className="mb-3 text-lg italic" style={{ fontFamily: config.fonts.display, color: config.palette.headline }}>
                    {selectedDateLabel}
                  </p>
                  <div className="flex flex-col gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isTaken = taken.has(slot);
                      const isSel = selectedSlot === slot;
                      if (isTaken) {
                        return (
                          <div
                            key={slot}
                            className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm line-through opacity-40"
                            style={{ borderColor: fieldBorder, color: config.palette.muted }}
                          >
                            {slot}
                            <span className="text-[10px] uppercase">Taken</span>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition"
                          style={{
                            borderColor: isSel ? config.palette.accent : fieldBorder,
                            backgroundColor: isSel ? config.palette.accent : config.palette.bg,
                            color: isSel ? "#fff" : config.palette.ink,
                          }}
                        >
                          {slot}
                          <span aria-hidden>{isSel ? "✓" : "→"}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <button
                type="button"
                disabled={!canConfirm}
                onClick={confirm}
                className="mt-5 w-full rounded-full px-6 py-4 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-30"
                style={{ backgroundColor: config.palette.accent }}
              >
                {!treatment ? "Choose a treatment" : canConfirm ? "Confirm booking" : "Pick a day and time"}
              </button>
              <p className="mt-4 text-[11px] leading-relaxed" style={{ color: config.palette.muted }}>
                Preview — your live site connects to your real scheduling (Acuity, Boulevard, Jane, and more).
                Nothing here is charged or saved.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
