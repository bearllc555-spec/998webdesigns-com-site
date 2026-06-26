"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type CalendlyScheduledMessage = {
  event?: string;
  payload?: {
    event?: { uri?: string; start_time?: string };
    invitee?: { uri?: string };
  };
};

type Props = {
  token: string;
  calendlyUrl: string;
};

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void;
    };
  }
}

export function DiscoveryScheduleEmbed({ token, calendlyUrl }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const reportedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scriptId = "calendly-widget-js";
    const styleId = "calendly-widget-css";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!document.getElementById(styleId)) {
      const link = document.createElement("link");
      link.id = styleId;
      link.rel = "stylesheet";
      link.href = "https://assets.calendly.com/assets/external/widget.css";
      document.head.appendChild(link);
    }

    const initWidget = () => {
      container.innerHTML = "";
      window.Calendly?.initInlineWidget({ url: calendlyUrl, parentElement: container });
    };

    if (script) {
      initWidget();
    } else {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.onload = initWidget;
      document.body.appendChild(script);
    }

    async function onMessage(event: MessageEvent) {
      const data = event.data as CalendlyScheduledMessage;
      if (data?.event !== "calendly.event_scheduled" || reportedRef.current) return;

      reportedRef.current = true;
      const eventStartAt = data.payload?.event?.start_time ?? null;
      const inviteeUri = data.payload?.invitee?.uri ?? null;

      try {
        await fetch("/api/discovery/mark-booked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, eventStartAt, inviteeUri }),
        });
      } catch {
        // Webhook may still record the booking.
      }

      router.refresh();
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [calendlyUrl, router, token]);

  return (
    <>
      <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">Pick a time</h1>
      <p className="mt-4 text-ink-soft">
        Choose a slot for your discovery call. We&apos;ll confirm here once it&apos;s booked.
      </p>
      <div
        ref={containerRef}
        className="calendly-inline-widget mt-8 min-h-[700px] w-full overflow-hidden rounded-lg border border-ink/10 bg-white"
        data-url={calendlyUrl}
      />
    </>
  );
}
