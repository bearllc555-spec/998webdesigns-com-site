/**
 * Regenerate PNG + ICO favicons from public/icon.svg (blue #2563eb dot).
 *
 *   node scripts/generate-site-favicon.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "public/icon.svg");
const svg = fs.readFileSync(svgPath, "utf8");

async function renderPng(size) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!DOCTYPE html><html><body style="margin:0;background:transparent">${svg.replace(
      'viewBox="0 0 32 32"',
      `width="${size}" height="${size}" viewBox="0 0 32 32"`
    )}</body></html>`,
    { waitUntil: "load" }
  );
  const png = await page.screenshot({ omitBackground: true, type: "png" });
  await browser.close();
  return png;
}

const icon32 = await renderPng(32);
const apple180 = await renderPng(180);

fs.writeFileSync(path.join(root, "public/icon-light-32x32.png"), icon32);
fs.writeFileSync(path.join(root, "public/icon-dark-32x32.png"), icon32);
fs.writeFileSync(path.join(root, "public/apple-icon.png"), apple180);

const tmpIco = path.join(root, "public/.favicon-32.tmp.png");
fs.writeFileSync(tmpIco, icon32);

const ico = spawnSync(
  "npx",
  ["--yes", "png-to-ico", tmpIco, path.join(root, "public/favicon.ico")],
  { cwd: root, stdio: "inherit", shell: true }
);
fs.rmSync(tmpIco, { force: true });

if ((ico.status ?? 1) !== 0) {
  console.error("png-to-ico failed — layout still uses icon.svg");
  process.exit(1);
}

console.log("Updated public/icon.svg PNG fallbacks + favicon.ico + apple-icon.png");
