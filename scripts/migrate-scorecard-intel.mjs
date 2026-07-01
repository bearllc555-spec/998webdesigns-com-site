/**
 * Apply scorecard internal_intel migration on production (Report B).
 *
 * Usage:
 *   npm run scorecard:migrate-intel
 *   npm run scorecard:migrate-intel -- --local
 *
 * Reads BALANCE_CAPTURE_SECRET from .env.local or slatepress/.local/998-balance-capture-secret.txt
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
    if (match?.[1]?.trim()) return match[1].trim().replace(/^["']|["']$/g, "");
  }
  const secretFile = path.join(workspaceLocal, "998-balance-capture-secret.txt");
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, "utf8").trim();
  }
  return null;
}

async function main() {
  const local = process.argv.includes("--local");
  const baseUrl = local ? "http://localhost:3000" : "https://998webdesigns.com";
  const secret = readSecret();
  if (!secret) {
    console.error(
      "Missing BALANCE_CAPTURE_SECRET (.env.local or slatepress/.local/998-balance-capture-secret.txt)"
    );
    process.exit(1);
  }

  const res = await fetch(`${baseUrl}/api/admin/migrate-scorecard-intel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Failed:", data.error ?? res.status);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

main();
