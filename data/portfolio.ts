// Portfolio carousel data.
// Thumbnail: public/portfolio/<slug>.jpg — scripts/capture-portfolio-poster.mjs (full-page JPEG, pan on hover)
// URLs: apex pages.dev or client production domains. Branch previews (dev.*) only when no apex exists yet.

export type PortfolioItem = {
  slug: string;
  name: string;
  industry: string;
  /** Live client URL only — do not link to third-party template demos. */
  url?: string;
  /** Full-page screenshot; hover pans top → bottom in the carousel. */
  thumbnail: string;
};

export const portfolio: PortfolioItem[] = [
  {
    slug: "serenity-spa",
    name: "Serenity Spa",
    industry: "Spa & wellness",
    url: "https://serenity-spa-3r8.pages.dev/",
    thumbnail: "/portfolio/serenity-spa.jpg",
  },
  {
    slug: "tuscano-excavating",
    name: "Frank Tuscano Excavating",
    industry: "Excavation & site work",
    url: "https://tuscano-excavating.pages.dev/",
    thumbnail: "/portfolio/tuscano-excavating.jpg",
  },
  {
    slug: "jetvip-charter",
    name: "VIP Charters",
    industry: "Private aviation",
    url: "https://jetvipcharter-dev.pages.dev/",
    thumbnail: "/portfolio/jetvip-charter.jpg",
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
  },
  {
    slug: "new-empire-corp",
    name: "New Empire Corp",
    industry: "Corporate & design",
    url: "https://nyc-design.pages.dev/",
    thumbnail: "/portfolio/new-empire-corp.jpg",
  },
  {
    slug: "pocono-vacation-homes",
    name: "Pocono Vacation Homes",
    industry: "Vacation rentals",
    url: "https://dev.vacation-homes.pages.dev/",
    thumbnail: "/portfolio/pocono-vacation-homes.jpg",
  },
  {
    slug: "legally-design",
    name: "Legally",
    industry: "Legal services",
    url: "https://legally-design.pages.dev/",
    thumbnail: "/portfolio/legally-design.jpg",
  },
];

export const industries = Array.from(
  new Set(portfolio.map((p) => p.industry))
).sort();
