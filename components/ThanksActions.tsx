"use client";

import { useState } from "react";
import Link from "next/link";
import { ContactModal, type ContactPrefill } from "@/components/ContactModal";

type ThanksActionsProps = {
  prefill: ContactPrefill;
};

export function ThanksActions({ prefill }: ThanksActionsProps) {
  const [contactOpen, setContactOpen] = useState(false);

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
          onClick={() => setContactOpen(true)}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-medium text-on-accent shadow-sm transition hover:bg-accent-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Email us
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
