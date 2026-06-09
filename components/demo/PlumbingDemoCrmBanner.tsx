import {
  PLUMBING_DEMO_CRM_INTRO,
  PLUMBING_DEMO_CRM_LOGIN_HINT,
  PLUMBING_DEMO_CRM_PASSWORD,
} from "@/lib/plumbing-demo-crm-copy";
import { CRM_PAGE_CONTAINER } from "@/lib/crm-layout";

export function PlumbingDemoCrmBanner() {
  return (
    <div className="border-b border-accent/25 bg-accent/[0.06]">
      <div className={`${CRM_PAGE_CONTAINER} space-y-2 py-4 text-sm leading-relaxed text-ink-soft`}>
        <p className="font-medium text-ink">Demonstration CRM</p>
        <p>{PLUMBING_DEMO_CRM_INTRO}</p>
        <p>
          {PLUMBING_DEMO_CRM_LOGIN_HINT} Password:{" "}
          <span className="font-mono text-ink">{PLUMBING_DEMO_CRM_PASSWORD}</span>
        </p>
      </div>
    </div>
  );
}
