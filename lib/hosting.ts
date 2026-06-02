import type { HostingChoice } from "@/lib/validate-lead";

export function hostingChoiceLabel(choice: HostingChoice): string {
  switch (choice) {
    case "ten_year":
      return "Ten years of hosting ($998 one-time)";
    case "monthly":
      return "Month-to-month hosting ($98/mo — invoiced after launch)";
    case "later":
      return "Hosting decision later";
  }
}
