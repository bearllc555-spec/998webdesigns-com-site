/**
 * OpenNext esbuild fails on pg -> pg-cloudflare when admin migrate routes are traced.
 * Externalize both for the Cloudflare worker bundle (migrate routes return 503 on CF).
 */
import fs from "node:fs";
import path from "node:path";

const target = path.join(
  process.cwd(),
  "node_modules/@opennextjs/cloudflare/dist/cli/build/bundle-server.js"
);

if (!fs.existsSync(target)) {
  console.warn("patch-opennext-bundle: @opennextjs/cloudflare not installed, skip");
  process.exit(0);
}

const needle = 'external: ["./middleware/handler.mjs"]';
const replacement =
  'external: ["./middleware/handler.mjs", "pg", "pg-cloudflare"]';

let src = fs.readFileSync(target, "utf8");
if (src.includes(replacement)) {
  console.log("patch-opennext-bundle: already patched");
  process.exit(0);
}

if (!src.includes(needle)) {
  console.error("patch-opennext-bundle: expected pattern not found in bundle-server.js");
  process.exit(1);
}

fs.writeFileSync(target, src.replace(needle, replacement));
console.log("patch-opennext-bundle: externalized pg + pg-cloudflare");
