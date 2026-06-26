"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteVersionPill } from "@/components/SiteVersionPill";
import { CRM_PAGE_CONTAINER } from "@/lib/crm-layout";
import type { DemoBrandConfig } from "@/lib/demo-config/types";

type AestheticsCrmHeaderProps = {
  config: DemoBrandConfig;
  title: string;
  subtitle?: string;
  sessionApiPath: string;
  afterLogoutPath: string;
  messagesHref: string;
  secondaryNavLink?: { href: string; label: string };
  actions?: React.ReactNode;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
};

export function AestheticsCrmHeader({
  config,
  title,
  subtitle,
  sessionApiPath,
  afterLogoutPath,
  messagesHref,
  secondaryNavLink,
  actions,
  onRefresh,
  refreshDisabled,
}: AestheticsCrmHeaderProps) {
  const pathname = usePathname();
  const onActivity = pathname === messagesHref;
  const line = `${config.palette.muted}44`;
  const pillBase = "rounded-full px-4 py-1.5 text-sm font-medium transition";

  async function logout() {
    await fetch(sessionApiPath, { method: "DELETE", credentials: "include" });
    window.location.href = afterLogoutPath;
  }

  return (
    <header
      className="shrink-0 border-b"
      style={{ borderColor: line, backgroundColor: config.palette.surface }}
    >
      <div className={`${CRM_PAGE_CONTAINER} py-4`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-[0.18em]"
              style={{ color: config.palette.accent }}
            >
              {config.brandName} demo
            </p>
            <h1
              className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-semibold"
              style={{ fontFamily: config.fonts.display, color: config.palette.headline }}
            >
              {title}
              <SiteVersionPill lightText />
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm" style={{ color: config.palette.muted }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={logout}
              className="rounded-full border px-4 py-2 text-sm transition hover:opacity-80"
              style={{ borderColor: line, color: config.palette.muted }}
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="CRM sections">
          {secondaryNavLink ? (
            <Link
              href={secondaryNavLink.href}
              className={pillBase}
              style={{ border: `1px solid ${line}`, color: config.palette.muted }}
            >
              {secondaryNavLink.label}
            </Link>
          ) : null}
          <Link
            href={messagesHref}
            className={pillBase}
            style={
              onActivity
                ? { backgroundColor: config.palette.accent, color: "#fff" }
                : { border: `1px solid ${line}`, color: config.palette.muted }
            }
          >
            Messages
          </Link>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshDisabled}
              className={`${pillBase} disabled:opacity-50`}
              style={{ border: `1px solid ${line}`, color: config.palette.muted }}
            >
              Refresh
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
