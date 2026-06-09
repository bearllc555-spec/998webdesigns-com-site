"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function PlumbingDemoHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/demo/plumbers/crm"
        className="rounded-full border border-rule px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-accent hover:text-ink"
      >
        Demo CRM
      </Link>
      <ThemeToggle />
    </div>
  );
}
