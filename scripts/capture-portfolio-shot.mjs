/**
 * Full-page portfolio capture for carousel hover-reveal.
 * Uses viewport stitching (reliable on Framer / fixed-position sites).
 *
 * Usage: node scripts/capture-portfolio-shot.mjs <url> <output-path>
 */
import { chromium } from "playwright";
import path from "node:path";
import sharp from "sharp";

const url = process.argv[2];
const outputPath = path.resolve(process.argv[3]);

if (!url || !outputPath) {
  console.error("Usage: node scripts/capture-portfolio-shot.mjs <url> <output-path>");
  process.exit(1);
}

const VIEWPORT = { width: 1200, height: 900 };

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
      await delay(250);
      y += step;
    }

    window.scrollTo(0, 0);
    await delay(500);
  });
}

async function captureStitched(page) {
  const totalHeight = await page.evaluate(() =>
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
  );

  const slices = [];
  let y = 0;

  while (y < totalHeight) {
    const clipHeight = Math.min(VIEWPORT.height, totalHeight - y);
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(350);

    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 92,
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: clipHeight },
    });

    slices.push({ top: y, buffer });
    y += VIEWPORT.height;
  }

  await page.evaluate(() => window.scrollTo(0, 0));

  const composites = await Promise.all(
    slices.map(async ({ top, buffer }) => ({
      input: await sharp(buffer).toBuffer(),
      top,
      left: 0,
    }))
  );

  await sharp({
    create: {
      width: VIEWPORT.width,
      height: totalHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outputPath);

  return { width: VIEWPORT.width, height: totalHeight, slices: slices.length };
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
await page.waitForTimeout(1500);
await preloadLazyContent(page);
await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
await page.waitForTimeout(1500);

const size = await captureStitched(page);

console.log(`Saved ${outputPath}`);
console.log(`Page: ${size.width}px wide, ${size.height}px tall (${size.slices} slices)`);

await browser.close();
