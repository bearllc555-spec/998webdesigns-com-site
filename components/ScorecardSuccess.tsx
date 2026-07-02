"use client";

import { useEffect, useRef, useState } from "react";
import { SCORECARD_ESTIMATE_SEC, SCORECARD_MAX_WAIT_MIN, SCORECARD_POLL_MAX_SEC } from "@/lib/scorecard/estimate";

type PollStatus = "processing" | "ready" | "failed" | "timeout";

type StatusResponse = {
  status: "processing" | "ready" | "failed";
  email?: string;
  reportUrl?: string;
  score?: number;
  error?: string;
};

const POLL_MS = 2000;

export function ScorecardSuccess({
  jobId,
  email,
  estimateSec = SCORECARD_ESTIMATE_SEC,
}: {
  jobId: string;
  email: string;
  estimateSec?: number;
}) {
  const [pollStatus, setPollStatus] = useState<PollStatus>("processing");
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
    const tick = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const qs = new URLSearchParams({ jobId, email });
        const res = await fetch(`/api/scorecard/status?${qs}`);
        const data = (await res.json().catch(() => ({}))) as StatusResponse;
        if (cancelled) return;

        if (res.ok && data.status === "ready" && data.reportUrl) {
          setPollStatus("ready");
          setReportUrl(data.reportUrl);
          setScore(typeof data.score === "number" ? data.score : null);
          return true;
        }
        if (data.status === "failed") {
          setPollStatus("failed");
          return true;
        }
      } catch {
        /* keep polling */
      }
      return false;
    }

    const interval = window.setInterval(async () => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      if (elapsed >= SCORECARD_POLL_MAX_SEC) {
        setPollStatus("timeout");
        window.clearInterval(interval);
        return;
      }
      const done = await poll();
      if (done) window.clearInterval(interval);
    }, POLL_MS);

    void poll();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [jobId, email]);

  const secondsLeft = Math.max(0, estimateSec - elapsedSec);
  const progressPct =
    pollStatus === "ready"
      ? 100
      : Math.min(95, Math.round((elapsedSec / estimateSec) * 100));

  if (pollStatus === "ready" && reportUrl) {
    return (
      <div className="mt-6 rounded-lg bg-[#e1f5ee] px-4 py-4 text-[#0f6e56]">
        <p className="text-sm leading-relaxed">
          A copy has been sent to your email{" "}
          <span className="font-medium text-[#1a1a1a]">({email})</span>.
        </p>
        {score != null ? (
          <p className="mt-2 text-sm">
            Your score: <span className="font-semibold text-[#1a1a1a]">{score}/100</span>
          </p>
        ) : null}
        <div className="mt-4 flex items-center gap-3">
          <a
            href={reportUrl}
            className="inline-flex items-center rounded-lg bg-[#0c447c] px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-[#0a3766]"
          >
            View your report &rarr;
          </a>
          <span
            className="inline-flex shrink-0 items-center justify-center text-[#0f6e56]"
            aria-hidden
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="block"
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
              <path
                d="M8.5 12.5l2.5 2.5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          </span>
          <span className="sr-only">Report ready</span>
        </div>
      </div>
    );
  }

  if (pollStatus === "failed") {
    return (
      <div className="mt-6 rounded-lg bg-[#fcebeb] px-4 py-4 text-sm text-[#a32d2d]">
        <p>We couldn&apos;t finish your scorecard. Check your inbox — if nothing arrives, try again.</p>
        <p className="mt-2 text-xs text-[#6b6b66]">
          We attempted to email <span className="font-medium">{email}</span>.
        </p>
      </div>
    );
  }

  if (pollStatus === "timeout") {
    return (
      <div className="mt-6 rounded-lg bg-[#e1f5ee] px-4 py-4 text-sm text-[#0f6e56]">
        <p>
          Your scorecard is taking longer than usual. A copy will arrive at{" "}
          <span className="font-medium text-[#1a1a1a]">{email}</span> — check your inbox
          (and spam) in the next minute.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg bg-[#e1f5ee] px-4 py-4 text-[#0f6e56]">
      <p className="text-sm font-medium">Building your scorecard…</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#c5e8dc]">
        <div
          className="h-full rounded-full bg-[#0f6e56] transition-[width] duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[#6b6b66]">
        {secondsLeft > 0
          ? `About ${secondsLeft} second${secondsLeft === 1 ? "" : "s"} remaining`
          : "Almost ready…"}
      </p>
      <p className="mt-3 text-xs text-[#6b6b66]">
        We&apos;ll email a copy to{" "}
        <span className="font-medium text-[#1a1a1a]">{email}</span>{" "}
        when it&apos;s ready. This can take up to {SCORECARD_MAX_WAIT_MIN} minutes.
      </p>
    </div>
  );
}
