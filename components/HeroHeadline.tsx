"use client";

const LINE1 = "we don't sell websites.";
const LINE2_PREFIX = "we build ";
const LINE2_ACCENT = "growth systems.";

/** ~80ms per letter - slow reveal on load */
const LETTER_DELAY_S = 0.08;

function Letter({
  char,
  index,
  accent,
}: {
  char: string;
  index: number;
  accent?: boolean;
}) {
  return (
    <span
      className={accent ? "hero-letter text-accent" : "hero-letter"}
      style={{ animationDelay: `${index * LETTER_DELAY_S}s` }}
      aria-hidden={char === " " ? true : undefined}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  );
}

export function HeroHeadline({ className }: { className: string }) {
  let index = 0;
  const line1 = [...LINE1].map((char) => {
    const el = <Letter key={`l1-${index}`} char={char} index={index} />;
    index += 1;
    return el;
  });
  const line2Prefix = [...LINE2_PREFIX].map((char) => {
    const el = <Letter key={`l2p-${index}`} char={char} index={index} />;
    index += 1;
    return el;
  });
  const line2Accent = [...LINE2_ACCENT].map((char) => {
    const el = (
      <Letter key={`l2a-${index}`} char={char} index={index} accent />
    );
    index += 1;
    return el;
  });

  return (
    <h1
      className={className}
      aria-label="We don't sell websites. We build growth systems."
    >
      <span className="block">{line1}</span>
      <span className="block">
        {line2Prefix}
        {line2Accent}
      </span>
    </h1>
  );
}
