import { HOSTING_TRIAL_DAYS } from "@/lib/hosting-policy";
import type { HostingChoice } from "@/lib/validate-lead";

export function hostingChoiceLabel(choice: HostingChoice): string {
  switch (choice) {
    case "ten_year":
      return `Ten years of hosting ($1,349 after ${HOSTING_TRIAL_DAYS}-day free period)`;
    case "monthly":
      return `Month-to-month hosting ($198/mo after ${HOSTING_TRIAL_DAYS}-day free period)`;
  }
}

export function hostingChoiceShortLabel(choice: HostingChoice): string {
  switch (choice) {
    case "ten_year":
      return "Ten-year hosting — $1,349";
    case "monthly":
      return "Month-to-month — $198/mo";
  }
}
