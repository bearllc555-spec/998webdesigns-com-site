"use client";

import { useState } from "react";
import Link from "next/link";
import { ContactModal } from "@/components/ContactModal";
import type { ContactPrefill } from "@/lib/contact-prefill";

type ThanksActionsProps = {
  sessionId: string;
};

export function ThanksActions({ sessionId }: ThanksActionsProps) {
  const [contactOpen, setContactOpen] = useState(false);
  const [prefill, setPrefill] = useState<ContactPrefill | undefined>(undefined);
  const [loadingPrefill, setLoadingPrefill] = useState(false);

  const openContact = async () => {
    setContactOpen(true);
    if (prefill || loadingPrefill) return;

    setLoadingPrefill(true);
    try {
      const res = await fetch(
        `/api/thanks-prefill?session_id=${encodeURIComponent(sessionId)}`
      );
      if (res.ok) {
        const data = (await res.json()) as { prefill?: ContactPrefill };
        if (data.prefill) setPrefill(data.prefill);
      }
    } catch {
      // Modal still opens without prefill
    } finally {
      setLoadingPrefill(false);
    }
  };

  return (
    <>
      <div className="mt-12 flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-rule bg-bg px-5 py-3 text-sm font-medium text-ink transition hover:border-ink-soft"
        >
          &larr; Back to home
        </Link>
        <button
          type="button"
          onClick={() => void openContact()}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-medium text-on-accent shadow-sm transition hover:bg-accent-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {loadingPrefill ? "Loading…" : "Email us"}
        </button>
      </div>
      <ContactModal
        open={contactOpen}
        onOpenChange={setContactOpen}
        prefill={prefill}
        title="Email us"
      />
    </>
  );
}
