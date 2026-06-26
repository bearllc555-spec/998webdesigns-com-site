import { MedSpaMarketingPage } from "@/components/demo/aesthetics/MedSpaMarketingPage";
import { WILLOW_SAGE_CONFIG } from "@/lib/demo-config/willow-sage";

export default function WellnessDemoPage() {
  return (
    <MedSpaMarketingPage
      config={WILLOW_SAGE_CONFIG}
      vertical="wellness"
      startApiPath="/api/voice-demo/wellness/start"
    />
  );
}
