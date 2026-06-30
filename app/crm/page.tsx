import type { Metadata } from "next";
import { CrmDashboard } from "@/components/crm/CrmDashboard";

export const metadata: Metadata = {
  title: { absolute: "Messages CRM" },
};

export default function CrmPage() {
  return <CrmDashboard />;
}
