import type { ReactNode } from "react";

/** Single-line fields: fixed height so layout stays stable when Company is empty. */
export const FIXED_INPUT_CLASS =
  "box-border h-12 w-full rounded-xl border bg-bg px-4 text-base leading-none text-ink placeholder:text-slate transition focus:outline-none focus:ring-2 focus:ring-accent/30";

export const FIXED_DISPLAY_CLASS =
  "box-border flex h-12 w-full items-center rounded-xl border border-rule bg-bg px-4 text-sm text-ink";

export const MESSAGE_TEXTAREA_CLASS =
  "box-border min-h-[8rem] w-full resize-y rounded-xl border bg-bg px-4 py-3 text-base text-ink placeholder:text-slate transition focus:outline-none focus:ring-2 focus:ring-accent/30";

export const MESSAGE_DISPLAY_CLASS =
  "box-border min-h-[8rem] w-full whitespace-pre-wrap rounded-xl border border-rule bg-bg px-4 py-3 text-sm leading-relaxed text-ink";

function borderClass(error?: string) {
  return error ? "border-warn" : "border-rule focus:border-ink-soft";
}

type FixedFormFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email";
  required?: boolean;
  optionalHint?: boolean;
  hint?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
};

export function FixedFormField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  optionalHint,
  hint,
  placeholder,
  error,
  disabled,
  autoComplete,
}: FixedFormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-1">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
        {optionalHint && <span className="ml-1 font-normal text-slate">(optional)</span>}
      </label>
      {hint && <p className="mb-2 text-xs leading-relaxed text-slate">{hint}</p>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`${FIXED_INPUT_CLASS} ${borderClass(error)}`}
      />
      {error && <p className="mt-1 text-xs text-warn">{error}</p>}
    </div>
  );
}

type MessageFormFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  rows?: number;
};

export function MessageFormField({
  id,
  label,
  value,
  onChange,
  required,
  error,
  disabled,
  rows = 4,
}: MessageFormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-1">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${MESSAGE_TEXTAREA_CLASS} ${borderClass(error)}`}
      />
      {error && <p className="mt-1 text-xs text-warn">{error}</p>}
    </div>
  );
}

type SubmissionFieldStackProps = {
  name: string;
  company: string;
  email: string;
  message?: string;
  messagePlaceholder?: ReactNode;
};

/** Read-only stack: Name → Company → Email → Message (fixed boxes except message). */
export function SubmissionFieldStack({
  name,
  company,
  email,
  message,
  messagePlaceholder,
}: SubmissionFieldStackProps) {
  const companyDisplay = company.trim() || "\u00a0";

  return (
    <div className="mt-4 grid gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate">Name</p>
        <div className={`${FIXED_DISPLAY_CLASS} mt-1`}>{name}</div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate">Company</p>
        <div className={`${FIXED_DISPLAY_CLASS} mt-1 text-ink-soft`}>{companyDisplay}</div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate">Email</p>
        <div className={`${FIXED_DISPLAY_CLASS} mt-1`}>{email}</div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate">Message</p>
        <div className={`${MESSAGE_DISPLAY_CLASS} mt-1 text-ink-soft`}>
          {message?.trim() ? message : messagePlaceholder ?? "\u00a0"}
        </div>
      </div>
    </div>
  );
}
