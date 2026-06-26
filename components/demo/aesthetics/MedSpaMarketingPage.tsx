"use client";

import Link from "next/link";
import { AestheticsDemoWidget } from "@/components/demo/aesthetics/AestheticsDemoWidget";
import { MedSpaBookingSection } from "@/components/demo/aesthetics/MedSpaBookingSection";
import { SiteVersionPill } from "@/components/SiteVersionPill";
import { openMedSpaBooking } from "@/lib/aesthetics-demo-booking";
import type { DemoBrandConfig } from "@/lib/demo-config/types";
import type { VoiceDemoVertical } from "@/lib/voice-demo-vertical";

type MedSpaMarketingPageProps = {
  config: DemoBrandConfig;
  vertical: VoiceDemoVertical;
  startApiPath: string;
};

export function MedSpaMarketingPage({ config, vertical, startApiPath }: MedSpaMarketingPageProps) {
  const scrollToJarvis = () => {
    document.getElementById("jarvis")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const scrollToBook = (serviceName?: string) => {
    openMedSpaBooking(serviceName ? { serviceName } : undefined);
  };

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: config.palette.bg, color: config.palette.ink }}
    >
      <header
        className="border-b"
        style={{ borderColor: `${config.palette.muted}44`, backgroundColor: config.palette.surface }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p
              className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-[0.18em] uppercase"
              style={{ fontFamily: config.fonts.display }}
            >
              {config.brandName}
              <SiteVersionPill lightText />
            </p>
            <p className="text-sm font-medium" style={{ color: config.palette.headline }}>
              {config.tagline}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={config.crmRoute}
              className="hidden rounded-full border px-3 py-1.5 text-xs font-medium sm:inline-block"
              style={{ borderColor: `${config.palette.muted}66`, color: config.palette.muted }}
            >
              Demo CRM
            </Link>
            <button
              type="button"
              onClick={scrollToJarvis}
              className="rounded-full px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: config.palette.accent }}
            >
              {config.heroPrimaryCta}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-12 text-center sm:py-16">
          <p
            className="text-xs font-medium tracking-[0.2em] uppercase"
            style={{ color: config.palette.muted }}
          >
            {config.eyebrow}
          </p>
          <h1
            className="mt-4 text-4xl font-semibold sm:text-5xl"
            style={{ fontFamily: config.fonts.display, color: config.palette.headline }}
          >
            {config.heroHeadline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: config.palette.muted }}>
            {config.heroSub}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToJarvis}
              className="rounded-full px-6 py-3 text-sm font-medium text-white"
              style={{ backgroundColor: config.palette.accent }}
            >
              {config.heroPrimaryCta}
            </button>
            <button
              type="button"
              onClick={() => scrollToBook()}
              className="rounded-full border px-6 py-3 text-sm font-medium"
              style={{ borderColor: config.palette.muted, color: config.palette.ink }}
            >
              {config.heroSecondaryCta}
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {config.trustStrip.map((item) => (
            <div
              key={item}
              className="rounded-xl border px-3 py-3 text-center text-xs font-medium sm:text-sm"
              style={{
                borderColor: `${config.palette.muted}44`,
                backgroundColor: config.palette.surface,
              }}
            >
              {item}
            </div>
          ))}
        </section>

        <section className="py-14">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold" style={{ fontFamily: config.fonts.display }}>
              Talk to Jarvis
            </h2>
            <p className="mt-2 text-sm" style={{ color: config.palette.muted }}>
              Book visits, get pricing, or ask anything — voice receptionist wired to our full menu.
            </p>
          </div>
          <AestheticsDemoWidget config={config} vertical={vertical} startApiPath={startApiPath} />
        </section>

        <section className="py-10">
          <h2 className="mb-6 text-2xl font-semibold" style={{ fontFamily: config.fonts.display }}>
            Services
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {config.services.map((s) => (
              <div
                key={s.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-4"
                style={{
                  borderColor: `${config.palette.muted}44`,
                  backgroundColor: config.palette.surface,
                }}
              >
                <div>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-sm" style={{ color: config.palette.muted }}>
                    {s.fromPrice}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToBook(s.name)}
                  className="rounded-full border px-4 py-1.5 text-xs font-medium transition hover:opacity-80"
                  style={{ borderColor: config.palette.accent, color: config.palette.accent }}
                >
                  Book
                </button>
              </div>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl border px-6 py-8"
          style={{
            borderColor: `${config.palette.muted}44`,
            backgroundColor: config.palette.surface,
          }}
        >
          <h2 className="text-2xl font-semibold" style={{ fontFamily: config.fonts.display }}>
            {config.aboutHeadline}
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed" style={{ color: config.palette.muted }}>
            {config.aboutBody}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {config.providers.map((p) => (
              <li key={p.name}>
                <span className="font-medium">{p.name}</span>
                <span style={{ color: config.palette.muted }}> · {p.title}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="py-10">
          <h2 className="mb-2 text-2xl font-semibold" style={{ fontFamily: config.fonts.display }}>
            Before &amp; After
          </h2>
          <p className="mb-6 text-sm" style={{ color: config.palette.muted }}>
            Individual results vary. Photos shared with patient consent.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-[4/3] rounded-xl border"
                style={{
                  borderColor: `${config.palette.muted}44`,
                  background: `linear-gradient(135deg, ${config.palette.bg}, ${config.palette.muted}33)`,
                }}
              >
                <div className="flex h-full items-end p-3 text-xs" style={{ color: config.palette.muted }}>
                  Placeholder pair {n}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <h2 className="mb-6 text-2xl font-semibold" style={{ fontFamily: config.fonts.display }}>
            {config.membershipProgram}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {config.membershipTiers.map((tier) => (
              <div
                key={tier.name}
                className="rounded-2xl border px-5 py-6"
                style={{
                  borderColor: `${config.palette.muted}44`,
                  backgroundColor: config.palette.surface,
                }}
              >
                <p className="text-lg font-semibold" style={{ fontFamily: config.fonts.display }}>
                  {tier.name}
                </p>
                <p className="mt-1 text-2xl font-medium" style={{ color: config.palette.accent }}>
                  {tier.price}
                </p>
                <ul className="mt-4 space-y-1 text-sm" style={{ color: config.palette.muted }}>
                  {tier.perks.map((perk) => (
                    <li key={perk}>· {perk}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={scrollToJarvis}
                  className="mt-5 w-full rounded-full border py-2 text-sm font-medium"
                  style={{ borderColor: config.palette.accent, color: config.palette.accent }}
                >
                  Join via Jarvis
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <h2 className="mb-6 text-2xl font-semibold" style={{ fontFamily: config.fonts.display }}>
            Reviews
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {config.reviews.map((r) => (
              <blockquote
                key={r.author}
                className="rounded-xl border px-5 py-4 text-sm leading-relaxed"
                style={{
                  borderColor: `${config.palette.muted}44`,
                  backgroundColor: config.palette.surface,
                }}
              >
                <p>&ldquo;{r.quote}&rdquo;</p>
                <footer className="mt-3 text-xs font-medium" style={{ color: config.palette.muted }}>
                  — {r.author}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <MedSpaBookingSection config={config} />

        <section className="py-10">
          <h2 className="mb-6 text-2xl font-semibold" style={{ fontFamily: config.fonts.display }}>
            FAQ
          </h2>
          <div className="space-y-3">
            {config.faq.map((item) => (
              <details
                key={item.question}
                className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: `${config.palette.muted}44`,
                  backgroundColor: config.palette.surface,
                }}
              >
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: config.palette.muted }}>
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <footer
          className="border-t py-10 text-sm"
          style={{ borderColor: `${config.palette.muted}44`, color: config.palette.muted }}
        >
          <p className="font-medium" style={{ color: config.palette.ink }}>
            {config.brandName}
          </p>
          <p className="mt-1">{config.address}</p>
          <p className="mt-1">{config.hours}</p>
          <p className="mt-1">
            <a href={`tel:${config.phoneTel}`} className="underline-offset-2 hover:underline">
              {config.phone}
            </a>
            {" · "}
            {config.instagramHandle}
          </p>
          <p className="mt-6 text-xs">
            Demo by{" "}
            <Link href="/" className="underline-offset-2 hover:underline" style={{ color: config.palette.accent }}>
              998 web designs
            </Link>
            . Fictional business for portfolio demonstration.
          </p>
        </footer>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t px-4 py-3 sm:hidden"
        style={{
          borderColor: `${config.palette.muted}44`,
          backgroundColor: config.palette.surface,
        }}
      >
        <button
          type="button"
          onClick={() => scrollToBook()}
          className="flex-1 rounded-full py-3 text-sm font-medium text-white"
          style={{ backgroundColor: config.palette.accent }}
        >
          {config.heroSecondaryCta}
        </button>
        <a
          href={`tel:${config.phoneTel}`}
          className="flex-1 rounded-full border py-3 text-center text-sm font-medium"
          style={{ borderColor: config.palette.muted }}
        >
          Call
        </a>
      </div>
    </div>
  );
}
