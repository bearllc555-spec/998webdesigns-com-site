/**
 * One-shot: verify 998webdesigns inbox key, upload Wrangler secret, register webhook, redeploy.
 * Key file: slatepress/.local/998-agentmail-api-key-998webdesigns.txt (preferred)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const INBOX_ID = "998webdesigns@agentmail.to";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workspaceLocal = path.resolve(repoRoot, "..", "..", ".local");
const workerDir = path.join(repoRoot, "worker");

function readKey() {
  for (const name of ["998-agentmail-api-key-998webdesigns.txt", "998-agentmail-api-key.txt"]) {
    const p = path.join(workspaceLocal, name);
    if (!fs.existsSync(p)) continue;
    const line = fs
      .readFileSync(p, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#") && l.startsWith("am_"));
    if (line) return line;
  }
  return process.env.AGENTMAIL_API_KEY?.trim() || null;
}

const apiKey = readKey();
if (!apiKey) {
  console.error("Save the 998webdesigns AgentMail API key to:");
  console.error("  " + path.join(workspaceLocal, "998-agentmail-api-key-998webdesigns.txt"));
  process.exit(1);
}

const inboxes = await fetch("https://api.agentmail.to/v0/inboxes", {
  headers: { Authorization: `Bearer ${apiKey}` },
}).then((r) => r.json());

const hasInbox = (inboxes.inboxes || []).some(
  (i) => i.inbox_id === INBOX_ID || i.email === INBOX_ID
);
if (!hasInbox) {
  console.error("This API key does not own", INBOX_ID);
  console.error("Inboxes:", (inboxes.inboxes || []).map((i) => i.inbox_id).join(", ") || "(none)");
  process.exit(1);
}

console.log("Verified key for", INBOX_ID);

execSync("npx wrangler secret put AGENTMAIL_API_KEY", {
  cwd: workerDir,
  input: apiKey,
  stdio: ["pipe", "inherit", "inherit"],
});

execSync("npx wrangler deploy", { cwd: workerDir, stdio: "inherit" });
execSync("node scripts/register-agentmail-autoresponder-webhook.mjs", {
  cwd: repoRoot,
  stdio: "inherit",
  env: { ...process.env, AGENTMAIL_API_KEY: apiKey },
});

console.log("OK — Worker wired to", INBOX_ID);
