import { Design2Artboard } from "@/components/temp/artboards/Design2Artboard";
import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInBannerPreview } from "@/components/temp/LinkedInBannerPreview";
import "../linkedin-preview.css";
import "../linkedin-offer-column.css";
import "./linkedin-banner-manhattan.css";

export default function TempV2Page() {
  return (
    <div className="temp-page-v2">
      <BannerDesignNav />

      <LinkedInBannerPreview
        designLabel="Design 2 — Manhattan · Geist + Inter"
        exportHref="/temp/2/export"
      >
        <Design2Artboard />
      </LinkedInBannerPreview>

      <p className="hint">
        Preview matches your live LinkedIn card (792×198). Keep logo and offer right of your
        profile photo. Click cover for upload PNG.
      </p>
    </div>
  );
}
