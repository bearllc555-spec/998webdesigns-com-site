// Portfolio carousel data.
// Poster: public/portfolio/<slug>.jpg
// Hover preview (preferred): public/portfolio/<slug>-strip.jpg — scripts/capture-portfolio-strip.mjs
// Legacy video: public/portfolio/<slug>.mp4 — scripts/capture-portfolio-preview.mjs
// URLs: apex pages.dev or client production domains. Branch previews (dev.*) only when no apex exists yet.

export type PortfolioItem = {
  slug: string;
  name: string;
  industry: string;
  /** Live client URL only — do not link to third-party template demos. */
  url?: string;
  /** Poster / fallback when preview video is absent or reduced-motion. */
  thumbnail: string;
  /** Muted loop played on card hover (desktop). Superseded by previewStrip when set. */
  previewVideo?: string;
  /** Vertical frame strip (JPEG) — stepped scroll on hover; preferred over previewVideo. */
  previewStrip?: string;
  /** Frame count in previewStrip (for stepped translateY). */
  previewStripFrames?: number;
  /** Optional poster override; defaults to thumbnail. */
  previewPoster?: string;
  /**
   * When false, carousel shows poster pan only (no strip/MP4 on hover).
   * Use to break up adjacent motion cards when static-only sites are scarce.
   */
  carouselHoverPreview?: boolean;
};

export function hasMotionPreview(item: PortfolioItem): boolean {
  return Boolean(item.previewStrip || item.previewVideo);
}

export function hasCarouselMotionPreview(item: PortfolioItem): boolean {
  return hasMotionPreview(item) && item.carouselHoverPreview !== false;
}

/**
 * Carousel order: static-only + poster-pan slots between motion hovers so no two
 * strip previews sit adjacent (until more static-only portfolio sites ship).
 */
export function buildCarouselPortfolio(items: PortfolioItem[]): PortfolioItem[] {
  const motion = items.filter(hasCarouselMotionPreview);
  const staticSlot = items.filter((p) => !hasCarouselMotionPreview(p));

  const out: PortfolioItem[] = [];
  let mi = 0;
  let si = 0;

  while (mi < motion.length || si < staticSlot.length) {
    if (
      out.length > 0 &&
      hasCarouselMotionPreview(out[out.length - 1]!) &&
      mi < motion.length &&
      si < staticSlot.length
    ) {
      out.push(staticSlot[si++]!);
      continue;
    }
    if (mi < motion.length) {
      out.push(motion[mi++]!);
      continue;
    }
    if (si < staticSlot.length) {
      out.push(staticSlot[si++]!);
    }
  }

  return out;
}

/** Source list — edit slugs/assets here; carousel uses buildCarouselPortfolio(). */
const portfolioItems: PortfolioItem[] = [
  {
    slug: "serenity-spa",
    name: "Serenity Spa",
    industry: "Spa & wellness",
    url: "https://serenity-spa-3r8.pages.dev/",
    thumbnail: "/portfolio/serenity-spa.jpg",
    previewStrip: "/portfolio/serenity-spa-strip.jpg",
    previewStripFrames: 24,
  },
  {
    slug: "tuscano-excavating",
    name: "Frank Tuscano Excavating",
    industry: "Excavation & site work",
    url: "https://tuscano-excavating.pages.dev/",
    thumbnail: "/portfolio/tuscano-excavating.jpg",
    previewStrip: "/portfolio/tuscano-excavating-strip.jpg",
    previewStripFrames: 36,
  },
  {
    slug: "jetvip-charter",
    name: "VIP Charters",
    industry: "Private aviation",
    url: "https://jetvipcharter-dev.pages.dev/",
    thumbnail: "/portfolio/jetvip-charter.jpg",
    previewStrip: "/portfolio/jetvip-charter-strip.jpg",
    previewStripFrames: 36,
  },
  {
    slug: "borst-landscape",
    name: "Borst Landscape & Design",
    industry: "Landscaping",
    url: "https://landscape-design-site-cui.pages.dev/",
    thumbnail: "/portfolio/borst-landscape.jpg",
  },
  {
    slug: "yogacentric",
    name: "YogaCentric",
    industry: "Yoga & wellness",
    url: "https://yogacentric-com-site.pages.dev/",
    thumbnail: "/portfolio/yogacentric.jpg",
    previewStrip: "/portfolio/yogacentric-strip.jpg",
    previewStripFrames: 36,
  },
  {
    slug: "new-empire-corp",
    name: "New Empire Corp",
    industry: "Corporate & design",
    url: "https://nyc-design.pages.dev/",
    thumbnail: "/portfolio/new-empire-corp.jpg",
    previewStrip: "/portfolio/new-empire-corp-strip.jpg",
    previewStripFrames: 24,
    carouselHoverPreview: false,
  },
  {
    slug: "pocono-vacation-homes",
    name: "Pocono Vacation Homes",
    industry: "Vacation rentals",
    url: "https://dev.vacation-homes.pages.dev/",
    thumbnail: "/portfolio/pocono-vacation-homes.jpg",
    previewStrip: "/portfolio/pocono-vacation-homes-strip.jpg",
    previewStripFrames: 24,
    carouselHoverPreview: false,
  },
  {
    slug: "legally-design",
    name: "Legally",
    industry: "Legal services",
    url: "https://legally-design.pages.dev/",
    thumbnail: "/portfolio/legally-design.jpg",
    previewStrip: "/portfolio/legally-design-strip.jpg",
    previewStripFrames: 24,
    carouselHoverPreview: false,
  },
];

export const portfolio = buildCarouselPortfolio(portfolioItems);

export const industries = Array.from(
  new Set(portfolioItems.map((p) => p.industry))
).sort();

export const hasPortfolioVideoPreviews = portfolioItems.some(
  (p) => p.previewStrip || p.previewVideo
);
