"use client";

import { toPng } from "html-to-image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LINKEDIN_COVER_UPLOAD_H,
  LINKEDIN_COVER_UPLOAD_W,
} from "@/lib/linkedin-banner-preview";

type BannerExportViewProps = {
  children: ReactNode;
  designLabel: string;
  pageClassName: string;
  fileName: string;
};

export function BannerExportView({
  children,
  designLabel,
  pageClassName,
  fileName,
}: BannerExportViewProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function capture() {
      const el = captureRef.current;
      if (!el) return;

      try {
        await document.fonts.ready;
        await new Promise((resolve) => setTimeout(resolve, 250));

        const url = await toPng(el, {
          width: LINKEDIN_COVER_UPLOAD_W,
          height: LINKEDIN_COVER_UPLOAD_H,
          pixelRatio: 1,
          cacheBust: true,
        });

        if (!cancelled) {
          setPngUrl(url);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    capture();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`${pageClassName} linkedin-export-page`}>
      {status === "loading" && (
        <p className="linkedin-export-status" role="status">
          Building PNG…
        </p>
      )}

      {status === "error" && (
        <p className="linkedin-export-status linkedin-export-status--error" role="alert">
          Could not build the image automatically. Refresh the page, or screenshot the banner
          below.
        </p>
      )}

      <div
        ref={captureRef}
        className={`linkedin-export-canvas${status === "ready" ? " linkedin-export-canvas--hidden" : ""}`}
        aria-hidden={status === "ready"}
      >
        {children}
      </div>

      {pngUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL from html-to-image; next/image does not optimize inline PNG blobs */}
          <img
            src={pngUrl}
            width={LINKEDIN_COVER_UPLOAD_W}
            height={LINKEDIN_COVER_UPLOAD_H}
            alt={`${designLabel} — LinkedIn banner ${LINKEDIN_COVER_UPLOAD_W}×${LINKEDIN_COVER_UPLOAD_H}`}
            className="linkedin-export-image"
          />
          <a href={pngUrl} download={fileName} className="linkedin-export-download">
            Download PNG
          </a>
        </>
      )}

      <p className="linkedin-export-caption">
        {designLabel} — <strong>{LINKEDIN_COVER_UPLOAD_W}×{LINKEDIN_COVER_UPLOAD_H}px</strong>.
        {status === "ready" ? (
          <> Right-click the image → <strong>Save image as…</strong></>
        ) : (
          <> Preparing upload-ready PNG…</>
        )}
      </p>
    </div>
  );
}
