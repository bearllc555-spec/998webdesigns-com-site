/**
 * Record a hover-preview clip for the portfolio carousel.
 *
 * Usage (from repo root, requires playwright on PATH via npx):
 *   npx --yes -p playwright node scripts/capture-portfolio-preview.mjs <slug> <url>
 *
 * Example:
 *   npx --yes -p playwright node scripts/capture-portfolio-preview.mjs tuscano-excavating https://tuscano-excavating.pages.dev/
 *
 * Writes:
 *   public/portfolio/<slug>.mp4
 *   public/portfolio/<slug>.jpg  (poster frame, unless --skip-poster)
 */

import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2];
const url = process.argv[3];
const skipPoster = process.argv.includes("--skip-poster");

if (!slug || !url) {
  console.error(
    "Usage: node scripts/capture-portfolio-preview.mjs <slug> <url>"
  );
  process.exit(1);
}

const outDir = path.join(__dirname, "../public/portfolio");
const tmpDir = path.join(outDir, ".capture-tmp");
const webmPath = path.join(tmpDir, `${slug}.webm`);
const mp4Path = path.join(outDir, `${slug}.mp4`);
const posterPath = path.join(outDir, `${slug}.jpg`);

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

const SCROLL_MS = 9_000;
const SCROLL_STEPS = 48;
const SCROLL_FRACTION = 0.72;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1200, height: 900 },
  recordVideo: { dir: tmpDir, size: { width: 1200, height: 900 } },
});
const page = await context.newPage();

await page.goto(url, { waitUntil: "load", timeout: 60_000 });
await page.waitForTimeout(2_500);

const scrollMax = await page.evaluate((fraction) => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return Math.max(0, Math.floor(max * fraction));
}, SCROLL_FRACTION);

for (let i = 0; i <= SCROLL_STEPS; i++) {
  const y = Math.round((scrollMax * i) / SCROLL_STEPS);
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(Math.round(SCROLL_MS / SCROLL_STEPS));
}

await page.waitForTimeout(600);

const video = page.video();
if (!video) {
  console.error("No video recorded");
  process.exit(1);
}

await page.close();
await context.close();

const recordedPath = await video.path();
if (!recordedPath) {
  console.error("Video path not available after context close");
  process.exit(1);
}
fs.copyFileSync(recordedPath, webmPath);
await browser.close();
console.log(`Saved raw ${webmPath}`);

const ffmpeg = "ffmpeg";
execSync(
  [
    ffmpeg,
    "-y",
    "-i",
    JSON.stringify(webmPath),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-crf",
    "23",
    "-an",
    JSON.stringify(mp4Path),
  ].join(" "),
  { stdio: "inherit" }
);

if (!skipPoster) {
  execSync(
    [
      ffmpeg,
      "-y",
      "-i",
      JSON.stringify(mp4Path),
      "-ss",
      "00:00:00.5",
      "-vframes",
      "1",
      "-update",
      "1",
      "-q:v",
      "2",
      JSON.stringify(posterPath),
    ].join(" "),
    { stdio: "inherit" }
  );
  console.log(`Wrote poster ${posterPath}`);
}

try {
  fs.unlinkSync(webmPath);
} catch {
  /* ignore */
}

console.log(`Wrote ${mp4Path}`);
console.log(`Add previewVideo: "/portfolio/${slug}.mp4" to data/portfolio.ts`);
