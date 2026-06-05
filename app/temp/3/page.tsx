import { Design3Artboard } from "@/components/temp/artboards/Design3Artboard";
import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInBannerPreview } from "@/components/temp/LinkedInBannerPreview";
import "../linkedin-preview.css";
import "./linkedin-banner-manhattan.css";

export default function TempV3Page() {
  return (
    <div className="temp-page-v3">
      <BannerDesignNav />

      <LinkedInBannerPreview
        designLabel="Design 3 — Manhattan · frosted offer"
        exportHref="/temp/3/export"
      >
        <Design3Artboard />
      </LinkedInBannerPreview>

      <p className="hint">
        Preview matches your live LinkedIn card (792×198). Keep logo and offer right of the gray
        photo circle. Click cover for upload PNG.
      </p>
    </div>
  );
}
