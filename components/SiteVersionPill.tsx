import { SITE_VERSION } from "@/lib/version";

type SiteVersionPillProps = {
  className?: string;
  /** White label on a dark pill — for branded demo pages where default ink-soft is hard to read. */
  lightText?: boolean;
};

/** Deploy-propagation tell - same label as home nav/footer (`lib/version.ts`). */
export function SiteVersionPill({ className, lightText }: SiteVersionPillProps) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-wider ${
        lightText ? "bg-black/70 text-white" : "bg-rule-soft text-ink-soft"
      }${className ? ` ${className}` : ""}`}
      aria-label={`Site version ${SITE_VERSION}`}
    >
      {SITE_VERSION}
    </span>
  );
}
