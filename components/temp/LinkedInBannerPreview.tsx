"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import {
  LINKEDIN_AVATAR_BORDER,
  LINKEDIN_AVATAR_LEFT,
  LINKEDIN_AVATAR_SIZE,
  LINKEDIN_COVER_DISPLAY_H,
  LINKEDIN_COVER_DISPLAY_W,
  LINKEDIN_COVER_UPLOAD_H,
  LINKEDIN_COVER_UPLOAD_W,
  LINKEDIN_PROFILE_CARD_W,
} from "@/lib/linkedin-banner-preview";

type LinkedInBannerPreviewProps = {
  children: ReactNode;
  designLabel: string;
  exportHref: string;
};

/**
 * Scales the 1584×396 upload artboard into LinkedIn’s desktop profile card cover
 * (~804×201) with a 152px photo overlapping the bottom-left — matches live profile.
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

  const mockupStyle = {
    "--li-card-w": `${LINKEDIN_PROFILE_CARD_W}px`,
    "--li-cover-w": `${LINKEDIN_COVER_DISPLAY_W}px`,
    "--li-cover-h": `${LINKEDIN_COVER_DISPLAY_H}px`,
    "--li-avatar-size": `${LINKEDIN_AVATAR_SIZE}px`,
    "--li-avatar-left": `${LINKEDIN_AVATAR_LEFT}px`,
    "--li-avatar-border": `${LINKEDIN_AVATAR_BORDER}px`,
    "--li-stub-pad-top": `${LINKEDIN_AVATAR_SIZE / 2 + 8}px`,
    "--li-stub-body-left": `${LINKEDIN_AVATAR_LEFT + LINKEDIN_AVATAR_SIZE + 16}px`,
  } as CSSProperties;

  return (
    <div className="linkedin-preview-wrap">
      <div className="linkedin-preview-meta">
        <h2>{designLabel}</h2>
        <p>
          Preview is <strong>LinkedIn desktop profile card</strong> ({LINKEDIN_COVER_DISPLAY_W}×
          {LINKEDIN_COVER_DISPLAY_H}px cover — how your upload appears after LinkedIn scales it).
          Gray circle = your profile photo overlap.{" "}
          <strong>Click the cover</strong> for the {LINKEDIN_COVER_UPLOAD_W}×
          {LINKEDIN_COVER_UPLOAD_H}px PNG.
        </p>
      </div>

      <div className="linkedin-mockup" style={mockupStyle} aria-label="LinkedIn profile intro card preview">
        <Link
          href={exportHref}
          target="_blank"
          rel="noopener noreferrer"
          className="linkedin-cover-link"
          title={`Open upload PNG (${LINKEDIN_COVER_UPLOAD_W}×${LINKEDIN_COVER_UPLOAD_H})`}
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
          <div
            className="linkedin-avatar"
            title="Profile photo — overlaps bottom-left of cover on LinkedIn"
          />
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
