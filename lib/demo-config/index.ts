import { LUMEN_CONFIG } from "@/lib/demo-config/lumen";
import { WILLOW_SAGE_CONFIG } from "@/lib/demo-config/willow-sage";
import type { DemoBrandConfig, DemoBrandSlug } from "@/lib/demo-config/types";
import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";

const BY_SLUG: Record<DemoBrandSlug, DemoBrandConfig> = {
  clinical: LUMEN_CONFIG,
  wellness: WILLOW_SAGE_CONFIG,
};

const BY_VERTICAL: Record<AestheticsDemoBrand, DemoBrandConfig> = {
  clinical: LUMEN_CONFIG,
  wellness: WILLOW_SAGE_CONFIG,
};

export function getDemoBrandConfig(slug: DemoBrandSlug): DemoBrandConfig {
  return BY_SLUG[slug];
}

export function getDemoBrandConfigByVertical(vertical: AestheticsDemoBrand): DemoBrandConfig {
  return BY_VERTICAL[vertical];
}

export { LUMEN_CONFIG, WILLOW_SAGE_CONFIG };
