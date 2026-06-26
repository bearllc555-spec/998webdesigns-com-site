import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CrmDashboard } from "@/components/crm/CrmDashboard";
import { isCrmAuthenticated } from "@/lib/crm-session";

export const metadata: Metadata = {
  title: { absolute: "Messages CRM" },
};

export default async function CrmPage() {
  if (!(await isCrmAuthenticated())) {
    redirect("/crm/login");
  }
  return <CrmDashboard />;
}
