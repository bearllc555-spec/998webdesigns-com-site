/**
 * One-shot blog dashboard setup: run after deploy.
 *   1. migrate-blog-authoring  (add authoring columns to blog_posts)
 *   2. migrate-blog-media-bucket (create public blog-media storage bucket)
 *   3. backfill-blog            (import content/blog/*.md into the DB)
 *
 * Usage:
 *   npm run blog:setup            (https://998webdesigns.com)
 *   npm run blog:setup -- --local (http://localhost:3000)
 *
 * Requires BALANCE_CAPTURE_SECRET in .env.local or slatepress/.local/998-balance-capture-secret.txt
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

async function step(baseUrl, secret, route) {
  const res = await fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const local = args.includes("--local");
  const baseUrl = local ? "http://localhost:3000" : "https://998webdesigns.com";

  const secret = readSecret();
  if (!secret) {
    console.error("Missing BALANCE_CAPTURE_SECRET (.env.local or .local/998-balance-capture-secret.txt)");
    process.exit(1);
  }

  const steps = [
    ["/api/admin/migrate-blog-authoring", "authoring columns"],
    ["/api/admin/migrate-blog-media-bucket", "blog-media bucket"],
    ["/api/admin/backfill-blog", "backfill markdown posts"],
  ];

  for (const [route, label] of steps) {
    try {
      const result = await step(baseUrl, secret, route);
      console.log(`ok   ${label}:`, JSON.stringify(result));
    } catch (err) {
      console.error(`fail ${label}:`, err instanceof Error ? err.message : err);
      process.exitCode = 1;
      return;
    }
  }
}

main();
