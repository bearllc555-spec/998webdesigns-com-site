import { MedSpaMarketingPage } from "@/components/demo/aesthetics/MedSpaMarketingPage";
import { LUMEN_CONFIG } from "@/lib/demo-config/lumen";

export default function ClinicalDemoPage() {
  return (
    <MedSpaMarketingPage
      config={LUMEN_CONFIG}
      vertical="clinical"
      startApiPath="/api/voice-demo/clinical/start"
    />
  );
}
