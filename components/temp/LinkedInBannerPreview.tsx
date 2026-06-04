import type { ReactNode } from "react";

type LinkedInBannerPreviewProps = {
  children: ReactNode;
  designLabel: string;
};

/**
 * Wraps a 1584×396 banner artboard in a LinkedIn desktop–sized frame (~1128px wide, 4:1).
 * Profile photo placeholder shows the overlap zone before upload.
 */
export function LinkedInBannerPreview({ children, designLabel }: LinkedInBannerPreviewProps) {
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
        <div className="linkedin-cover-slot">
          <div className="linkedin-cover-scale">{children}</div>
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
