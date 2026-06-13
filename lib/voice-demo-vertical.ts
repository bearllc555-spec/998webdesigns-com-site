/** Voice demo vertical - marketing site vs industry demo pages. */
export type VoiceDemoVertical = "marketing" | "plumbers";

export const VOICE_DEMO_VERTICALS: VoiceDemoVertical[] = ["marketing", "plumbers"];

export function parseVoiceDemoVertical(raw: unknown): VoiceDemoVertical {
  return raw === "plumbers" ? "plumbers" : "marketing";
}

export function isPlumbingVertical(vertical: VoiceDemoVertical): boolean {
  return vertical === "plumbers";
}
