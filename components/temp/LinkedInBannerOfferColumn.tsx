import {
  LINKEDIN_BANNER_LIST_PRICE,
  LINKEDIN_BANNER_OFFER_CODE,
  LINKEDIN_BANNER_OFFER_KICKER,
  LINKEDIN_BANNER_PROMO_PRICE,
} from "@/lib/linkedin-banner-preview";

type OfferBoxVariant = "dark" | "glass" | "slate";

const BOX_CLASS: Record<OfferBoxVariant, string> = {
  dark: "offer",
  glass: "offer offer--glass",
  slate: "offer-slate",
};

function OfferGlobeIcon() {
  return (
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
  );
}

type LinkedInBannerOfferColumnProps = {
  variant?: OfferBoxVariant;
  buildsLabel?: string;
  flatLabel?: string;
  urlLabel?: string;
};

export function LinkedInBannerOfferColumn({
  variant = "dark",
  buildsLabel = "7-day builds",
  flatLabel = " flat",
  urlLabel = "998webdesigns.com",
}: LinkedInBannerOfferColumnProps) {
  const boxClass = BOX_CLASS[variant];

  return (
    <div className="offer-column">
      <div className="offer-special" aria-label="Limited time offer">
        <p className="offer-special-pct">{LINKEDIN_BANNER_OFFER_KICKER}</p>
        <p className="offer-special-code">{LINKEDIN_BANNER_OFFER_CODE}</p>
      </div>

      <aside className={boxClass} aria-label="Offer">
        <p className="offer-main">
          <span className="offer-builds">{buildsLabel}</span>
          <span className="offer-price-row">
            <span className="offer-price-was">{LINKEDIN_BANNER_LIST_PRICE}</span>
            <span
              className={
                variant === "glass" ? "offer-price-now offer-highlight" : "offer-price-now"
              }
            >
              {LINKEDIN_BANNER_PROMO_PRICE}
            </span>
            <span className="offer-price-flat">{flatLabel}</span>
          </span>
        </p>
        <div className="offer-rule" aria-hidden="true" />
        <p className="offer-url">
          <OfferGlobeIcon />
          {urlLabel}
        </p>
      </aside>
    </div>
  );
}
