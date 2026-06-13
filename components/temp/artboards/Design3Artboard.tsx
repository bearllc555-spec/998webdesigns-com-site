import { ManhattanSilhouette } from "@/components/temp/ManhattanSilhouette";
import { LinkedInBannerOfferColumn } from "@/components/temp/LinkedInBannerOfferColumn";

export function Design3Artboard() {
  return (
    <div className="linkedin-banner" id="banner">
      <div className="skyline-wrap">
        <ManhattanSilhouette />
      </div>
      <div className="sky-fade" aria-hidden="true" />
      <div className="bg-line" aria-hidden="true" />

      <div className="content">
        <div className="brand-block">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Handcrafted for local service businesses
          </p>
          <h1 className="logo" aria-label="998 webdesigns">
            <span className="logo-998">998</span>
            <span className="logo-rest">webdesigns</span>
          </h1>
          <p className="tagline">
            <strong>High-converting websites</strong> - built in 7 business days, no agency bloat.
          </p>
        </div>

        <LinkedInBannerOfferColumn variant="glass" />
      </div>
    </div>
  );
}
