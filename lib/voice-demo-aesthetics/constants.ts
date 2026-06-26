import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";

export const AESTHETICS_DEMO_SESSION_START_CUE = "[aesthetics-session-start]";

export function aestheticsOpeningLine(brand: AestheticsDemoBrand): string {
  const config = getDemoBrandConfigByVertical(brand);
  return `Thanks for calling ${config.brandName} - I'm Jarvis. How can I help you today?`;
}

export function aestheticsSessionStartCue(brand: AestheticsDemoBrand): string {
  return `${AESTHETICS_DEMO_SESSION_START_CUE}:${brand}`;
}

export function parseAestheticsSessionStartCue(text: string): AestheticsDemoBrand | null {
  const trimmed = text.trim();
  if (trimmed === `${AESTHETICS_DEMO_SESSION_START_CUE}:clinical`) return "clinical";
  if (trimmed === `${AESTHETICS_DEMO_SESSION_START_CUE}:wellness`) return "wellness";
  return null;
}

export function aestheticsBusinessName(brand: AestheticsDemoBrand): string {
  return getDemoBrandConfigByVertical(brand).brandName;
}

export function aestheticsPromoNote(brand: AestheticsDemoBrand): string {
  return getDemoBrandConfigByVertical(brand).promotions.newPatient;
}
