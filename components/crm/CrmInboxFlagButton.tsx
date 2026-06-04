"use client";

import {
  crmInboxFlagLabel,
  type CrmInboxFlag,
} from "@/lib/crm-inbox-flag";

type CrmInboxFlagButtonProps = {
  flag: CrmInboxFlag | null;
  disabled?: boolean;
  onCycle: () => void;
  className?: string;
};

function FlagIcon({ flag }: { flag: CrmInboxFlag | null }) {
  const common = "h-5 w-5";

  if (flag === "star") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        aria-hidden
        fill="#EAB308"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }

  if (flag === "check") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#22C55E" />
        <path
          d="M8 12.5l2.5 2.5L16 9"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (flag === "alert") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#EF4444" />
        <path
          d="M12 7v6M12 16.5v.5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={`${common} text-slate dark:text-zinc-500`}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function CrmInboxFlagButton({
  flag,
  disabled,
  onCycle,
  className = "",
}: CrmInboxFlagButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onCycle();
      }}
      title={`${crmInboxFlagLabel(flag)} — click to change`}
      aria-label={`${crmInboxFlagLabel(flag)}. Click to cycle flag.`}
      className={`crm-inbox-flag-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-rule-soft/80 disabled:opacity-50 ${className}`}
    >
      <FlagIcon flag={flag} />
    </button>
  );
}
