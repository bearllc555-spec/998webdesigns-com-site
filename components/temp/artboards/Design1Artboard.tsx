import { ManhattanSilhouette } from "@/components/temp/ManhattanSilhouette";

export function Design1Artboard() {
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
            <strong>High-converting websites</strong>
            <span className="tagline-sub">Built in 7 business days - no agency bloat.</span>
          </p>
        </div>

        <p className="domain-mark" aria-hidden="true">
          998webdesigns.com
        </p>
      </div>
    </div>
  );
}
