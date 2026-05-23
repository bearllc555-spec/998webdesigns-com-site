/**
 * Full-page portfolio capture for carousel hover-reveal.
 * Usage: node scripts/capture-portfolio-shot.mjs <url> <output-path>
 *
 * Scrolls the page first so lazy-loaded images (Framer, etc.) render before capture.
 */
import { chromium } from "playwright";
import path from "node:path";

const url = process.argv[2];
const outputPath = path.resolve(process.argv[3]);

if (!url || !outputPath) {
  console.error("Usage: node scripts/capture-portfolio-shot.mjs <url> <output-path>");
  process.exit(1);
}

async function preloadLazyContent(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.max(400, Math.floor(window.innerHeight * 0.75));
    let y = 0;
    const maxY = () =>
      Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight;

    while (y <= maxY()) {
      window.scrollTo(0, y);
      await delay(200);
      y += step;
    }

    window.scrollTo(0, 0);
    await delay(400);
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1,
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
await page.waitForTimeout(1500);
await preloadLazyContent(page);
await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
await page.waitForTimeout(2000);

await page.screenshot({
  path: outputPath,
  fullPage: true,
  type: "jpeg",
  quality: 92,
});

const size = await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  clientWidth: document.documentElement.clientWidth,
}));

console.log(`Saved ${outputPath}`);
console.log(`Page: ${size.clientWidth}px wide, ${size.scrollHeight}px tall`);

await browser.close();
