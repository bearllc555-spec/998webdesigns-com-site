import { Design2Artboard } from "@/components/temp/artboards/Design2Artboard";
import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInBannerPreview } from "@/components/temp/LinkedInBannerPreview";
import "../linkedin-preview.css";
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
        Click the cover to open the full 1584×396 banner in a new tab — screenshot or save for
        LinkedIn upload.
      </p>
    </div>
  );
}
