import { Design1Artboard } from "@/components/temp/artboards/Design1Artboard";
import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInBannerPreview } from "@/components/temp/LinkedInBannerPreview";
import "./linkedin-preview.css";
import "./linkedin-banner.css";

export default function TempPage() {
  return (
    <div className="temp-page">
      <BannerDesignNav />

      <LinkedInBannerPreview
        designLabel="Design 1 — Manhattan clean (no offer)"
        exportHref="/temp/export"
      >
        <Design1Artboard />
      </LinkedInBannerPreview>

      <p className="hint">
        Preview matches your live LinkedIn card (792×198). Brand sits right of your profile photo —
        no offer panel. Click cover for upload PNG.
      </p>
    </div>
  );
}
