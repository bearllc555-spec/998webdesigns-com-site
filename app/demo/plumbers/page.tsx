import type { Metadata } from "next";
import Link from "next/link";
import { PlumbingDemoWidget } from "@/components/VoiceDemo/PlumbingDemoWidget";
import {
  PLUMBING_DEMO_BUSINESS_NAME,
  PLUMBING_DEMO_TAGLINE,
} from "@/lib/voice-demo-plumbing-constants";
import { SITE_VERSION } from "@/lib/version";

export const metadata: Metadata = {
  title: `${PLUMBING_DEMO_BUSINESS_NAME} — Jarvis voice demo`,
  description:
    "Try Jarvis, the AI receptionist for Metro Plumbing & Drain. Book appointments, get pricing, and handle emergencies by voice.",
  robots: { index: false, follow: false },
};

export default function PlumbersDemoPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-display text-lg font-semibold text-ink">
              {PLUMBING_DEMO_BUSINESS_NAME}
            </p>
            <p className="text-sm text-ink-soft">{PLUMBING_DEMO_TAGLINE}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/demo/plumbers/crm"
              className="rounded-full border border-rule px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-accent hover:text-ink"
            >
              Demo CRM
            </Link>
            <span className="rounded-full border border-rule px-2 py-0.5 text-xs text-ink-soft">
              {SITE_VERSION}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            998 vertical demo
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Talk to Jarvis — your plumbing receptionist
          </h1>
          <p className="mx-auto max-w-xl text-sm text-ink-soft">
            This demo runs on the same voice stack as 998&apos;s site assistant, wired to Metro
            Plumbing &amp; Drain knowledge, booking tools, and confirmation emails. Ask about
            services, pricing, emergencies, or book an appointment.
          </p>
        </div>

        <PlumbingDemoWidget />

        <p className="mt-8 text-center text-xs text-ink-soft">
          Demo by{" "}
          <Link href="/" className="text-accent hover:underline">
            998 web designs
          </Link>
          . Fictional business for portfolio demonstration.
        </p>
      </main>
    </div>
  );
}
