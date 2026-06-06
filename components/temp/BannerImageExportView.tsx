import {
  LINKEDIN_TREASURY_IMAGE_H,
  LINKEDIN_TREASURY_IMAGE_W,
} from "@/lib/linkedin-banner-preview";

type BannerImageExportViewProps = {
  designLabel: string;
  imageSrc: string;
  fileName: string;
};

export function BannerImageExportView({
  designLabel,
  imageSrc,
  fileName,
}: BannerImageExportViewProps) {
  return (
    <div className="temp-page temp-page-feature linkedin-export-page feature-export-page">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={`${designLabel} — LinkedIn treasury ${LINKEDIN_TREASURY_IMAGE_W}×${LINKEDIN_TREASURY_IMAGE_H}`}
        width={LINKEDIN_TREASURY_IMAGE_W}
        height={LINKEDIN_TREASURY_IMAGE_H}
        className="feature-export-image"
      />
      <a href={imageSrc} download={fileName} className="linkedin-export-download">
        Download image
      </a>
      <p className="linkedin-export-caption">
        {designLabel} — <strong>{LINKEDIN_TREASURY_IMAGE_W}×{LINKEDIN_TREASURY_IMAGE_H}px</strong>{" "}
        (LinkedIn treasury card). Right-click the image → <strong>Save image as…</strong>
      </p>
    </div>
  );
}
