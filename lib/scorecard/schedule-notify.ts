import { after } from "next/server";
import { notifyCrmActivity, type CrmNotifyInput } from "@/lib/crm-notify";
import {
  notifyScorecardReadyOnce,
  type ScorecardReadyNotifyInput,
} from "@/lib/scorecard/crm-ready-notify";

/** CF Workers kill bare void promises after the response — use next/server after(). */
export function scheduleScorecardQueuedNotify(
  input: Extract<CrmNotifyInput, { kind: "scorecard_queued" }>
): void {
  after(async () => {
    try {
      await notifyCrmActivity(input);
    } catch (err) {
      console.warn("[scorecard] queued notify failed:", err);
    }
  });
}

export function scheduleScorecardReadyNotify(input: ScorecardReadyNotifyInput): void {
  after(async () => {
    try {
      await notifyScorecardReadyOnce(input);
    } catch (err) {
      console.warn("[scorecard] ready notify failed:", err);
    }
  });
}
