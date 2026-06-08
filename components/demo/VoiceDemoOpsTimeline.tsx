"use client";

import { useMemo, useState } from "react";
import { diagnoseVoiceDemoOpsSession } from "@/lib/voice-demo-ops-diagnose";
import { formatVoiceDemoOpsTimeline } from "@/lib/voice-demo-ops-format";
import type { VoiceDemoOpsEvent } from "@/lib/voice-demo-ops";

type Props = {
  events: VoiceDemoOpsEvent[];
  title?: string;
  defaultExpanded?: boolean;
};

export function VoiceDemoOpsTimeline({
  events,
  title = "Session event log",
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const diagnosis = useMemo(() => diagnoseVoiceDemoOpsSession(events), [events]);
  const timeline = useMemo(() => formatVoiceDemoOpsTimeline(events), [events]);

  if (!events.length) {
    return (
      <p className="mt-4 text-xs text-ink-soft">
        No Jarvis ops events recorded for this session yet.
      </p>
    );
  }

  async function copyTimeline() {
    const block = [
      `Diagnosis: ${diagnosis.summary}`,
      ...diagnosis.findings.map((f) => `- ${f}`),
      "",
      timeline,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(block);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-rule bg-rule-soft/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-left text-xs font-medium text-ink"
        >
          {title} ({events.length}) {expanded ? "▾" : "▸"}
        </button>
        <button
          type="button"
          onClick={() => void copyTimeline()}
          className="rounded-full border border-rule px-2 py-0.5 text-[10px] font-medium text-ink-soft hover:border-accent hover:text-ink"
        >
          {copied ? "Copied" : "Copy for debug"}
        </button>
      </div>

      <p className="mt-2 text-xs font-medium text-ink">{diagnosis.summary}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-ink-soft">
        {diagnosis.findings.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      {expanded && (
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-rule bg-bg p-2 font-mono text-[10px] leading-relaxed text-ink-soft">
          {timeline}
        </pre>
      )}
    </div>
  );
}
