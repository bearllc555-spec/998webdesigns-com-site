import Link from "next/link";

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
          Shown at native image size (not the LinkedIn 792×198 mockup).{" "}
          <strong>Click the image</strong> to open the full file.
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
        <img src={imageSrc} alt={alt} className="feature-preview-image" decoding="async" />
      </Link>
    </div>
  );
}
