"use client";

import { usePathname } from "next/navigation";
import { useSelectedAddons } from "@/hooks/use-selected-addons";

const ADDON_DATA: Record<string, { name: string; setup: number; monthly: number }> = {
  "ai-chatbot": { name: "AI Chatbot", setup: 299, monthly: 79 },
  "ai-receptionist": { name: "AI Receptionist", setup: 399, monthly: 149 },
  "social-media": { name: "Social Media Management", setup: 199, monthly: 299 },
  "email-sms": { name: "Email & SMS", setup: 149, monthly: 149 },
  "blog-writing": { name: "Blog Writing & Local Posts", setup: 199, monthly: 199 },
  "hyper-local-seo": { name: "Hyper-Local SEO", setup: 299, monthly: 249 },
  "google-profile": { name: "Google Profile Optimization", setup: 149, monthly: 79 },
  "booking-calendar": { name: "Booking Calendar", setup: 99, monthly: 29 },
  "growth-pack": { name: "Growth Pack", setup: 647, monthly: 399 },
};

export function AddonSummaryBar() {
  const pathname = usePathname();
  const selected = useSelectedAddons();

  const totalSetup = selected.reduce(
    (sum, key) => sum + (ADDON_DATA[key]?.setup ?? 0),
    0
  );
  const totalMonthly = selected.reduce(
    (sum, key) => sum + (ADDON_DATA[key]?.monthly ?? 0),
    0
  );
  const count = selected.length;
  const visible = count > 0;

  if (pathname?.startsWith("/crm") || count === 0) return null;

  return (
    <div
      className={[
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-[#0a0a0a] text-white",
        "transform transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-6xl px-5 py-3">
        <div className="hidden items-center justify-between gap-4 sm:flex">
          <p className="text-sm text-white/80">
            <span className="font-semibold text-white">{count}</span> add-on
            {count !== 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-6">
            <p className="text-sm text-white/80">
              <span className="font-semibold text-white">
                ${totalSetup.toLocaleString()}
              </span>{" "}
              setup
              {" · "}
              <span className="font-semibold text-white">
                ${totalMonthly.toLocaleString()}
              </span>
              /mo
            </p>
            <a
              href="/start"
              className="rounded-full bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]/90"
            >
              Get Started →
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:hidden">
          <p className="text-center text-sm text-white/80">
            <span className="font-semibold text-white">{count}</span> add-on
            {count !== 1 ? "s" : ""} selected
            {" · "}
            <span className="font-semibold text-white">
              ${totalSetup.toLocaleString()}
            </span>{" "}
            setup
            {" · "}
            <span className="font-semibold text-white">
              ${totalMonthly.toLocaleString()}
            </span>
            /mo
          </p>
          <a
            href="/start"
            className="w-full rounded-full bg-[#2563eb] px-5 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]/90"
          >
            Get Started →
          </a>
        </div>
      </div>
    </div>
  );
}
