/**
 * One-time: create blog_posts table on helmet.
 * Usage: node scripts/migrate-blog-posts.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workspaceLocal = path.resolve(repoRoot, "..", "..", ".local");

function readSecret() {
  const envPath = path.join(repoRoot, ".env.local");
  if (fs.existsSync(envPath)) {
    const match = fs.readFileSync(envPath, "utf8").match(/^BALANCE_CAPTURE_SECRET=(.+)$/m);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  const secretFile = path.join(workspaceLocal, "998-balance-capture-secret.txt");
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, "utf8").trim();
  }
  return null;
}

async function main() {
  const secret = readSecret();
  if (!secret) {
    console.error("Missing BALANCE_CAPTURE_SECRET");
    process.exit(1);
  }
  const res = await fetch("https://998webdesigns.com/api/admin/migrate-blog-posts", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(data.error ?? res.status);
    process.exit(1);
  }
  console.log(JSON.stringify(data));
}

main();
