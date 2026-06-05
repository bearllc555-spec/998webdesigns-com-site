/**
 * Capture a vertical frame strip for portfolio hover preview (no MP4).
 *
 *   node scripts/capture-portfolio-strip.mjs <slug> <url>
 *
 * Outputs:
 *   public/portfolio/<slug>-strip.jpg   (JPEG — tall stacks exceed WebP 16k px limit)
 *   public/portfolio/<slug>-strip.json  { frames, width, frameHeight }
 *   public/portfolio/<slug>.jpg           poster (frame 0) unless --skip-poster
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
  console.error("Usage: node scripts/capture-portfolio-strip.mjs <slug> <url>");
  process.exit(1);
}

const outDir = path.join(__dirname, "../public/portfolio");
const tmpDir = path.join(outDir, ".capture-tmp", slug);
const stripPath = path.join(outDir, `${slug}-strip.jpg`);
const metaPath = path.join(outDir, `${slug}-strip.json`);
const posterPath = path.join(outDir, `${slug}.jpg`);

const VIEWPORT = { width: 960, height: 720 };
const SCROLL_FRACTION = 0.68;
const HERO_FRAME_COUNT = 12;
const HERO_FRAME_INTERVAL_MS = 350;
const SCROLL_FRAME_COUNT = 24;
const SCROLL_MS = 7_500;

fs.mkdirSync(tmpDir, { recursive: true });

function runFfmpeg(args) {
  execSync(["ffmpeg", "-y", ...args].join(" "), { stdio: "inherit" });
}

async function hasHeroVideo(page) {
  return page.evaluate(() => {
    const videos = [...document.querySelectorAll("video")].filter((v) => {
      const r = v.getBoundingClientRect();
      return r.width > 160 && r.height > 160 && r.top < window.innerHeight * 0.9;
    });
    return videos.length > 0;
  });
}

async function captureFrames(pageUrl) {
  const browser = await chromium.launch({
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage({ viewport: VIEWPORT });
  const framePaths = [];

  console.log(`Loading ${pageUrl}`);
  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(1_500);
  await page.evaluate(() => window.scrollTo(0, 0));

  const hero = await hasHeroVideo(page);
  if (hero) {
    console.log(`Hero video detected — ${HERO_FRAME_COUNT} hold frames`);
    for (let i = 0; i < HERO_FRAME_COUNT; i++) {
      const fp = path.join(tmpDir, `frame-${String(framePaths.length).padStart(3, "0")}.png`);
      await page.screenshot({ path: fp, type: "png" });
      framePaths.push(fp);
      await page.waitForTimeout(HERO_FRAME_INTERVAL_MS);
    }
  }

  const scrollMax = await page.evaluate((fraction) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.floor(max * fraction));
  }, SCROLL_FRACTION);

  console.log(`Scroll capture — ${SCROLL_FRAME_COUNT} frames (max ${scrollMax}px)`);
  for (let i = 1; i <= SCROLL_FRAME_COUNT; i++) {
    const y = Math.round((scrollMax * i) / SCROLL_FRAME_COUNT);
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(Math.round(SCROLL_MS / SCROLL_FRAME_COUNT));
    const fp = path.join(tmpDir, `frame-${String(framePaths.length).padStart(3, "0")}.png`);
    await page.screenshot({ path: fp, type: "png" });
    framePaths.push(fp);
  }

  await browser.close();
  return framePaths;
}

function stackFrames(framePaths) {
  const inputs = framePaths.flatMap((fp) => ["-i", JSON.stringify(fp)]);

  runFfmpeg([
    ...inputs,
    "-filter_complex",
    `vstack=inputs=${framePaths.length}`,
    "-frames:v",
    "1",
    "-f",
    "image2",
    "-vcodec",
    "mjpeg",
    "-update",
    "1",
    "-q:v",
    "3",
    JSON.stringify(stripPath),
  ]);

  if (!skipPoster) {
    runFfmpeg([
      "-i",
      JSON.stringify(framePaths[0]),
      "-q:v",
      "2",
      "-update",
      "1",
      JSON.stringify(posterPath),
    ]);
    console.log(`Wrote poster ${posterPath}`);
  }

  const meta = {
    frames: framePaths.length,
    width: VIEWPORT.width,
    frameHeight: VIEWPORT.height,
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
  console.log(`Wrote ${stripPath} (${meta.frames} frames)`);
  console.log(`Wrote ${metaPath}`);
}

const frames = await captureFrames(url);
stackFrames(frames);

for (const fp of frames) {
  try {
    fs.unlinkSync(fp);
  } catch {
    /* ignore */
  }
}
