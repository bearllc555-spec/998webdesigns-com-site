/** Night Lower Manhattan skyline — operator photo (see design/linkedin-banner/README.md). */
const MANHATTAN_SKYLINE_SRC = "/linkedin-banner/manhattan-skyline-night.png";

export function Design5Artboard() {
  return (
    <div className="linkedin-banner" id="banner">
      <div className="skyline-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="skyline-photo"
          src={MANHATTAN_SKYLINE_SRC}
          alt=""
          width={1584}
          height={396}
          draggable={false}
        />
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
            <strong>High-converting websites</strong> — built in 7 business days, no agency bloat.
          </p>
        </div>

        <aside className="offer offer--glass" aria-label="Offer">
          <p className="offer-kicker">Flat pricing</p>
          <p className="offer-main">
            <span className="offer-line">7-day builds</span>
            <span className="offer-sep" aria-hidden="true">
              ·
            </span>
            <span className="offer-highlight">$1,998 flat</span>
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
  );
}
