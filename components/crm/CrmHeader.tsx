"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrmAdminMenu } from "@/components/crm/CrmAdminMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CRM_VERSION } from "@/lib/crm-version";

type CrmHeaderProps = {
  title: string;
  subtitle?: string;
  /** Extra controls before Admin (e.g. back links on subpages). */
  actions?: React.ReactNode;
  /** Renders Refresh in the nav row beside Activity. */
  onRefresh?: () => void;
  refreshDisabled?: boolean;
};

const pillBase =
  "rounded-full px-4 py-1.5 text-sm font-medium transition";

export function CrmHeader({
  title,
  subtitle,
  actions,
  onRefresh,
  refreshDisabled,
}: CrmHeaderProps) {
  const pathname = usePathname();
  const onActivity = pathname === "/crm";

  async function logout() {
    await fetch("/api/crm/session", { method: "DELETE", credentials: "include" });
    window.location.href = "/crm/login";
  }

  return (
    <header className="shrink-0 border-b border-rule bg-bg">
      <div className="mx-auto max-w-4xl px-5 py-4 md:px-8">
        <p className="mb-3 flex items-center gap-2">
          <span
            className="rounded-full bg-rule-soft px-2 py-0.5 text-[10px] font-medium tracking-wider text-slate"
            aria-label={`CRM version ${CRM_VERSION}`}
          >
            {CRM_VERSION}
          </span>
        </p>
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
            <CrmAdminMenu />
            <ThemeToggle />
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
          <Link
            href="/crm"
            className={`${pillBase} ${
              onActivity
                ? "bg-accent text-white"
                : "border border-rule text-ink-soft hover:border-accent/50"
            }`}
          >
            Activity
          </Link>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshDisabled}
              className={`${pillBase} border border-rule text-ink-soft hover:border-accent/50 disabled:opacity-50`}
            >
              Refresh
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
