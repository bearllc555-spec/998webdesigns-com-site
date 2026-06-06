/**
 * Full-page JPEG for portfolio carousel (hover = CSS pan top → bottom).
 *
 *   node scripts/capture-portfolio-poster.mjs <slug> <url>
 *
 * - fullPage screenshot (clip does not capture below the viewport)
 * - slow scroll preload for lazy-loaded sections/images
 * - hero <video> play + seek when present (JetVIP, etc.)
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
const SCROLL_STEPS = 28;
const SCROLL_MS = 9_000;

fs.mkdirSync(path.dirname(tmpPath), { recursive: true });

async function primeHeroVideo(page) {
  try {
    await page.waitForSelector("video", { timeout: 8_000 });
  } catch {
    return false;
  }

  const hasVideo = await page
    .evaluate(async () => {
      const videos = [...document.querySelectorAll("video")].filter((v) => {
        const r = v.getBoundingClientRect();
        return r.width > 200 && r.height > 200;
      });
      if (!videos.length) return false;
      const v = videos[0];
      v.muted = true;
      v.loop = true;
      void v.play();
      await new Promise((r) => setTimeout(r, 400));
      if (Number.isFinite(v.duration) && v.duration > 0) {
        v.currentTime = Math.min(2, v.duration * 0.2);
      } else {
        v.currentTime = 1.5;
      }
      await new Promise((r) => setTimeout(r, 1_200));
      return true;
    })
    .catch(() => false);

  if (hasVideo) {
    console.log("Hero video primed");
    await page.waitForTimeout(800);
  }
  return hasVideo;
}

async function preloadLazyContent(page) {
  await page.evaluate(() => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = "eager";
    });
  });

  const scrollMax = await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, max);
  });

  console.log(`Slow scroll preload (${SCROLL_STEPS} steps, max ${scrollMax}px)`);
  for (let i = 1; i <= SCROLL_STEPS; i++) {
    const y = Math.round((scrollMax * i) / SCROLL_STEPS);
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(Math.round(SCROLL_MS / SCROLL_STEPS));
  }

  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    await Promise.race([
      Promise.all(
        [...document.images].map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((r) => {
                  img.onload = img.onerror = r;
                })
        )
      ),
      wait(8_000),
    ]);
  });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}

const browser = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: VIEWPORT });

console.log(`Loading ${url}`);
try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
} catch (err) {
  console.warn("navigation timeout, continuing:", err.message?.slice(0, 80));
}
await page.waitForTimeout(2_500);
await page.evaluate(() => window.scrollTo(0, 0));

await preloadLazyContent(page);

await Promise.race([primeHeroVideo(page), page.waitForTimeout(25_000)]);

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
