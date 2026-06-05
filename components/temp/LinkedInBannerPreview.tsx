"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import {
  LINKEDIN_COVER_DISPLAY_H,
  LINKEDIN_COVER_DISPLAY_W,
  LINKEDIN_COVER_UPLOAD_H,
  LINKEDIN_COVER_UPLOAD_W,
} from "@/lib/linkedin-banner-preview";

type LinkedInBannerPreviewProps = {
  children: ReactNode;
  designLabel: string;
  exportHref: string;
};

/**
 * Renders the 1584×396 artboard inside a fixed LinkedIn desktop cover rectangle
 * (1128×282) with profile-photo overlap — WYSIWYG for what you see on your profile.
 */
export function LinkedInBannerPreview({
  children,
  designLabel,
  exportHref,
}: LinkedInBannerPreviewProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    const scale = scaleRef.current;
    if (!slot || !scale) return;

    const applyScale = () => {
      const w = slot.clientWidth;
      if (w <= 0) return;
      scale.style.transform = `scale(${w / LINKEDIN_COVER_UPLOAD_W})`;
    };

    applyScale();
    const ro = new ResizeObserver(applyScale);
    ro.observe(slot);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="linkedin-preview-wrap">
      <div className="linkedin-preview-meta">
        <h2>{designLabel}</h2>
        <p>
          <strong>Click the cover</strong> to open a PNG in a new tab (right-click → Save image
          as). Preview below matches LinkedIn desktop ({LINKEDIN_COVER_DISPLAY_W}×
          {LINKEDIN_COVER_DISPLAY_H}px).
        </p>
      </div>

      <div
        className="linkedin-mockup"
        style={
          {
            "--li-cover-w": `${LINKEDIN_COVER_DISPLAY_W}px`,
            "--li-cover-h": `${LINKEDIN_COVER_DISPLAY_H}px`,
          } as CSSProperties
        }
        aria-label="LinkedIn profile intro card preview"
      >
        <Link
          href={exportHref}
          target="_blank"
          rel="noopener noreferrer"
          className="linkedin-cover-link"
          title={`Open full-size banner (${LINKEDIN_COVER_UPLOAD_W}×${LINKEDIN_COVER_UPLOAD_H}) in a new tab`}
        >
          <div ref={slotRef} className="linkedin-cover-slot">
            <div
              ref={scaleRef}
              className="linkedin-cover-scale"
              style={{ width: LINKEDIN_COVER_UPLOAD_W, height: LINKEDIN_COVER_UPLOAD_H }}
            >
              {children}
            </div>
          </div>
        </Link>

        <div className="linkedin-profile-stub" aria-hidden="true">
          <div className="linkedin-avatar" title="Profile photo — overlaps bottom of cover" />
          <div className="linkedin-stub-body">
            <div className="linkedin-stub-lines">
              <div className="linkedin-stub-line linkedin-stub-line--name" />
              <div className="linkedin-stub-line linkedin-stub-line--headline" />
              <div className="linkedin-stub-line linkedin-stub-line--meta" />
            </div>
            <div className="linkedin-stub-actions">
              <span className="linkedin-stub-btn linkedin-stub-btn--primary" />
              <span className="linkedin-stub-btn" />
              <span className="linkedin-stub-btn" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
