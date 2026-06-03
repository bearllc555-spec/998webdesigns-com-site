// Portfolio carousel data.
// Poster: public/portfolio/<slug>.jpg
// Hover preview: public/portfolio/<slug>.mp4 — scripts/capture-portfolio-preview.mjs
//   (splices ~5s from the page hero <video> MP4, then a viewport scroll recording)

export type PortfolioItem = {
  slug: string;
  name: string;
  industry: string;
  /** Live client URL only — do not link to third-party template demos. */
  url?: string;
  /** Poster / fallback when preview video is absent or reduced-motion. */
  thumbnail: string;
  /** Muted loop played on card hover (desktop). */
  previewVideo?: string;
  /** Optional poster override; defaults to thumbnail. */
  previewPoster?: string;
};

export const portfolio: PortfolioItem[] = [
  {
    slug: "serenity-spa",
    name: "Serenity Spa",
    industry: "Spa & wellness",
    url: "https://dev.serenity-spa-3r8.pages.dev/",
    thumbnail: "/portfolio/serenity-spa.jpg",
    previewVideo: "/portfolio/serenity-spa.mp4",
  },
  {
    slug: "tuscano-excavating",
    name: "Frank Tuscano Excavating",
    industry: "Excavation & site work",
    url: "https://tuscano-excavating.pages.dev/",
    thumbnail: "/portfolio/tuscano-excavating.jpg",
    previewVideo: "/portfolio/tuscano-excavating.mp4",
  },
  {
    slug: "jetvip-charter",
    name: "VIP Charters",
    industry: "Private aviation",
    url: "https://jetvipcharter-dev.pages.dev/",
    thumbnail: "/portfolio/jetvip-charter.jpg",
    previewVideo: "/portfolio/jetvip-charter.mp4",
  },
  {
    slug: "yogacentric",
    name: "YogaCentric",
    industry: "Yoga & wellness",
    url: "https://yogacentric-com-site.pages.dev/",
    thumbnail: "/portfolio/yogacentric.jpg",
  },
  {
    slug: "borst-landscape",
    name: "Borst Landscape & Design",
    industry: "Landscaping",
    url: "https://landscape-design-site-cui.pages.dev/",
    thumbnail: "/portfolio/borst-landscape.jpg",
  },
  {
    slug: "new-empire-corp",
    name: "New Empire Corp",
    industry: "Corporate & design",
    url: "https://dev.nyc-design.pages.dev/",
    thumbnail: "/portfolio/new-empire-corp.jpg",
    previewVideo: "/portfolio/new-empire-corp.mp4",
  },
  {
    slug: "pocono-vacation-homes",
    name: "Pocono Vacation Homes",
    industry: "Vacation rentals",
    url: "https://dev.vacation-homes.pages.dev/",
    thumbnail: "/portfolio/pocono-vacation-homes.jpg",
    previewVideo: "/portfolio/pocono-vacation-homes.mp4",
  },
  {
    slug: "field-books-cpa",
    name: "Field Books CPA",
    industry: "Professional services",
    thumbnail: "/portfolio/placeholder.svg",
  },
  {
    slug: "north-branch-roofing",
    name: "North Branch Roofing",
    industry: "Trades",
    thumbnail: "/portfolio/placeholder.svg",
  },
  {
    slug: "three-hills-cafe",
    name: "Three Hills Cafe",
    industry: "Restaurants & cafes",
    thumbnail: "/portfolio/placeholder.svg",
  },
  {
    slug: "broadway-outdoor",
    name: "Broadway Outdoor Co.",
    industry: "Boutique retail",
    thumbnail: "/portfolio/placeholder.svg",
  },
];

export const industries = Array.from(
  new Set(portfolio.map((p) => p.industry))
).sort();

export const hasPortfolioVideoPreviews = portfolio.some((p) => p.previewVideo);
