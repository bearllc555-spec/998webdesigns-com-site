import type { Metadata } from "next";
import Link from "next/link";
import { PlumbingDemoCapabilities } from "@/components/demo/PlumbingDemoCapabilities";
import { PlumbingDemoHeaderActions } from "@/components/demo/PlumbingDemoHeaderActions";
import { PlumbingDemoWidget } from "@/components/VoiceDemo/PlumbingDemoWidget";
import {
  PLUMBING_DEMO_BUSINESS_NAME,
  PLUMBING_DEMO_TAGLINE,
} from "@/lib/voice-demo-plumbing-constants";

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
          <PlumbingDemoHeaderActions />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 space-y-3 text-center">
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

        <PlumbingDemoCapabilities />

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
