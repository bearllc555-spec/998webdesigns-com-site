#!/usr/bin/env node
/**
 * Push production-shaped secrets to the Cloudflare Worker (OpenNext preview / pre-cutover).
 * Sources: .env.local + slatepress/.local overrides (live Stripe, CRM, Supabase, etc.).
 *
 * Usage: node scripts/sync-cf-worker-secrets.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const dryRun = process.argv.includes("--dry-run");
const repoRoot = process.cwd();
const localDir = path.resolve(repoRoot, "..", "..", ".local");

const SKIP_KEYS = new Set([
  "NEXT_PUBLIC_BOOK_CALL_URL",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_OIDC_TOKEN",
  "VERCEL_TARGET_ENV",
  "NX_DAEMON",
  "TURBO_CACHE",
  "TURBO_DOWNLOAD_LOCAL_ENABLED",
  "TURBO_REMOTE_ONLY",
  "TURBO_RUN_SUMMARY",
]);

const FILE_OVERRIDES = {
  STRIPE_SECRET_KEY: "stripe-live-secret-key.txt",
  STRIPE_WEBHOOK_SECRET: "stripe-live-webhook-secret.txt",
  STRIPE_EXPECTED_MODE: null,
  RESEND_API_KEY: "resend-api-key.txt",
  BALANCE_CAPTURE_SECRET: "998-balance-capture-secret.txt",
  CRM_ADMIN_SECRET: "998-crm-admin-secret.txt",
  CRON_SECRET: "998-cron-secret.txt",
  CALENDLY_WEBHOOK_SIGNING_KEY: "calendly-webhook-signing-key.txt",
  NEXT_PUBLIC_SUPABASE_URL: "supabase-project-url.txt",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "supabase-publishable-key.txt",
  SUPABASE_SERVICE_ROLE_KEY: "supabase-secret-key.txt",
};

function readTrim(filePath) {
  if (!fs.existsSync(filePath)) return null;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    return trimmed;
  }
  return null;
}

function parseEnvFile(filePath) {
  const out = new Map();
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) out.set(key, value);
  }
  return out;
}

function readTelegramToken() {
  const file = path.join(localDir, "998-telegram.txt");
  if (!fs.existsSync(file)) return null;
  const match = fs.readFileSync(file, "utf8").match(/^TELEGRAM_BOT_TOKEN=(.+)$/m);
  return match?.[1]?.trim() || null;
}

const secrets = parseEnvFile(path.join(repoRoot, ".env.local"));

for (const [key, fileName] of Object.entries(FILE_OVERRIDES)) {
  if (fileName === null) {
    secrets.set(key, "live");
    continue;
  }
  const value = readTrim(path.join(localDir, fileName));
  if (value) secrets.set(key, value);
}

const telegram = readTelegramToken();
if (telegram) secrets.set("TELEGRAM_BOT_TOKEN", telegram);

for (const key of [...secrets.keys()]) {
  if (SKIP_KEYS.has(key)) secrets.delete(key);
}

secrets.delete("NEXT_PUBLIC_BOOK_CALL_URL");

if (secrets.size === 0) {
  console.error("No secrets to upload — check .env.local and .local/ overrides.");
  process.exit(1);
}

const lines = [...secrets.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => `${key}=${value.replace(/\n/g, "")}`);

const tmpPath = path.join(repoRoot, ".env.cf-worker-secrets.tmp");
fs.writeFileSync(tmpPath, `${lines.join("\n")}\n`, "utf8");

console.log(`Prepared ${lines.length} secrets for Worker 998webdesigns-com-site`);
console.log(lines.map((l) => l.split("=")[0]).join(", "));

if (dryRun) {
  console.log(`Dry run — wrote ${tmpPath} (not uploaded).`);
  process.exit(0);
}

const result = spawnSync("npx", ["wrangler", "secret", "bulk", tmpPath], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: true,
});

fs.rmSync(tmpPath, { force: true });
process.exit(result.status ?? 1);
