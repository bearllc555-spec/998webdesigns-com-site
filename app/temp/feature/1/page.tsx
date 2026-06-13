import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { FeatureImagePreview } from "@/components/temp/FeatureImagePreview";
import { BANNER_FEATURE_ROUTES } from "@/lib/linkedin-banner-preview";
import "../../linkedin-preview.css";
import "../feature-banner.css";

const feature = BANNER_FEATURE_ROUTES[0];

export default function TempFeature1Page() {
  return (
    <div className="temp-page temp-page-feature">
      <BannerDesignNav />

      <FeatureImagePreview
        designLabel={feature.designLabel}
        imageSrc={feature.imageSrc}
        alt={feature.designLabel}
        exportHref={feature.exportHref}
      />

      <p className="hint">LinkedIn treasury card size (480×322) - not the profile cover mockup.</p>
    </div>
  );
}
