// Portfolio carousel data.
// Add a client: drop public/portfolio/<slug>.jpg (~1200x900) and set url when the site is live.

export type PortfolioItem = {
  slug: string;
  name: string;
  industry: string;
  /** Live client URL only — do not link to third-party template demos. */
  url?: string;
  thumbnail: string;
};

export const portfolio: PortfolioItem[] = [
  {
    slug: "serenity-spa",
    name: "Serenity Spa",
    industry: "Spa & wellness",
    url: "https://serenity-spa.998webdesigns.com",
    thumbnail: "/portfolio/serenity-spa.jpg",
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
    slug: "hayes-and-co-studio",
    name: "Hayes & Co Studio",
    industry: "Creative & photography",
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
