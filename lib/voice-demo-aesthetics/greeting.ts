import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import {
  aestheticsOpeningLine,
  aestheticsSessionStartCue,
} from "@/lib/voice-demo-aesthetics/constants";

export function aestheticsDemoOpeningStatus(): string {
  return "Jarvis is answering…";
}

export function triggerAestheticsDemoOpening(
  brand: AestheticsDemoBrand,
  session: {
    sendClientContent: (params: { turns: string; turnComplete: boolean }) => void;
  }
): void {
  session.sendClientContent({
    turns: aestheticsSessionStartCue(brand),
    turnComplete: true,
  });
}

export function isAestheticsOpeningLine(text: string, brand: AestheticsDemoBrand): boolean {
  const normalized = text.trim().toLowerCase();
  const opening = aestheticsOpeningLine(brand).trim().toLowerCase();
  return normalized.includes(opening.slice(0, 40));
}
