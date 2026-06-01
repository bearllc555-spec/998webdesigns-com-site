"use client";

import { useState } from "react";
import { faq } from "@/data/faq";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="max-w-xs">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
              FAQ
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium leading-tight md:text-5xl">
              Plain answers to fair questions.
            </h2>
          </div>

          <div className="md:col-span-2">
            <ul className="divide-y divide-rule rounded-2xl border border-rule bg-bg">
          {faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start justify-between gap-6 px-6 py-5 text-left transition hover:bg-rule-soft/60"
                >
                  <span className="font-display text-lg font-medium text-ink">
                    {item.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`mt-1 shrink-0 transition ${isOpen ? "rotate-45 text-accent" : "text-ink-soft"}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-base leading-relaxed text-ink-soft">
                    {item.a}
                  </div>
                )}
              </li>
            );
          })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
