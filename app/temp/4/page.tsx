import { Design4Artboard } from "@/components/temp/artboards/Design4Artboard";
import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInBannerPreview } from "@/components/temp/LinkedInBannerPreview";
import "../linkedin-preview.css";
import "./linkedin-banner-d4.css";

export default function TempV4Page() {
  return (
    <div className="temp-page-v4">
      <BannerDesignNav />

      <LinkedInBannerPreview
        designLabel="Design 4 — wireframe + slanted offer (LinkedIn reference)"
        exportHref="/temp/4/export"
      >
        <Design4Artboard />
      </LinkedInBannerPreview>

      <p className="hint">
        Click the cover to open the upload-ready PNG in a new tab — right-click → Save image as.
      </p>
    </div>
  );
}
