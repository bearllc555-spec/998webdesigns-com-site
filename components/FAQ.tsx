"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { faq } from "@/data/faq";

const FAQ_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

function renderFaqAnswer(text: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = FAQ_LINK_RE.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const label = match[1];
    const href = match[2];
    const isInternal = href.startsWith("/");
    parts.push(
      isInternal ? (
        <Link
          key={key++}
          href={href}
          className="text-accent underline-offset-2 hover:underline"
        >
          {label}
        </Link>
      ) : (
        <a
          key={key++}
          href={href}
          className="text-accent underline-offset-2 hover:underline"
        >
          {label}
        </a>
      )
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.map((part, i) =>
    typeof part === "string" ? <Fragment key={`t-${i}`}>{part}</Fragment> : part
  );
}

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
          FAQ
        </p>
        <div className="max-w-2xl">
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight md:text-5xl">
            plain answers to fair questions.
          </h2>
        </div>

        <ul className="mt-12 divide-y divide-rule rounded-2xl border border-rule bg-bg">
          {faq.map((item, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  id={`faq-trigger-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
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
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={`faq-trigger-${i}`}
                    className="whitespace-pre-line px-6 pb-6 text-base leading-relaxed text-ink-soft"
                  >
                    {renderFaqAnswer(item.a)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
