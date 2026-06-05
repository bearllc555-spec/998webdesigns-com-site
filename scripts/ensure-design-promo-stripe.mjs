/**
 * Creates a Stripe Coupon + Promotion Code for LAUNCH20 (documentation / Dashboard mirror).
 * Checkout uses server-side line-item discount in lib/design-promo.ts — this does NOT
 * auto-apply at Stripe Checkout unless you migrate to fixed Price IDs.
 *
 * Usage: node scripts/ensure-design-promo-stripe.mjs [.env.local]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

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
const PROMO_CODE = process.env.DESIGN_PROMO_CODE?.trim() || "LAUNCH20";

async function main() {
  const product = await stripe.products.create({
    name: "Website Design (998)",
    description: "$5,998 design fee — promo LAUNCH20 is 20% off design only in app checkout",
    metadata: { site: "998webdesigns.com", line: "design_fee" },
  });
  console.log("Product:", product.id);

  await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: 599800,
    metadata: { list_price: "5998" },
  });

  const coupon = await stripe.coupons.create({
    percent_off: 20,
    duration: "forever",
    name: "Design fee 20% off (LAUNCH20)",
    metadata: {
      applies_to: "design_fee_only",
      note: "Enforced in app checkout line items — not hosting",
    },
  });
  console.log("Coupon:", coupon.id);

  try {
    const promo = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code: PROMO_CODE,
    });
    console.log("Promotion code:", promo.code, promo.id);
  } catch (err) {
    if (err?.code === "promotion_code_already_exists") {
      console.log("Promotion code already exists:", PROMO_CODE);
    } else {
      throw err;
    }
  }

  console.log("Done. App checkout applies LAUNCH20 via lib/design-promo.ts on lead form submit.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
