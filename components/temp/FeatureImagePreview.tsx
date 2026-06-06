import Link from "next/link";
import {
  LINKEDIN_TREASURY_IMAGE_H,
  LINKEDIN_TREASURY_IMAGE_W,
} from "@/lib/linkedin-banner-preview";

type FeatureImagePreviewProps = {
  designLabel: string;
  imageSrc: string;
  alt: string;
  exportHref: string;
};

export function FeatureImagePreview({
  designLabel,
  imageSrc,
  alt,
  exportHref,
}: FeatureImagePreviewProps) {
  return (
    <div className="feature-preview-wrap">
      <div className="feature-preview-meta">
        <h2>{designLabel}</h2>
        <p>
          LinkedIn treasury card size ({LINKEDIN_TREASURY_IMAGE_W}×{LINKEDIN_TREASURY_IMAGE_H}px) —
          not the profile cover mockup. <strong>Click the image</strong> to open the full file.
        </p>
      </div>

      <Link
        href={exportHref}
        target="_blank"
        rel="noopener noreferrer"
        className="feature-preview-image-link"
        title="Open full image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={alt}
          width={LINKEDIN_TREASURY_IMAGE_W}
          height={LINKEDIN_TREASURY_IMAGE_H}
          className="feature-preview-image"
          decoding="async"
        />
      </Link>
    </div>
  );
}
