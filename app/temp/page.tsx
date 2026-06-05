import { Design1Artboard } from "@/components/temp/artboards/Design1Artboard";
import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInBannerPreview } from "@/components/temp/LinkedInBannerPreview";
import "./linkedin-preview.css";
import "./linkedin-banner.css";

export default function TempPage() {
  return (
    <div className="temp-page">
      <BannerDesignNav />

      <LinkedInBannerPreview designLabel="Design 1 — Bricolage display" exportHref="/temp/export">
        <Design1Artboard />
      </LinkedInBannerPreview>

      <p className="hint">
        Click the cover to open the upload-ready PNG in a new tab — right-click → Save image as.
      </p>
    </div>
  );
}
