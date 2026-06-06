import { Design5Artboard } from "@/components/temp/artboards/Design5Artboard";
import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInBannerPreview } from "@/components/temp/LinkedInBannerPreview";
import "../linkedin-preview.css";
import "./linkedin-banner-manhattan-clean.css";

export default function TempV5Page() {
  return (
    <div className="temp-page-v5">
      <BannerDesignNav />

      <LinkedInBannerPreview
        designLabel="Design 5 — Manhattan clean (no offer)"
        exportHref="/temp/5/export"
      >
        <Design5Artboard />
      </LinkedInBannerPreview>

      <p className="hint">
        Preview matches your live LinkedIn card (792×198). Brand sits right of your profile photo —
        no offer panel. Click cover for upload PNG.
      </p>
    </div>
  );
}
