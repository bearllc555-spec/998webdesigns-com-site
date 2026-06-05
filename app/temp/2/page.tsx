import { BannerDesignNav } from "@/components/temp/BannerDesignNav";
import { LinkedInBannerPreview } from "@/components/temp/LinkedInBannerPreview";
import { ManhattanSilhouette } from "@/components/temp/ManhattanSilhouette";
import "../linkedin-preview.css";
import "./linkedin-banner-manhattan.css";

export default function TempV2Page() {
  return (
    <div className="temp-page-v2">
      <BannerDesignNav />

      <LinkedInBannerPreview designLabel="Design 2 — Manhattan · Geist + Inter">
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
                <strong>High-converting websites</strong> — built in 7 business days, no agency
                bloat.
              </p>
            </div>

            <aside className="offer" aria-label="Offer">
              <p className="offer-kicker">Flat pricing</p>
              <p className="offer-main">
                7-day builds<span className="sep">·</span>$1,998 flat
              </p>
              <div className="offer-rule" aria-hidden="true" />
              <p className="offer-url">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                998webdesigns.com
              </p>
            </aside>
          </div>
        </div>
      </LinkedInBannerPreview>

      <p className="hint">
        White card matches LinkedIn desktop intro (1128×282 cover). Screenshot the cover strip;
        upload 1584×396.
      </p>
    </div>
  );
}
