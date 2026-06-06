import {
  LINKEDIN_COVER_UPLOAD_H,
  LINKEDIN_COVER_UPLOAD_W,
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
    <div className="temp-page linkedin-export-page">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        width={LINKEDIN_COVER_UPLOAD_W}
        height={LINKEDIN_COVER_UPLOAD_H}
        alt={`${designLabel} — LinkedIn banner ${LINKEDIN_COVER_UPLOAD_W}×${LINKEDIN_COVER_UPLOAD_H}`}
        className="linkedin-export-image"
      />
      <a href={imageSrc} download={fileName} className="linkedin-export-download">
        Download PNG
      </a>
      <p className="linkedin-export-caption">
        {designLabel} — <strong>{LINKEDIN_COVER_UPLOAD_W}×{LINKEDIN_COVER_UPLOAD_H}px</strong>.
        Right-click the image → <strong>Save image as…</strong>
      </p>
    </div>
  );
}
