// Portfolio carousel + /portfolio page data.
// Add a new client = add one entry here. Drop the thumbnail under public/portfolio/<slug>.jpg.
// Use real screenshots — full-page captures, ~1200px wide. The Carousel reveals the rest of the
// page on hover (the "scroll-reveal" pattern).

export type PortfolioItem = {
  slug: string;
  name: string;
  industry: string;
  /** Shown on carousel cards — clarifies live demos vs samples. */
  tag: string;
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
    tag: "Live demo",
    url: "https://serenity-spa.998webdesigns.com",
    thumbnail: "/portfolio/serenity-spa-velvet.jpg",
    live: true,
  },
  {
    slug: "yogacentric-studio",
    name: "Yoga Center",
    industry: "Yoga studio",
    tag: "Template demo",
    url: "https://998webdesigns-templates.vercel.app/templates/yogacentric-studio",
    thumbnail: "/portfolio/yogacentric-studio.jpg",
    live: true,
  },
  {
    slug: "stayli",
    name: "Vacation Rentals",
    industry: "Travel & stays",
    tag: "Design reference",
    url: "https://stayli.framer.website/",
    thumbnail: "/portfolio/stayli.jpg?v=18",
  },
  {
    slug: "innovative-legal-strategies",
    name: "Innovative Legal Strategies",
    industry: "Law firm",
    tag: "Sample design",
    url: "#",
    thumbnail: "/portfolio/innovative-legal-strategies.jpg?v=19",
  },
  {
    slug: "luxury-real-estate",
    name: "Luxury Real Estate",
    industry: "Real estate",
    tag: "Sample design",
    url: "#",
    thumbnail: "/portfolio/luxury-real-estate.jpg?v=20",
  },
  {
    slug: "luxury-car-rental",
    name: "Luxury Car Rental",
    industry: "Car rental",
    tag: "Sample design",
    url: "#",
    thumbnail: "/portfolio/luxury-car-rental.jpg?v=21",
  },
  {
    slug: "borst-landscape-design",
    name: "Borst Landscape & Design",
    industry: "Landscape design",
    tag: "Live demo",
    url: "https://998webdesigns-templates.vercel.app/templates/borst-landscape-design",
    thumbnail: "/portfolio/borst-landscape-design.jpg",
    live: true,
  },
];

export const industries = Array.from(
  new Set(portfolio.map((p) => p.industry))
).sort();
