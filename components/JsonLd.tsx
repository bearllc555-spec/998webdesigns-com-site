import { faq, faqPlainAnswer } from "@/data/faq";
import { SITE_ORIGIN } from "@/lib/site-origin";

const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "998 web designs",
  url: SITE_ORIGIN,
  description:
    "Growth systems for local service businesses - handcrafted websites from $7,998, optional SEO, automation, and AI add-ons.",
  email: "hello@998webdesigns.com",
};

function faqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faqPlainAnswer(item.a),
      },
    })),
  };
}

export function JsonLd() {
  const faqLd = faqPageJsonLd();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </>
  );
}
