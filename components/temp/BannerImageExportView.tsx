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
        alt={`${designLabel} — full image`}
        className="feature-export-image"
      />
      <a href={imageSrc} download={fileName} className="linkedin-export-download">
        Download PNG
      </a>
      <p className="linkedin-export-caption">
        {designLabel} — native file size. Right-click the image → <strong>Save image as…</strong>
      </p>
    </div>
  );
}
