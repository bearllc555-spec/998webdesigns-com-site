function DecoChartIcon() {
  return (
    <svg viewBox="0 0 48 32" fill="none" aria-hidden="true">
      <path
        d="M4 28V12M14 28V8M24 28V16M34 28V4M44 28V20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DecoShieldIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 4L8 10v10c0 7.5 5.2 14.5 12 16 6.8-1.5 12-8.5 12-16V10L20 4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DecoUsersIcon() {
  return (
    <svg viewBox="0 0 48 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 28c0-6 4.5-10 10-10s10 4 10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="34" cy="14" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M28 28c0-4.5 2.8-7.5 6-7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Design4Artboard() {
  return (
    <div className="linkedin-banner" id="banner">
      <div className="deco-glow" aria-hidden="true" />
      <div className="deco-dots" aria-hidden="true" />

      <div className="deco-cards" aria-hidden="true">
        <div className="deco-card deco-card--chart">
          <DecoChartIcon />
        </div>
        <div className="deco-card deco-card--shield">
          <DecoShieldIcon />
        </div>
        <div className="deco-card deco-card--users">
          <DecoUsersIcon />
        </div>
      </div>

      <svg
        className="deco-icon deco-icon--globe"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>

      <div className="content">
        <div className="brand-block">
          <div className="brand-divider" aria-hidden="true">
            <span className="brand-divider-line" />
            <span className="brand-divider-dot" />
            <span className="brand-divider-line" />
          </div>
          <h1 className="logo" aria-label="998 WebDesigns">
            <span className="logo-998">998</span>
            <span className="logo-web">Web</span>
            <span className="logo-designs">Designs</span>
          </h1>
          <div className="logo-accent" aria-hidden="true" />
          <p className="tagline">High-Converting Websites for Service-Based Businesses</p>
        </div>

        <aside className="offer-slate" aria-label="Offer">
          <p className="offer-main">
            7-Day Builds<span className="sep">•</span>$5,998 Flat
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
            998WebDesigns.com
          </p>
        </aside>
      </div>
    </div>
  );
}
