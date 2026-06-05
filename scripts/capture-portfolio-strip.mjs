/**
 * Capture a vertical frame strip for portfolio hover preview (no MP4).
 *
 *   node scripts/capture-portfolio-strip.mjs <slug> <url>
 *
 * Hero hold: full viewport screenshots while hero video plays and page
 * animations run (nav, headline, etc.). Falls back to ffmpeg-on-MP4 if that fails.
 * Scroll phase: stepped viewport screenshots while scrolling.
 *
 * Outputs:
 *   public/portfolio/<slug>-strip.jpg   (JPEG — tall stacks exceed WebP 16k px limit)
 *   public/portfolio/<slug>-strip.json  { frames, width, frameHeight }
 *   public/portfolio/<slug>.jpg           poster (hero peak ~2.5s) unless --skip-poster
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
const HERO_CLIP_S = 5;
const HERO_FRAME_COUNT = 12;
const HERO_WARMUP_MS = 600;
const POSTER_OFFSET_S = 2.5;
const SCROLL_FRAME_COUNT = 24;
const SCROLL_MS = 7_500;

const SCALE_CROP = `scale=${VIEWPORT.width}:${VIEWPORT.height}:force_original_aspect_ratio=increase,crop=${VIEWPORT.width}:${VIEWPORT.height}`;

const POSTER_FRAME_INDEX = Math.round(
  (POSTER_OFFSET_S / HERO_CLIP_S) * (HERO_FRAME_COUNT - 1)
);
const HERO_INTERVAL_MS = Math.round(
  (HERO_CLIP_S * 1000) / (HERO_FRAME_COUNT - 1)
);

fs.mkdirSync(tmpDir, { recursive: true });

function runFfmpeg(args) {
  execSync(["ffmpeg", "-y", ...args].join(" "), { stdio: "inherit" });
}

async function downloadHeroVideo(heroSrc) {
  const localPath = path.join(tmpDir, "hero-source.mp4");
  console.log(`Downloading hero video to ${localPath}`);
  const res = await fetch(heroSrc);
  if (!res.ok) {
    throw new Error(`Hero download failed: ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(localPath, buf);
  console.log(`Downloaded ${(buf.length / 1_048_576).toFixed(2)} MB`);
  return localPath;
}

async function detectHeroVideoSrc(page) {
  return page.evaluate(() => {
    const videos = [...document.querySelectorAll("video")].filter((v) => {
      const r = v.getBoundingClientRect();
      return r.width > 200 && r.height > 200 && r.top < window.innerHeight * 0.85;
    });
    if (!videos.length) return null;
    const v = videos[0];
    const src =
      v.currentSrc || v.querySelector("source")?.src || v.getAttribute("src");
    return src || null;
  });
}

async function startHeroVideo(page) {
  await page.evaluate(() => {
    const videos = [...document.querySelectorAll("video")].filter((v) => {
      const r = v.getBoundingClientRect();
      return r.width > 200 && r.height > 200 && r.top < window.innerHeight * 0.85;
    });
    if (!videos.length) return;
    const v = videos[0];
    v.muted = true;
    v.loop = true;
    v.currentTime = 0;
    void v.play();
  });
}

/**
 * Full viewport hero hold — video motion + on-page text/CSS animations.
 * @returns {{ framePaths: string[], posterTmp: string | null }}
 */
async function captureHeroViewportFrames(page) {
  const framePaths = [];
  let posterTmp = null;

  console.log(
    `Hero viewport — ${HERO_FRAME_COUNT} frames (${HERO_CLIP_S}s, text + video)`
  );

  await startHeroVideo(page);
  await page.waitForTimeout(HERO_WARMUP_MS);

  for (let i = 0; i < HERO_FRAME_COUNT; i++) {
    const fp = path.join(tmpDir, `hero-${String(i).padStart(3, "0")}.png`);
    await page.screenshot({ path: fp, type: "png", timeout: 60_000 });
    framePaths.push(fp);
    console.log(`  hero frame ${i + 1}/${HERO_FRAME_COUNT}`);

    if (i === POSTER_FRAME_INDEX) {
      posterTmp = path.join(tmpDir, "poster.png");
      fs.copyFileSync(fp, posterTmp);
    }

    if (i < HERO_FRAME_COUNT - 1) {
      await page.waitForTimeout(HERO_INTERVAL_MS);
    }
  }

  return { framePaths, posterTmp };
}

function extractHeroFrame(heroSrc, timestampS, outputPath) {
  runFfmpeg([
    "-ss",
    String(timestampS),
    "-i",
    JSON.stringify(heroSrc),
    "-vf",
    JSON.stringify(SCALE_CROP),
    "-vframes",
    "1",
    JSON.stringify(outputPath),
  ]);
}

/** ffmpeg fallback — video crop only, no page chrome. */
function extractHeroFramesFromFile(heroSrc) {
  const framePaths = [];
  console.log(
    `Hero ffmpeg fallback — ${HERO_FRAME_COUNT} frames (${HERO_CLIP_S}s clip)`
  );

  for (let i = 0; i < HERO_FRAME_COUNT; i++) {
    const t =
      i === HERO_FRAME_COUNT - 1
        ? Math.max(0, HERO_CLIP_S - 0.05)
        : (i / (HERO_FRAME_COUNT - 1)) * HERO_CLIP_S;
    const fp = path.join(tmpDir, `hero-${String(i).padStart(3, "0")}.png`);
    extractHeroFrame(heroSrc, t, fp);
    framePaths.push(fp);
  }

  const posterTmp = path.join(tmpDir, "poster.png");
  extractHeroFrame(heroSrc, POSTER_OFFSET_S, posterTmp);
  return { framePaths, posterTmp };
}

async function captureScrollFrames(page) {
  const framePaths = [];

  const scrollMax = await page.evaluate((fraction) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.floor(max * fraction));
  }, SCROLL_FRACTION);

  console.log(`Scroll capture — ${SCROLL_FRAME_COUNT} frames (max ${scrollMax}px)`);
  for (let i = 1; i <= SCROLL_FRAME_COUNT; i++) {
    const y = Math.round((scrollMax * i) / SCROLL_FRAME_COUNT);
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(Math.round(SCROLL_MS / SCROLL_FRAME_COUNT));
    const fp = path.join(tmpDir, `scroll-${String(i).padStart(3, "0")}.png`);
    await page.screenshot({ path: fp, type: "png", timeout: 60_000 });
    framePaths.push(fp);
  }

  return framePaths;
}

function stackFrames(framePaths, posterSourcePath) {
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
      JSON.stringify(posterSourcePath),
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

// --- main ---
const browser = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: VIEWPORT });

console.log(`Loading ${url}`);
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
await page.waitForTimeout(1_500);
await page.evaluate(() => window.scrollTo(0, 0));

const heroSrc = await detectHeroVideoSrc(page);

let heroFramePaths = [];
let posterSourcePath = null;

if (heroSrc) {
  try {
    ({ framePaths: heroFramePaths, posterTmp: posterSourcePath } =
      await captureHeroViewportFrames(page));
  } catch (err) {
    console.warn("Hero viewport capture failed, trying ffmpeg fallback:", err);
    heroFramePaths = [];
    posterSourcePath = null;
  }

  if (!heroFramePaths.length) {
    try {
      const localHero = await downloadHeroVideo(heroSrc);
      ({ framePaths: heroFramePaths, posterTmp: posterSourcePath } =
        extractHeroFramesFromFile(localHero));
    } catch (err) {
      console.warn("Hero ffmpeg fallback failed:", err);
    }
  }
}

const scrollFramePaths = await captureScrollFrames(page);
await browser.close();

const allFrames = [...heroFramePaths, ...scrollFramePaths];

if (!posterSourcePath) {
  posterSourcePath = allFrames[0];
}

stackFrames(allFrames, posterSourcePath);

for (const fp of allFrames) {
  try {
    fs.unlinkSync(fp);
  } catch {
    /* ignore */
  }
}
try {
  fs.unlinkSync(path.join(tmpDir, "poster.png"));
} catch {
  /* ignore */
}
