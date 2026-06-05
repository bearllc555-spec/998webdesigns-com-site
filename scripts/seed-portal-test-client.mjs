/**
 * Seed a month-to-month test client for /hosting/manage portal QA.
 *
 *   node scripts/seed-portal-test-client.mjs ademeo@gmail.com
 *
 * Creates live Stripe customer + trialing $198/mo subscription (no charge during trial),
 * inserts/updates wd_leads on helmet Supabase.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const localDir = path.resolve(repoRoot, "../../.local");

const email = (process.argv[2] ?? "ademeo@gmail.com").trim().toLowerCase();
const fullName = process.argv[3] ?? "Anthony (portal test)";
const businessName = process.argv[4] ?? "Portal test client";

function readStripeKey() {
  const envKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (envKey?.startsWith("sk_")) return envKey;
  const file = path.join(localDir, "stripe-live-secret-key.txt");
  if (fs.existsSync(file)) {
    const line = fs
      .readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("sk_"));
    if (line) return line;
  }
  throw new Error("Missing STRIPE_SECRET_KEY or stripe-live-secret-key.txt");
}

function readSupabase() {
  const notes = path.join(localDir, "supabase-998-helmet-notes.txt");
  if (!fs.existsSync(notes)) throw new Error("Missing supabase-998-helmet-notes.txt");
  const lines = fs
    .readFileSync(notes, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const url = lines.find((l) => l.startsWith("https://") && l.includes("supabase.co"));
  const secret = lines.find((l) => l.startsWith("sb_secret_"));
  if (!url || !secret) throw new Error("Parse supabase URL + sb_secret_ from helmet notes");
  return { url, secret };
}

const stripe = new Stripe(readStripeKey());
const supabase = createClient(readSupabase().url, readSupabase().secret);

const submittedAt = new Date().toISOString();
const billingStarts = new Date();
billingStarts.setUTCDate(billingStarts.getUTCDate() + 30);

const payload = {
  email,
  fullName,
  businessName,
  hostingChoice: "monthly",
  paymentChannel: "card",
  paymentOption: "full",
  promoCode: "",
  hearAboutSources: [],
  submittedAt,
  portalTestSeed: true,
};

console.log("email=" + email);

const customer = await stripe.customers.create({
  email,
  name: fullName,
  metadata: { portalTestSeed: "true", businessName },
});

const product = await stripe.products.create({
  name: "Month-to-month hosting (portal test seed)",
  metadata: { portalTestSeed: "true" },
});

const price = await stripe.prices.create({
  currency: "usd",
  unit_amount: 19800,
  recurring: { interval: "month" },
  product: product.id,
});

let subscription;
try {
  subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    trial_period_days: 30,
    metadata: { portalTestSeed: "true", hostingChoice: "monthly" },
  });
} catch (err) {
  await stripe.customers.del(customer.id).catch(() => {});
  throw err;
}

const row = {
  submitted_at: submittedAt,
  email,
  business_name: businessName,
  full_name: fullName,
  ip: null,
  payload,
  status: "paid_in_full",
  stripe_customer_id: customer.id,
  stripe_deposit_invoice_id: `seed_portal_${Date.now()}`,
  stripe_subscription_id: subscription.id,
  hosting_billing_starts_at: billingStarts.toISOString(),
  notes: "Portal test seed — safe to delete after QA",
};

const { data: existing } = await supabase
  .from("wd_leads")
  .select("id")
  .ilike("email", email)
  .order("submitted_at", { ascending: false })
  .limit(1)
  .maybeSingle();

let leadId;
if (existing?.id) {
  const { data, error } = await supabase
    .from("wd_leads")
    .update(row)
    .eq("id", existing.id)
    .select("id")
    .single();
  if (error) throw new Error("Supabase update failed: " + error.message);
  leadId = data.id;
  console.log("action=updated");
} else {
  const { data, error } = await supabase.from("wd_leads").insert(row).select("id").single();
  if (error) throw new Error("Supabase insert failed: " + error.message);
  leadId = data.id;
  console.log("action=inserted");
}

console.log("lead_id=" + leadId);
console.log("stripe_customer_id=" + customer.id);
console.log("stripe_subscription_id=" + subscription.id);
console.log("subscription_status=" + subscription.status);
console.log("");
console.log("Test: https://998webdesigns.com/hosting/manage");
console.log("Enter email: " + email);
