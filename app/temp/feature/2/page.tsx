import { FeatureImageArtboard } from "@/components/temp/artboards/FeatureImageArtboard";
import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInBannerPreview } from "@/components/temp/LinkedInBannerPreview";
import { BANNER_FEATURE_ROUTES } from "@/lib/linkedin-banner-preview";
import "../../linkedin-preview.css";
import "../feature-banner.css";

const feature = BANNER_FEATURE_ROUTES[1];

export default function TempFeature2Page() {
  return (
    <div className="temp-page temp-page-feature">
      <BannerDesignNav />

      <LinkedInBannerPreview designLabel={feature.designLabel} exportHref={feature.exportHref}>
        <FeatureImageArtboard src={feature.imageSrc} alt={feature.designLabel} />
      </LinkedInBannerPreview>

      <p className="hint">
        Uploaded banner preview (792×198). Click the cover for the full PNG download.
      </p>
    </div>
  );
}
