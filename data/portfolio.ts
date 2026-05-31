// Portfolio carousel + /portfolio page data.
// Add a new client = add one entry here. Drop the thumbnail under public/portfolio/<slug>.jpg.
// Use real screenshots — full-page captures, ~1200px wide. The Carousel reveals the rest of the
// page on hover (the "scroll-reveal" pattern).

export type PortfolioItem = {
  slug: string;
  name: string;
  industry: string;
  url: string;
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
    url: "https://startbootstrap.com/previews/business-frontpage",
    thumbnail: "/portfolio/business-front.jpg",
  },
  {
    slug: "north-branch-roofing",
    name: "North Branch Roofing",
    industry: "Trades",
    url: "https://templatemo.com/templates/templatemo_578_first_portfolio/",
    thumbnail: "/portfolio/first-portfolio.jpg",
  },
  {
    slug: "hayes-and-co-studio",
    name: "Hayes & Co Studio",
    industry: "Creative & photography",
    url: "https://html5up.net/uploads/demos/strata/",
    thumbnail: "/portfolio/strata.jpg",
  },
  {
    slug: "three-hills-cafe",
    name: "Three Hills Cafe",
    industry: "Restaurants & cafes",
    url: "https://templatemo.com/templates/templatemo_590_topic_listing/",
    thumbnail: "/portfolio/topic-listing.jpg",
  },
  {
    slug: "broadway-outdoor",
    name: "Broadway Outdoor Co.",
    industry: "Boutique retail",
    url: "https://html5up.net/uploads/demos/highlights/",
    thumbnail: "/portfolio/highlights.jpg",
  },
];

export const industries = Array.from(
  new Set(portfolio.map((p) => p.industry))
).sort();
