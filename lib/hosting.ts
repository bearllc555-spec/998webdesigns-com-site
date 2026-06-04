import type { HostingChoice } from "@/lib/validate-lead";

export function hostingChoiceLabel(choice: HostingChoice): string {
  switch (choice) {
    case "ten_year":
      return "Ten years of hosting ($1,349 one-time)";
    case "monthly":
      return "Month-to-month hosting ($198/mo — starts at checkout, renews monthly)";
    case "later":
      return "Hosting decision later";
  }
}
