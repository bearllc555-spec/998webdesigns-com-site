/**
 * Creates or updates Stripe Customer Portal config for month-to-month hosting.
 * Run once per Stripe account (test + live). Prints configuration id for Vercel.
 *
 *   node scripts/configure-stripe-billing-portal.mjs
 *
 * Reads sk_live_ or sk_test_ from STRIPE_SECRET_KEY env or slatepress/.local/stripe-live-secret-key.txt
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const localKeyFile = path.resolve(repoRoot, "../../.local/stripe-live-secret-key.txt");

function loadKey() {
  if (process.env.STRIPE_SECRET_KEY?.trim()) {
    return process.env.STRIPE_SECRET_KEY.trim();
  }
  if (fs.existsSync(localKeyFile)) {
    const line = fs
      .readFileSync(localKeyFile, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("sk_"));
    if (line) return line;
  }
  throw new Error("Set STRIPE_SECRET_KEY or fill stripe-live-secret-key.txt");
}

const stripe = new Stripe(loadKey());

const desiredFeatures = {
  customer_update: { enabled: false },
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  subscription_cancel: {
    enabled: true,
    mode: "at_period_end",
  },
  subscription_update: { enabled: false },
};

const configs = await stripe.billingPortal.configurations.list({ limit: 10 });
let config = configs.data.find((c) => c.is_default) ?? configs.data[0];

if (config) {
  config = await stripe.billingPortal.configurations.update(config.id, {
    business_profile: {
      headline: "998 web designs — hosting billing",
    },
    features: desiredFeatures,
  });
  console.log("updated_configuration_id=" + config.id);
} else {
  config = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "998 web designs — hosting billing",
    },
    features: desiredFeatures,
  });
  console.log("created_configuration_id=" + config.id);
}

console.log("");
console.log("Optional: set on Vercel Production (998webdesigns-com-site):");
console.log("STRIPE_BILLING_PORTAL_CONFIGURATION_ID=" + config.id);
console.log("");
console.log("Dashboard: https://dashboard.stripe.com/settings/billing/portal");
