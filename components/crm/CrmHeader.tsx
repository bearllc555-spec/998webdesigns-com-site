"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type CrmHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

const NAV = [
  { href: "/crm", label: "Activity" },
  { href: "/crm/telegram", label: "Telegram" },
] as const;

export function CrmHeader({ title, subtitle, actions }: CrmHeaderProps) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/crm/session", { method: "DELETE", credentials: "include" });
    window.location.href = "/crm/login";
  }

  return (
    <header className="shrink-0 border-b border-rule bg-bg">
      <div className="mx-auto max-w-4xl px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
              998 CRM
            </p>
            <h1 className="font-display text-2xl font-medium">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-rule px-4 py-2 text-sm text-ink-soft hover:border-accent/50"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="CRM sections">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/crm" ? pathname === "/crm" : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-accent text-white"
                    : "border border-rule text-ink-soft hover:border-accent/50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
