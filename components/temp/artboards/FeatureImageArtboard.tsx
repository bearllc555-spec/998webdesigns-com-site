type FeatureImageArtboardProps = {
  src: string;
  alt: string;
};

export function FeatureImageArtboard({ src, alt }: FeatureImageArtboardProps) {
  return (
    <div className="linkedin-banner linkedin-banner--image" id="banner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={1584}
        height={396}
        className="linkedin-banner-image"
        decoding="async"
      />
    </div>
  );
}
