/**
 * Full-page portfolio capture for carousel hover-reveal.
 * Usage: node scripts/capture-portfolio-shot.mjs <url> <output-path>
 */
import { chromium } from "playwright";
import path from "node:path";

const url = process.argv[2];
const outputPath = path.resolve(process.argv[3]);

if (!url || !outputPath) {
  console.error("Usage: node scripts/capture-portfolio-shot.mjs <url> <output-path>");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1,
});

await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(2500);

await page.screenshot({
  path: outputPath,
  fullPage: true,
  type: "jpeg",
  quality: 85,
});

const size = await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  clientWidth: document.documentElement.clientWidth,
}));

console.log(`Saved ${outputPath}`);
console.log(`Page: ${size.clientWidth}px wide, ${size.scrollHeight}px tall`);

await browser.close();
