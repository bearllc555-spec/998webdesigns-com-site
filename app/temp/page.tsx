import "./linkedin-banner.css";

export default function TempPage() {
  return (
    <div className="temp-page">
      <div className="linkedin-banner" id="banner">
        <div className="bg-glow" aria-hidden="true" />
        <div className="bg-watermark" aria-hidden="true">
          998
        </div>
        <div className="bg-dots" aria-hidden="true" />
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

      <p className="hint">
        LinkedIn banner 1584×396 — screenshot the white box above. Text is padded clear of the
        profile photo (bottom-left).
      </p>
    </div>
  );
}
