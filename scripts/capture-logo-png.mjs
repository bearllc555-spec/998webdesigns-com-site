/**
 * Renders the 998 webdesigns wordmark and saves a transparent PNG.
 *
 *   node scripts/capture-logo-png.mjs
 *
 * Output: public/temp/998webdesigns-logo.png
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "../public/temp/998webdesigns-logo.png");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@700;800&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: transparent; }
    #logo {
      display: inline-flex;
      align-items: baseline;
      font-family: "Geist", system-ui, sans-serif;
      font-weight: 700;
      font-size: 96px;
      line-height: 1;
      letter-spacing: -0.035em;
      white-space: nowrap;
      padding: 8px;
    }
    .logo-998 {
      color: #2563eb;
      font-weight: 800;
    }
    .logo-rest {
      color: #0a0a0a;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div id="logo" aria-label="998 webdesigns">
    <span class="logo-998">998</span><span class="logo-rest">webdesigns</span>
  </div>
</body>
</html>`;

const tmpHtml = path.join(__dirname, "../.tmp-logo-capture.html");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(tmpHtml, html);

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.goto(`file://${tmpHtml.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.locator("#logo").screenshot({ path: outPath, omitBackground: true });
await browser.close();
fs.unlinkSync(tmpHtml);

const size = fs.statSync(outPath).size;
console.log(`Wrote ${outPath} (${size} bytes)`);
