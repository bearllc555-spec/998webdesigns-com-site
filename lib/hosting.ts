import { HOSTING_MONTHLY_PRICE_MO_LABEL, HOSTING_TRIAL_DAYS } from "@/lib/hosting-policy";
import type { HostingChoice } from "@/lib/validate-lead";

export function hostingChoiceLabel(choice: HostingChoice): string {
  switch (choice) {
    case "ten_year":
      return `10-year hosting ($2,996 after ${HOSTING_TRIAL_DAYS}-day free period)`;
    case "monthly":
      return `Month-to-month hosting (${HOSTING_MONTHLY_PRICE_MO_LABEL} after ${HOSTING_TRIAL_DAYS}-day free period)`;
  }
}

export function hostingChoiceShortLabel(choice: HostingChoice): string {
  switch (choice) {
    case "ten_year":
      return "10-year hosting - $2,996";
    case "monthly":
      return `Month-to-month - ${HOSTING_MONTHLY_PRICE_MO_LABEL}`;
  }
}
