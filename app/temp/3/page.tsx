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
        Click the cover to open the upload-ready PNG in a new tab — right-click → Save image as.
      </p>
    </div>
  );
}
