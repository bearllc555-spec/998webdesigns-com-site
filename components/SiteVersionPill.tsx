import { SITE_VERSION } from "@/lib/version";

type SiteVersionPillProps = {
  className?: string;
};

/** Deploy-propagation tell - same label as home nav/footer (`lib/version.ts`). */
export function SiteVersionPill({ className }: SiteVersionPillProps) {
  return (
    <span
      className={`rounded-full bg-rule-soft px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-ink-soft${className ? ` ${className}` : ""}`}
      aria-label={`Site version ${SITE_VERSION}`}
    >
      {SITE_VERSION}
    </span>
  );
}
