#!/usr/bin/env node
/**
 * Create (or recreate) Calendly webhook subscription and push signing key to CF Worker.
 *
 * Prerequisites:
 *   .local/calendly-pat.txt — Personal access token with webhooks:read + webhooks:write
 *     (Calendly → Integrations → API & Webhooks → Get a token now)
 *
 * Usage:
 *   node scripts/setup-calendly-webhook.mjs [--dry-run] [--recreate]
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const dryRun = process.argv.includes("--dry-run");
const recreate = process.argv.includes("--recreate");
const repoRoot = process.cwd();
const localDir = path.resolve(repoRoot, "..", "..", ".local");
const patPath = path.join(localDir, "calendly-pat.txt");
const signingKeyPath = path.join(localDir, "calendly-webhook-signing-key.txt");
const orgUriPath = path.join(localDir, "calendly-organization-uri.txt");
const webhookUrl = "https://998webdesigns.com/api/calendly/webhook";
const events = ["invitee.created", "invitee.canceled"];

function readTrim(filePath) {
  if (!fs.existsSync(filePath)) return null;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    return trimmed;
  }
  return null;
}

async function calendlyFetch(token, pathname, init = {}) {
  const res = await fetch(`https://api.calendly.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await res.text();
  let json = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(
      `Calendly ${init.method || "GET"} ${pathname} → ${res.status}: ${body.slice(0, 400)}`
    );
  }
  return json;
}

const pat = readTrim(patPath);
if (!pat) {
  console.error(`Missing PAT: ${patPath}`);
  console.error("Create one at https://calendly.com/integrations/api_webhooks (webhooks scopes).");
  process.exit(1);
}

function userUriFromPat(token) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    );
    const uuid = payload.user_uuid?.trim();
    return uuid ? `https://api.calendly.com/users/${uuid}` : null;
  } catch {
    return null;
  }
}

async function resolveScopeTarget(token) {
  const orgFromFile = readTrim(orgUriPath);
  if (orgFromFile) {
    console.log(`Organization (from ${orgUriPath}): ${orgFromFile}`);
    return { scope: "organization", uri: orgFromFile };
  }

  try {
    const me = await calendlyFetch(token, "/users/me");
    const orgUri = me?.resource?.current_organization;
    if (orgUri) return { scope: "organization", uri: orgUri };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("Insufficient scope") && !message.includes("403")) throw err;
  }

  const userUri = userUriFromPat(token);
  if (!userUri) {
    throw new Error(
      "Could not resolve organization — save URI to .local/calendly-organization-uri.txt or use a PAT with users:read."
    );
  }
  console.log(`Using user-scoped webhook (${userUri}) — no org file and PAT lacks users:read.`);
  return { scope: "user", uri: userUri };
}

const scopeTarget = await resolveScopeTarget(pat);
console.log(`Webhook scope: ${scopeTarget.scope} → ${scopeTarget.uri}`);

const listParams = new URLSearchParams({
  scope: scopeTarget.scope,
  count: "100",
});
listParams.set(scopeTarget.scope, scopeTarget.uri);

let existing = [];
try {
  const listed = await calendlyFetch(
    pat,
    `/webhook_subscriptions?${listParams.toString()}`
  );
  existing = (listed?.collection || []).filter(
    (sub) => sub.callback_url === webhookUrl
  );
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (!message.includes("400") && !message.includes("403")) throw err;
  console.warn("Could not list existing webhooks — will attempt create.");
}

if (existing.length > 0 && !recreate) {
  console.log(`Webhook already exists (${existing.length}) for ${webhookUrl}`);
  console.log("Signing key is only returned at creation time.");
  console.log("Re-run with --recreate to delete and recreate (brief delivery gap).");
  const saved = readTrim(signingKeyPath);
  if (saved) {
    console.log(`Using saved signing key from ${signingKeyPath}`);
  } else {
    process.exit(1);
  }
}

if (existing.length > 0 && recreate) {
  for (const sub of existing) {
    console.log(`Deleting ${sub.uri}`);
    if (!dryRun) {
      await calendlyFetch(pat, sub.uri.replace("https://api.calendly.com", ""), {
        method: "DELETE",
      });
    }
  }
}

let signingKey = readTrim(signingKeyPath);

if (!signingKey || recreate) {
  signingKey = randomBytes(32).toString("base64url");
  console.log(`Creating webhook → ${webhookUrl}`);
  const created = dryRun
    ? { resource: { signing_key: signingKey } }
    : await calendlyFetch(pat, "/webhook_subscriptions", {
        method: "POST",
        body: JSON.stringify({
          url: webhookUrl,
          events,
          [scopeTarget.scope]: scopeTarget.uri,
          scope: scopeTarget.scope,
          signing_key: signingKey,
        }),
      });

  const returnedKey = created?.resource?.signing_key?.trim();
  if (returnedKey) signingKey = returnedKey;

  if (!signingKey) {
    console.error("No signing key generated for webhook subscription");
    process.exit(1);
  }

  if (!dryRun) {
    fs.writeFileSync(signingKeyPath, `${signingKey}\n`, "utf8");
    console.log(`Saved signing key → ${signingKeyPath}`);
  }
}

if (dryRun) {
  console.log("Dry run — not uploading to Worker.");
  process.exit(0);
}

const tmpPath = path.join(repoRoot, ".env.calendly-signing.tmp");
fs.writeFileSync(tmpPath, `CALENDLY_WEBHOOK_SIGNING_KEY=${signingKey}\n`, "utf8");

const result = spawnSync("npx", ["wrangler", "secret", "bulk", tmpPath], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: true,
});

fs.rmSync(tmpPath, { force: true });
if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);

console.log("CALENDLY_WEBHOOK_SIGNING_KEY uploaded to Worker 998webdesigns-com-site");
