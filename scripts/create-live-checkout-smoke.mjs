/**
 * Creates a live Stripe Checkout session ($1,998 design smoke test).
 * Open the printed URL only if you intend to run a real-card live payment test.
 * Cancel in Stripe Checkout to avoid a charge.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyPath = path.resolve(__dirname, "..", "..", "..", ".local", "stripe-live-secret-key.txt");

function readLiveKey() {
  const text = fs.readFileSync(keyPath, "utf8");
  const line = text.split("\n").find((l) => l.startsWith("sk_live_"));
  if (!line) throw new Error("sk_live_ not found in stripe-live-secret-key.txt");
  return line.trim();
}

const stripe = new Stripe(readLiveKey());

const session = await stripe.checkout.sessions.create({
  mode: "payment",
  customer_email: "bearllc555@gmail.com",
  payment_method_types: ["card"],
  line_items: [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: "Website Design (live smoke test)",
          description: "Ops verification — cancel in Checkout if not intended.",
        },
        unit_amount: 199800,
      },
      quantity: 1,
    },
  ],
  metadata: {
    smokeTest: "true",
    paymentType: "full",
    paymentChannel: "card",
    hostingChoice: "later",
  },
  success_url:
    "https://998webdesigns.com/thanks?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: "https://998webdesigns.com/#start",
});

console.log("session_id", session.id);
console.log("checkout_url", session.url);
console.log("dashboard", `https://dashboard.stripe.com/checkout/sessions/${session.id}`);
