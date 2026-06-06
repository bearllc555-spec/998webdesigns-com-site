/**
 * Full-page JPEG for portfolio carousel (hover = CSS pan top → bottom).
 *
 *   node scripts/capture-portfolio-poster.mjs <slug> <url>
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
const VIEWPORT = { width: 960, height: 720 };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });

console.log(`Loading ${url}`);
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
await page.waitForTimeout(1_500);
await page.evaluate(() => window.scrollTo(0, 0));

const pageHeight = await page.evaluate(() => {
  return Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight ?? 0
  );
});

await page.screenshot({
  path: posterPath,
  type: "jpeg",
  quality: 80,
  clip: { x: 0, y: 0, width: VIEWPORT.width, height: pageHeight },
});

await browser.close();

console.log(`Wrote ${posterPath} (${VIEWPORT.width}x${pageHeight}px)`);
