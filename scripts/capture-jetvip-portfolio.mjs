import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "../public/portfolio/jetvip-charter.jpg");
const url = "https://jetvipcharter-dev.pages.dev/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

await page.goto(url, { waitUntil: "load", timeout: 60_000 });
await page.waitForSelector("video", { timeout: 30_000 });

await page.evaluate(async () => {
  const video = document.querySelector("video");
  if (!video) throw new Error("Hero video not found");
  video.muted = true;
  try {
    await video.play();
  } catch {
    /* autoplay may be blocked until muted */
  }
  await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("Video frame timeout")),
      25_000
    );
    const finish = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    const seek = () => {
      const t = Number.isFinite(video.duration)
        ? Math.min(2, video.duration * 0.2)
        : 1.5;
      video.currentTime = t;
    };
    video.addEventListener("seeked", finish, { once: true });
    if (video.readyState >= 2) seek();
    else video.addEventListener("loadeddata", seek, { once: true });
  });
});

await page.waitForTimeout(1200);
await page.screenshot({ path: out, type: "jpeg", quality: 88, fullPage: true });
await browser.close();
console.log(`Wrote ${out}`);
