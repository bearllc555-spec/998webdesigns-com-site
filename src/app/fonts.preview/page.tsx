import {
  Newsreader,
  Cormorant_Garamond,
  DM_Serif_Display,
  Playfair_Display,
  Lora,
  Spectral,
  Manrope,
  Plus_Jakarta_Sans,
  DM_Sans,
  Outfit,
  Bricolage_Grotesque,
  Familjen_Grotesk,
  Instrument_Serif,
  Fraunces,
  Geist,
  Inter,
} from "next/font/google";
import Link from "next/link";

/* ============================================================
   /fonts.preview — diagnostic page.
   Shows the hero H1 in 16 Google Fonts, stacked a..p, all at the
   same size + tracking so the typeface is the only variable.
   Visit then tell Claude which letter to lock in.
   Not linked from home; noindex/nofollow.
   ============================================================ */

const newsreader = Newsreader({ subsets: ["latin"], weight: "500", variable: "--f-newsreader", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: "500", variable: "--f-cormorant", display: "swap" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--f-dm-serif", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: "600", variable: "--f-playfair", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: "600", variable: "--f-lora", display: "swap" });
const spectral = Spectral({ subsets: ["latin"], weight: "500", variable: "--f-spectral", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: "700", variable: "--f-manrope", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: "700", variable: "--f-jakarta", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: "700", variable: "--f-dm-sans", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], weight: "700", variable: "--f-outfit", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: "700", variable: "--f-bricolage", display: "swap" });
const familjen = Familjen_Grotesk({ subsets: ["latin"], weight: "700", variable: "--f-familjen", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--f-instrument", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--f-fraunces", display: "swap", axes: ["opsz"] });
const geist = Geist({ subsets: ["latin"], weight: "700", variable: "--f-geist", display: "swap" });
const interHeavy = Inter({ subsets: ["latin"], weight: "900", variable: "--f-inter-heavy", display: "swap" });

type SampleFont = {
  letter: string;
  name: string;
  category: "Editorial serif" | "Modern sans" | "Previously tried";
  varName: string;
  // Per-font fine-tuning so each shows at its best.
  weight: number;
  tracking: string; // e.g. "-0.02em"
};

const fonts: SampleFont[] = [
  // Editorial serifs (haven't been tried yet)
  { letter: "a", name: "Newsreader", category: "Editorial serif", varName: "--f-newsreader", weight: 500, tracking: "-0.015em" },
  { letter: "b", name: "Cormorant Garamond", category: "Editorial serif", varName: "--f-cormorant", weight: 500, tracking: "-0.01em" },
  { letter: "c", name: "DM Serif Display", category: "Editorial serif", varName: "--f-dm-serif", weight: 400, tracking: "-0.02em" },
  { letter: "d", name: "Playfair Display", category: "Editorial serif", varName: "--f-playfair", weight: 600, tracking: "-0.02em" },
  { letter: "e", name: "Lora", category: "Editorial serif", varName: "--f-lora", weight: 600, tracking: "-0.015em" },
  { letter: "f", name: "Spectral", category: "Editorial serif", varName: "--f-spectral", weight: 500, tracking: "-0.015em" },

  // Modern sans (haven't been tried yet)
  { letter: "g", name: "Manrope", category: "Modern sans", varName: "--f-manrope", weight: 700, tracking: "-0.03em" },
  { letter: "h", name: "Plus Jakarta Sans", category: "Modern sans", varName: "--f-jakarta", weight: 700, tracking: "-0.03em" },
  { letter: "i", name: "DM Sans", category: "Modern sans", varName: "--f-dm-sans", weight: 700, tracking: "-0.035em" },
  { letter: "j", name: "Outfit", category: "Modern sans", varName: "--f-outfit", weight: 700, tracking: "-0.03em" },
  { letter: "k", name: "Bricolage Grotesque", category: "Modern sans", varName: "--f-bricolage", weight: 700, tracking: "-0.035em" },
  { letter: "l", name: "Familjen Grotesk", category: "Modern sans", varName: "--f-familjen", weight: 700, tracking: "-0.03em" },

  // Previously tried — included so the comparison is complete
  { letter: "m", name: "Instrument Serif", category: "Previously tried", varName: "--f-instrument", weight: 400, tracking: "-0.015em" },
  { letter: "n", name: "Fraunces", category: "Previously tried", varName: "--f-fraunces", weight: 500, tracking: "-0.025em" },
  { letter: "o", name: "Geist (current pick)", category: "Previously tried", varName: "--f-geist", weight: 700, tracking: "-0.035em" },
  { letter: "p", name: "Inter (Black 900)", category: "Previously tried", varName: "--f-inter-heavy", weight: 900, tracking: "-0.035em" },
];

export const metadata = {
  title: "Fonts preview | 998webdesigns",
  robots: { index: false, follow: false },
};

export default function FontsPreview() {
  const variableClasses = [
    newsreader.variable, cormorant.variable, dmSerif.variable, playfair.variable,
    lora.variable, spectral.variable, manrope.variable, jakarta.variable,
    dmSans.variable, outfit.variable, bricolage.variable, familjen.variable,
    instrument.variable, fraunces.variable, geist.variable, interHeavy.variable,
  ].join(" ");

  return (
    <div className={variableClasses}>
      <header className="border-b border-rule bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <Link href="/" className="text-sm font-medium text-ink-soft transition hover:text-ink">
            &larr; Back to 998webdesigns
          </Link>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate">
            Fonts preview &middot; 16 candidates
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-16">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Pick a letter
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl"
              style={{ fontFamily: "var(--f-geist)" }}>
            Same hero, sixteen typefaces.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Every line below is the exact hero H1, rendered in a different Google Font at the same
            size, line-height, and weight tuned to flatter that face. Pick a letter and tell Claude
            &mdash; I&rsquo;ll collapse the site back to a single typeface in your pick.
          </p>
        </div>

        <ol className="space-y-12 md:space-y-16">
          {fonts.map((f) => (
            <li key={f.letter} className="border-b border-rule pb-12 last:border-b-0 md:pb-16">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                  {f.letter}. {f.name}
                </p>
                <span className="text-xs uppercase tracking-wider text-slate">
                  {f.category} &middot; weight {f.weight}
                </span>
              </div>
              <h2
                className="text-5xl leading-[1.04] text-ink md:text-7xl"
                style={{
                  fontFamily: `var(${f.varName})`,
                  fontWeight: f.weight,
                  letterSpacing: f.tracking,
                }}
              >
                A handcrafted website
                <br />
                for <span className="text-accent">$998.</span>{" "}
                <span className="text-ink-soft">Delivered in 5&ndash;7 business days.</span>
              </h2>
            </li>
          ))}
        </ol>

        <p className="mt-16 text-center text-sm text-slate">
          Tell Claude the letter. Or say &ldquo;keep Geist&rdquo; and we move on.
        </p>
      </main>
    </div>
  );
}
