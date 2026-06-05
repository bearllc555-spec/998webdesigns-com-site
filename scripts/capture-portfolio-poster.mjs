/**
 * Static viewport poster for portfolio carousel (4:3 card crop).
 * Usage: node scripts/capture-portfolio-poster.mjs <slug> <url>
 */

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2];
const url = process.argv[3];

if (!slug || !url) {
  console.error("Usage: node scripts/capture-portfolio-poster.mjs <slug> <url>");
  process.exit(1);
}

const posterPath = path.join(__dirname, "../public/portfolio", `${slug}.jpg`);
const VIEWPORT = { width: 1200, height: 900 };

const browser = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: VIEWPORT });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page
  .evaluate(async () => {
    const video = document.querySelector("video");
    if (!video) return;
    video.muted = true;
    try {
      await video.play();
    } catch {
      /* ignore */
    }
  })
  .catch(() => undefined);
await page.waitForTimeout(3_000);
await page.screenshot({ path: posterPath, type: "jpeg", quality: 88 });
await browser.close();

console.log(`Wrote poster ${posterPath}`);
