"use client";

import { useEffect, useRef, type ReactNode } from "react";

const ARTBOARD_W = 1584;
const ARTBOARD_H = 396;

type LinkedInBannerPreviewProps = {
  children: ReactNode;
  designLabel: string;
};

/**
 * Wraps a 1584×396 banner artboard in a LinkedIn desktop–sized frame (~1128px wide, 4:1).
 * Profile photo placeholder shows the overlap zone before upload.
 */
export function LinkedInBannerPreview({ children, designLabel }: LinkedInBannerPreviewProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    const scale = scaleRef.current;
    if (!slot || !scale) return;

    const applyScale = () => {
      const w = slot.clientWidth;
      if (w <= 0) return;
      scale.style.transform = `scale(${w / ARTBOARD_W})`;
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
          Preview matches <strong>LinkedIn desktop cover size</strong> (≈1128×282 display). Upload
          the exported PNG at <strong>1584×396 px</strong> for best quality.
        </p>
      </div>

      <div className="linkedin-mockup" aria-label="LinkedIn profile header preview">
        <div ref={slotRef} className="linkedin-cover-slot">
          <div
            ref={scaleRef}
            className="linkedin-cover-scale"
            style={{ width: ARTBOARD_W, height: ARTBOARD_H }}
          >
            {children}
          </div>
        </div>
        <div className="linkedin-profile-stub" aria-hidden="true">
          <div className="linkedin-avatar" title="Profile photo overlap zone" />
          <div className="linkedin-stub-lines">
            <div className="linkedin-stub-line" style={{ width: "48%" }} />
            <div className="linkedin-stub-line linkedin-stub-line--short" />
          </div>
        </div>
      </div>
    </div>
  );
}
