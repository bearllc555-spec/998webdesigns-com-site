import type { CrmContactFields } from "@/lib/crm-contact-fields";
import { displayCrmContactValue } from "@/lib/crm-contact-fields";
import { FIXED_DISPLAY_CLASS } from "@/components/form-field-stack";

type CrmContactFieldStackProps = {
  contact?: CrmContactFields | null;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate">{label}</p>
      <div className={`${FIXED_DISPLAY_CLASS} mt-1 text-ink-soft`}>{value}</div>
    </div>
  );
}

/** Street → line 2 → city → state → zip → cell - blanks show as em dash. */
export function CrmContactFieldStack({ contact }: CrmContactFieldStackProps) {
  const c = contact ?? {};
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Field label="Street" value={displayCrmContactValue(c.street)} />
      <Field label="Second line" value={displayCrmContactValue(c.line2)} />
      <Field label="City" value={displayCrmContactValue(c.city)} />
      <Field label="State" value={displayCrmContactValue(c.state)} />
      <Field label="Zip" value={displayCrmContactValue(c.zip)} />
      <Field label="Cell number" value={displayCrmContactValue(c.cellPhone)} />
    </div>
  );
}
