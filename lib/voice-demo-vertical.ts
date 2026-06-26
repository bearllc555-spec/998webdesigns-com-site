/** Voice demo vertical - marketing site vs industry demo pages. */
export type VoiceDemoVertical = "marketing" | "plumbers" | "clinical" | "wellness";

export const VOICE_DEMO_VERTICALS: VoiceDemoVertical[] = [
  "marketing",
  "plumbers",
  "clinical",
  "wellness",
];

export function parseVoiceDemoVertical(raw: unknown): VoiceDemoVertical {
  if (raw === "plumbers") return "plumbers";
  if (raw === "clinical") return "clinical";
  if (raw === "wellness") return "wellness";
  return "marketing";
}

export function isPlumbingVertical(vertical: VoiceDemoVertical): boolean {
  return vertical === "plumbers";
}

export function isAestheticsVertical(vertical: VoiceDemoVertical): boolean {
  return vertical === "clinical" || vertical === "wellness";
}

export function aestheticsBrandFromVertical(
  vertical: VoiceDemoVertical
): "clinical" | "wellness" | null {
  if (vertical === "clinical") return "clinical";
  if (vertical === "wellness") return "wellness";
  return null;
}

/** Demos that reuse industry Jarvis behavior (opening, contact pacing, etc.). */
export function isIndustryJarvisVertical(vertical: VoiceDemoVertical): boolean {
  return isPlumbingVertical(vertical) || isAestheticsVertical(vertical);
}
