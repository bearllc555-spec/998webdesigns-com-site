import { Design5Artboard } from "@/components/temp/artboards/Design5Artboard";
import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInBannerPreview } from "@/components/temp/LinkedInBannerPreview";
import "../linkedin-preview.css";
import "./linkedin-banner-manhattan-photo.css";

export default function TempV5Page() {
  return (
    <div className="temp-page-v5">
      <BannerDesignNav />

      <LinkedInBannerPreview
        designLabel="Design 5 — Manhattan photo · frosted offer"
        exportHref="/temp/5/export"
      >
        <Design5Artboard />
      </LinkedInBannerPreview>

      <p className="hint">
        Design 5 — same as 3 with faded Manhattan photo. Preview matches live LinkedIn card.
        Click cover for upload PNG.
      </p>
    </div>
  );
}
