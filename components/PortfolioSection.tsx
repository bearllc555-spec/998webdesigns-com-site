import { Carousel } from "./Carousel";

type PortfolioSectionProps = {
  /** Standalone /portfolio page - extra intro line under the headline. */
  showIntro?: boolean;
  /** h1 on /portfolio; h2 on home (inside hero flow). */
  headingLevel?: "h1" | "h2";
};

export function PortfolioSection({
  showIntro = false,
  headingLevel = "h2",
}: PortfolioSectionProps) {
  const HeadingTag = headingLevel;
  // Standalone /portfolio: nav is already in document flow - large pt-* would
  // double the gap vs home hash targets (#how, #work) where section top = viewport 0.
  const headerPadding = showIntro
    ? "px-5 pt-6 pb-3 md:px-8 md:pb-4"
    : "px-5 pt-16 pb-3 md:px-8 md:pt-24 md:pb-4";

  return (
    <section
      id="work"
      className={showIntro ? "" : "border-t border-rule"}
    >
      <div className={`mx-auto max-w-6xl ${headerPadding}`}>
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Recent work
          </p>
          <HeadingTag className="mt-4 font-display text-3xl font-medium leading-tight md:text-5xl">
            built by hand for local business.
          </HeadingTag>
          {showIntro ? (
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              Hover any thumbnail to preview the live site. Open a card to visit it in a new tab.
            </p>
          ) : null}
        </div>
      </div>
      <Carousel compactTop hideHint={showIntro} />
    </section>
  );
}
