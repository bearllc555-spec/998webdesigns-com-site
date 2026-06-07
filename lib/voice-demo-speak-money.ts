const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
] as const;

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;

function speakUnder100(n: number, useAnd: boolean): string {
  if (n < 20) return ONES[n]!;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const prefix = TENS[tens]!;
  if (ones === 0) return prefix;
  const joiner = useAnd ? " and " : " ";
  return `${prefix}${joiner}${ONES[ones]}`;
}

function speakUnder1000(n: number): string {
  if (n < 100) return speakUnder100(n, false);
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const head = `${ONES[hundreds]} hundred`;
  if (remainder === 0) return head;
  return `${head} and ${speakUnder100(remainder, false)}`;
}

/** Whole-dollar amounts for Jarvis voice (British butler style). */
export function speakUsdDollars(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
    throw new Error(`speakUsdDollars expects a non-negative integer, got ${amount}`);
  }
  if (amount === 0) return "zero dollars";

  const parts: string[] = [];
  let remaining = amount;

  const millions = Math.floor(remaining / 1_000_000);
  if (millions > 0) {
    parts.push(`${speakUnder1000(millions)} million`);
    remaining %= 1_000_000;
  }

  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    parts.push(`${speakUnder1000(thousands)} thousand`);
    remaining %= 1000;
  }

  if (remaining > 0) {
    parts.push(speakUnder1000(remaining));
  }

  const spoken = parts.join(", ");
  return `${spoken} dollar${amount === 1 ? "" : "s"}`;
}

/** Locked 998 price points — injected into Jarvis system prompt. */
export const VOICE_DEMO_PRICE_VOICE_EXAMPLES: ReadonlyArray<{
  amount: number;
  label: string;
}> = [
  { amount: 5998, label: "custom website design" },
  { amount: 198, label: "monthly hosting after the free trial" },
  { amount: 2996, label: "ten-year hosting" },
  { amount: 499, label: "Jarvis AI Voice Chatbot setup" },
  { amount: 149, label: "Jarvis AI Voice Chatbot monthly" },
  { amount: 299, label: "AI Agent Chatbot setup" },
  { amount: 79, label: "AI Agent Chatbot monthly" },
];

export const VOICE_DEMO_PRICE_SPEAKING_RULES = `PRICE PRONUNCIATION (mandatory — voice):
- Speak every dollar amount in full English words, never digit-by-digit and never shorthand like "four ninety-nine" or "five nine nine eight".
- Use "and" between hundreds and the remainder (e.g. four hundred and ninety nine dollars).
- Say "dollars" after the amount. For monthly fees say "per month" after the spoken amount.
- Examples you must follow:
${VOICE_DEMO_PRICE_VOICE_EXAMPLES.map(
  (row) =>
    `  - $${row.amount.toLocaleString("en-US")} (${row.label}): "${speakUsdDollars(row.amount)}${row.label.includes("monthly") ? " per month" : ""}"`
).join("\n")}
- When quoting two prices (setup and monthly), speak each amount fully in words before moving on.`;
