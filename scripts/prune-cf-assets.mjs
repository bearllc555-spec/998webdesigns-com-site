/**
 * Remove local-only paths from OpenNext asset output before wrangler deploy.
 * CF Workers assets max 25 MiB per file; portfolio capture temps can exceed that.
 */
import fs from "node:fs";
import path from "node:path";

const assetsRoot = path.join(process.cwd(), ".open-next", "assets");
const pruneDirs = ["portfolio/.capture-tmp"];

function rmDirSafe(dir) {
  if (!fs.existsSync(dir)) return false;
  fs.rmSync(dir, { recursive: true, force: true });
  return true;
}

if (!fs.existsSync(assetsRoot)) {
  console.log("prune-cf-assets: no .open-next/assets yet, skip");
  process.exit(0);
}

let removed = 0;
for (const rel of pruneDirs) {
  const target = path.join(assetsRoot, rel);
  if (rmDirSafe(target)) {
    removed += 1;
    console.log(`prune-cf-assets: removed ${rel}`);
  }
}

// Also prune source temp so the next cf:build does not copy it again.
for (const rel of pruneDirs) {
  const source = path.join(process.cwd(), "public", rel);
  if (rmDirSafe(source)) {
    console.log(`prune-cf-assets: removed public/${rel}`);
  }
}

if (!removed) {
  console.log("prune-cf-assets: nothing to prune");
}
