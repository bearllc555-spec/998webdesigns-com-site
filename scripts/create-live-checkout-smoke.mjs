/**
 * Creates a live Stripe Checkout session ($1 card smoke test).
 * Open the printed URL only if you intend to run a real-card live payment test.
 * Cancel in Stripe Checkout to avoid a charge.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localDir = path.resolve(__dirname, "..", "..", "..", ".local");
const keyPath = path.join(localDir, "stripe-live-secret-key.txt");

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
          name: "Live webhook smoke ($1)",
          description: "Ops verification — refund in Stripe Dashboard after delivery shows 200.",
        },
        unit_amount: 100,
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
  cancel_url: "https://998webdesigns.com/start",
});

const urlFile = path.join(localDir, "smoke-checkout-url.txt");
const htmlFile = path.join(localDir, "smoke-checkout-open.html");
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const safeUrl = esc(session.url);

fs.writeFileSync(
  urlFile,
  `${session.url}\n${session.id}\n`,
  "utf8"
);
fs.writeFileSync(
  htmlFile,
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>998 live smoke checkout ($1)</title>
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
</head>
<body>
  <p>Redirecting to Stripe Checkout ($1)…</p>
  <p><a href="${safeUrl}">Click here if you are not redirected</a></p>
</body>
</html>`,
  "utf8"
);

console.log("session_id", session.id);
console.log("checkout_url", session.url);
console.log("dashboard", `https://dashboard.stripe.com/checkout/sessions/${session.id}`);
console.log("open_via_html", htmlFile);
console.log("note", "Use the HTML launcher or full checkout_url (includes # hash). Bare /pay/cs_live_... URLs fail.");
