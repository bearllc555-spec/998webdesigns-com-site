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
  /** When true, thumbnail opens url in a new tab. Preview-only entries are hover-scroll only. */
  live?: boolean;
};

export const portfolio: PortfolioItem[] = [
  {
    slug: "serenity-spa",
    name: "Serenity Spa",
    industry: "Spa & wellness",
    url: "https://serenity-spa.998webdesigns.com",
    thumbnail: "/portfolio/serenity-spa-velvet.jpg",
    live: true,
  },
  {
    slug: "yogacentric-studio",
    name: "YogaCentric",
    industry: "Yoga studio",
    url: "https://998webdesigns-templates.vercel.app/templates/yogacentric-studio",
    thumbnail: "/portfolio/yogacentric-studio.jpg",
    live: true,
  },
  {
    slug: "stayli",
    name: "Stayli",
    industry: "Travel & stays",
    url: "https://stayli.framer.website/",
    thumbnail: "/portfolio/stayli.jpg?v=18",
  },
  {
    slug: "innovative-legal-strategies",
    name: "Innovative Legal Strategies",
    industry: "Law firm",
    url: "#",
    thumbnail: "/portfolio/innovative-legal-strategies.jpg?v=19",
  },
  {
    slug: "luxury-real-estate",
    name: "Luxury Real Estate",
    industry: "Real estate",
    url: "#",
    thumbnail: "/portfolio/luxury-real-estate.jpg?v=20",
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
