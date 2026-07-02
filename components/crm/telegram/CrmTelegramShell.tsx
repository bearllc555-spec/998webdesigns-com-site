"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CrmHeader } from "@/components/crm/CrmHeader";

const TELEGRAM_CRM_ICON = "/crm-telegram-icon.svg";

function useTelegramCrmFavicon() {
  useEffect(() => {
    const links = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    links.forEach((link) => link.remove());

    for (const rel of ["icon", "shortcut icon", "apple-touch-icon"]) {
      const link = document.createElement("link");
      link.rel = rel;
      link.type = "image/svg+xml";
      link.href = TELEGRAM_CRM_ICON;
      document.head.appendChild(link);
    }
  }, []);
}

type CrmTelegramShellProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
  message?: string | null;
  children: React.ReactNode;
};

export function CrmTelegramShell({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  actions,
  onRefresh,
  loading,
  error,
  message,
  children,
}: CrmTelegramShellProps) {
  useTelegramCrmFavicon();

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title={title}
        subtitle={subtitle}
        onRefresh={onRefresh}
        refreshDisabled={loading}
        actions={
          <>
            {actions}
            {backHref && (
              <Link
                href={backHref}
                className="rounded-full border border-rule px-4 py-2 text-sm font-medium hover:border-accent/50"
              >
                {backLabel}
              </Link>
            )}
          </>
        }
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 pb-24 md:px-8">
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}
        {error && (
          <p className="mb-4 rounded-xl border border-warn/40 bg-warn-soft/30 px-4 py-3 text-sm text-warn">
            {error}
          </p>
        )}
        {message && !error && (
          <p className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-ink">
            {message}
          </p>
        )}
        {!loading && children}
      </main>
    </div>
  );
}
