"use client";

import { usePathname } from "next/navigation";
import { VoiceDemoWidget } from "@/components/VoiceDemo/VoiceDemoWidget";

/** Hide the global 998 Jarvis widget on vertical demo pages (they embed their own). */
export function VoiceDemoWidgetGate() {
  const pathname = usePathname();
  if (pathname?.startsWith("/demo")) {
    return null;
  }
  return <VoiceDemoWidget />;
}
