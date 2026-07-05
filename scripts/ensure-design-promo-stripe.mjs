/**
 * Sync Stripe Coupons + Promotion Codes from lib/design-promo-codes.ts (keep in sync).
 * App checkout applies discounts server-side in lib/design-promo.ts.
 *
 * Usage: node scripts/ensure-design-promo-stripe.mjs [.env.local]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

/** Mirror of lib/design-promo-codes.ts - update both when adding codes. */
const DESIGN_PROMO_CODES = [{ code: "LINKEDIN20", percentOff: 20 }];

function loadEnv(file) {
  try {
    const text = readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    /* optional */
  }
}

const envFile = process.argv[2] ?? ".env.local";
loadEnv(resolve(envFile));

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY missing");
  process.exit(1);
}

const stripe = new Stripe(key);

async function ensurePromotionCode(couponId, code) {
  const existing = await stripe.promotionCodes.list({ code, limit: 1 });
  if (existing.data.length > 0) {
    console.log("Promotion code exists:", code, existing.data[0].id);
    return;
  }
  const promo = await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: couponId },
    code,
  });
  console.log("Created promotion code:", promo.code, promo.id);
}

async function main() {
  const product = await stripe.products.create({
    name: "Website Design (998)",
    description: "$7,998 design fee - promo codes discount design line only in app checkout",
    metadata: { site: "998webdesigns.com", line: "design_fee" },
  });
  console.log("Product:", product.id);

  await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: 799800,
    metadata: { list_price: "7998" },
  });

  for (const entry of DESIGN_PROMO_CODES) {
    const coupon = await stripe.coupons.create({
      percent_off: entry.percentOff,
      duration: "forever",
      name: `Design fee ${entry.percentOff}% off (${entry.code})`,
      metadata: {
        applies_to: "design_fee_only",
        promo_code: entry.code,
      },
    });
    console.log("Coupon:", entry.code, coupon.id);
    await ensurePromotionCode(coupon.id, entry.code);
  }

  console.log("Done. App checkout reads lib/design-promo-codes.ts on lead form submit.");
}

main().catch((err) => {
  console.error(err);
  throw err;
});
