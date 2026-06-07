/**
 * After pushing a new blog post, notify CRM + Telegram.
 *
 * Usage:
 *   npm run blog:notify -- google-business-profile-checklist
 *   npm run blog:notify -- --all          (every slug in content/blog/*.md)
 *   npm run blog:notify -- slug --force   (re-send even if already logged)
 *   npm run blog:notify -- slug --local     (http://localhost:3000)
 *
 * Requires BALANCE_CAPTURE_SECRET in .env.local or slatepress/.local/998-balance-capture-secret.txt
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workspaceLocal = path.resolve(repoRoot, "..", "..", ".local");
const blogDir = path.join(repoRoot, "content", "blog");

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

function listSlugs() {
  return fs
    .readdirSync(blogDir)
    .filter((name) => name.endsWith(".md") && name !== "README.md" && name !== "backlog.md")
    .map((name) => name.replace(/\.md$/, ""));
}

async function notifySlug(baseUrl, secret, slug, forceNotify) {
  const res = await fetch(`${baseUrl}/api/admin/blog-notify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ slug, forceNotify }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return data;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const local = args.includes("--local");
  const force = args.includes("--force");
  const all = args.includes("--all");
  const slugs = args.filter((a) => !a.startsWith("--"));

  const secret = readSecret();
  if (!secret) {
    console.error("Missing BALANCE_CAPTURE_SECRET (.env.local or .local/998-balance-capture-secret.txt)");
    process.exit(1);
  }

  const baseUrl = local ? "http://localhost:3000" : "https://998webdesigns.com";
  const targets = all ? listSlugs() : slugs;

  if (!targets.length) {
    console.error("Usage: npm run blog:notify -- <slug> | --all [--force] [--local]");
    process.exit(1);
  }

  for (const slug of targets) {
    try {
      const result = await notifySlug(baseUrl, secret, slug, force);
      if (result.skipped) {
        console.log(`skip ${slug} (already in CRM — use --force to re-notify)`);
      } else if (result.notified) {
        console.log(`ok   ${slug} -> ${result.url} (CRM + Telegram)`);
      } else {
        console.log(`ok   ${slug}`, result);
      }
    } catch (err) {
      console.error(`fail ${slug}:`, err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  }
}

main();
