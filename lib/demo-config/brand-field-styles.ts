import type { CSSProperties } from "react";
import type { DemoBrandConfig } from "@/lib/demo-config/types";

export function brandBorder(config: DemoBrandConfig): string {
  return `${config.palette.muted}44`;
}

export function brandFieldStyle(config: DemoBrandConfig): CSSProperties {
  return {
    backgroundColor: config.palette.surface,
    color: config.palette.ink,
    borderColor: brandBorder(config),
  };
}

export const brandFieldClassName =
  "box-border h-12 w-full rounded-xl border px-4 text-base leading-none outline-none transition focus:ring-2 focus:ring-offset-0";
