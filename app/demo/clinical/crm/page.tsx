import { AestheticsCrmDashboard } from "@/components/demo/aesthetics/AestheticsCrmDashboard";
import { AestheticsCrmLoginShell } from "@/components/demo/aesthetics/AestheticsCrmLoginShell";
import { isAestheticsDemoCrmAuthenticated } from "@/lib/aesthetics-demo-crm/session";

export default async function ClinicalCrmPage() {
  if (!(await isAestheticsDemoCrmAuthenticated("clinical"))) {
    return <AestheticsCrmLoginShell brand="clinical" />;
  }
  return <AestheticsCrmDashboard brand="clinical" />;
}
