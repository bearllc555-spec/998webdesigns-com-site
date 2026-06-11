/**
 * Register AgentMail webhook for 998webdesigns-autoresponder Worker.
 *
 * Reads:
 *   slatepress/.local/998-agentmail-api-key.txt
 *   slatepress/.local/998-agentmail-webhook-secret.txt
 *
 * Optional env override: WORKER_URL (defaults to live workers.dev URL)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceLocal = path.resolve(__dirname, "..", "..", "..", ".local");
const INBOX_ID = "998webdesigns@agentmail.to";
const DEFAULT_WORKER_URL =
  "https://998webdesigns-autoresponder.bearllc555.workers.dev";

function readLocal(name) {
  const p = path.join(workspaceLocal, name);
  if (!fs.existsSync(p)) return null;
  const line = fs
    .readFileSync(p, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));
  return line || null;
}

const apiKey =
  process.env.AGENTMAIL_API_KEY?.trim() ||
  readLocal("998-agentmail-api-key-998webdesigns.txt") ||
  readLocal("998-agentmail-api-key.txt");
const webhookSecret =
  process.env.WEBHOOK_SECRET?.trim() || readLocal("998-agentmail-webhook-secret.txt");
const workerUrl = process.env.WORKER_URL?.trim() || DEFAULT_WORKER_URL;

if (!apiKey) {
  console.error("Missing AgentMail API key — save to .local/998-agentmail-api-key.txt");
  process.exit(1);
}
if (!webhookSecret) {
  console.error("Missing webhook secret — save to .local/998-agentmail-webhook-secret.txt");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
};

// List existing webhooks and reuse if URL matches
const listRes = await fetch("https://api.agentmail.to/v0/webhooks", { headers });
if (!listRes.ok) {
  console.error("List webhooks failed:", listRes.status, await listRes.text());
  process.exit(1);
}
const listBody = await listRes.json();
const normalizeUrl = (url) => String(url || "").replace(/\/$/, "");
const existing = (listBody.webhooks || []).find(
  (w) => normalizeUrl(w.url) === normalizeUrl(workerUrl)
);

let webhookId = existing?.webhook_id || existing?.id;

if (!webhookId) {
  const createRes = await fetch("https://api.agentmail.to/v0/webhooks", {
    method: "POST",
    headers,
    body: JSON.stringify({
      url: workerUrl,
      event_types: ["message.received"],
      headers: { "x-webhook-secret": webhookSecret },
    }),
  });
  const createBody = await createRes.json().catch(() => ({}));
  if (!createRes.ok) {
    console.error("Create webhook failed:", createRes.status, createBody);
    process.exit(1);
  }
  webhookId = createBody.webhook_id || createBody.id;
  console.log("Created webhook:", webhookId);
} else {
  console.log("Reusing webhook:", webhookId);
}

const patchRes = await fetch(`https://api.agentmail.to/v0/webhooks/${webhookId}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ add_inbox_ids: [INBOX_ID] }),
});
const patchBody = await patchRes.json().catch(() => ({}));
if (!patchRes.ok) {
  console.error("Subscribe inbox failed:", patchRes.status, patchBody);
  process.exit(1);
}

console.log("OK — webhook subscribed to", INBOX_ID);
console.log("Worker URL:", workerUrl);
