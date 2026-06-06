/**
 * Full-page JPEG for portfolio carousel (hover = CSS pan top → bottom).
 *
 *   node scripts/capture-portfolio-poster.mjs <slug> <url>
 *
 * Uses fullPage screenshot (clip does not capture below the viewport).
 */

import { chromium } from "playwright";
import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2];
const url = process.argv[3];

if (!slug || !url) {
  console.error("Usage: node scripts/capture-portfolio-poster.mjs <slug> <url>");
  process.exit(1);
}

const posterPath = path.join(__dirname, "../public/portfolio", `${slug}.jpg`);
const tmpPath = path.join(os.tmpdir(), "998-portfolio-capture", `${slug}.jpg`);
const VIEWPORT = { width: 960, height: 720 };

fs.mkdirSync(path.dirname(tmpPath), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });

console.log(`Loading ${url}`);
await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
await page.waitForTimeout(2_000);
await page.evaluate(() => window.scrollTo(0, 0));

const pageHeight = await page.evaluate(() =>
  Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0)
);

await page.screenshot({
  path: tmpPath,
  type: "jpeg",
  quality: 80,
  fullPage: true,
});

await browser.close();

const dims = execSync(
  `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${tmpPath}"`,
  { encoding: "utf8" }
).trim();

console.log(`Captured ${dims} (page ${pageHeight}px)`);

const [, heightStr] = dims.split(",");
const capturedHeight = Number(heightStr);

if (pageHeight > 900 && capturedHeight <= 720) {
  console.error("ERROR: fullPage screenshot stayed at viewport height.");
  process.exit(1);
}

fs.copyFileSync(tmpPath, posterPath);
console.log(`Wrote ${posterPath}`);
