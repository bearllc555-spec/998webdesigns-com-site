/**
 * Record a hover-preview clip for the portfolio carousel.
 *
 * Usage:
 *   node scripts/capture-portfolio-preview.mjs <slug> <url>
 *
 * When the page has a hero <video>, the first ~5s of the preview is cut from
 * that MP4 (real motion). The remainder is a viewport recording while scrolling.
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
const webmPath = path.join(tmpDir, `${slug}-scroll.webm`);
const heroSegmentPath = path.join(tmpDir, `${slug}-hero.mp4`);
const scrollMp4Path = path.join(tmpDir, `${slug}-scroll.mp4`);
const mp4Path = path.join(outDir, `${slug}.mp4`);
const posterPath = path.join(outDir, `${slug}.jpg`);

const HERO_CLIP_S = 5;
const SCROLL_MS = 8_500;
const SCROLL_STEPS = 40;
const SCROLL_FRACTION = 0.68;
const POSTER_OFFSET_S = 2.5;
const VIEWPORT = { width: 1200, height: 900 };

const SCALE_CROP =
  "scale=1200:900:force_original_aspect_ratio=increase,crop=1200:900";

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

function runFfmpeg(args) {
  execSync(["ffmpeg", "-y", ...args].join(" "), { stdio: "inherit" });
}

async function detectHeroVideoSrc(page) {
  return page.evaluate(() => {
    const videos = [...document.querySelectorAll("video")].filter((v) => {
      const r = v.getBoundingClientRect();
      return r.width > 200 && r.height > 200 && r.top < window.innerHeight * 0.85;
    });
    if (!videos.length) return null;
    const v = videos[0];
    const src = v.currentSrc || v.querySelector("source")?.src || v.getAttribute("src");
    return src || null;
  });
}

function buildHeroSegment(heroSrc) {
  console.log(`Hero clip from ${heroSrc}`);
  runFfmpeg([
    "-t",
    String(HERO_CLIP_S),
    "-i",
    JSON.stringify(heroSrc),
    "-vf",
    JSON.stringify(SCALE_CROP),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "25",
    "-an",
    JSON.stringify(heroSegmentPath),
  ]);
}

async function recordScrollSegment(pageUrl) {
  const browser = await chromium.launch({
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: tmpDir, size: VIEWPORT },
  });
  const page = await context.newPage();

  console.log(`Recording scroll ${pageUrl}`);
  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1_500);
  await page.evaluate(() => window.scrollTo(0, 0));

  const scrollMax = await page.evaluate((fraction) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.floor(max * fraction));
  }, SCROLL_FRACTION);

  for (let i = 1; i <= SCROLL_STEPS; i++) {
    const y = Math.round((scrollMax * i) / SCROLL_STEPS);
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(Math.round(SCROLL_MS / SCROLL_STEPS));
  }

  await page.waitForTimeout(400);

  const video = page.video();
  await page.close();
  await context.close();

  const recordedPath = await video?.path();
  await browser.close();

  if (!recordedPath) throw new Error("Scroll recording failed");
  fs.copyFileSync(recordedPath, webmPath);

  runFfmpeg([
    "-i",
    JSON.stringify(webmPath),
    "-vf",
    JSON.stringify(SCALE_CROP),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "25",
    "-an",
    JSON.stringify(scrollMp4Path),
  ]);
}

function mergeHeroAndScroll() {
  runFfmpeg([
    "-i",
    JSON.stringify(heroSegmentPath),
    "-i",
    JSON.stringify(scrollMp4Path),
    "-filter_complex",
    JSON.stringify("[0:v][1:v]concat=n=2:v=1:a=0,format=yuv420p"),
    "-movflags",
    "+faststart",
    "-c:v",
    "libx264",
    "-crf",
    "23",
    JSON.stringify(mp4Path),
  ]);
}

function buildScrollOnlyFinal() {
  runFfmpeg([
    "-i",
    JSON.stringify(webmPath),
    "-vf",
    JSON.stringify(SCALE_CROP),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-crf",
    "23",
    "-r",
    "25",
    "-an",
    JSON.stringify(mp4Path),
  ]);
}

function writePoster() {
  runFfmpeg([
    "-ss",
    String(POSTER_OFFSET_S),
    "-i",
    JSON.stringify(mp4Path),
    "-vframes",
    "1",
    "-update",
    "1",
    "-q:v",
    "2",
    JSON.stringify(posterPath),
  ]);
  console.log(`Wrote poster ${posterPath}`);
}

// --- main ---
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(1_000);
const heroSrc = await detectHeroVideoSrc(page);
await browser.close();

let usedHero = false;
if (heroSrc) {
  try {
    buildHeroSegment(heroSrc);
    await recordScrollSegment(url);
    mergeHeroAndScroll();
    usedHero = true;
  } catch (err) {
    console.warn("Hero+scroll merge failed, falling back to scroll only:", err);
  }
}

if (!usedHero) {
  await recordScrollSegment(url);
  buildScrollOnlyFinal();
}

if (!skipPoster) writePoster();

for (const f of [webmPath, heroSegmentPath, scrollMp4Path]) {
  try {
    fs.unlinkSync(f);
  } catch {
    /* ignore */
  }
}

console.log(`Wrote ${mp4Path}${usedHero ? " (hero video + scroll)" : ""}`);
