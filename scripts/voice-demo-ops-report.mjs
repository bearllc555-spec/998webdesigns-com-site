/**
 * Pull Jarvis voice-demo ops_log timelines from helmet for debugging disconnects.
 *
 * Usage (from repo root, needs .env.local with Supabase service role):
 *   node --env-file=.env.local scripts/voice-demo-ops-report.mjs
 *   node --env-file=.env.local scripts/voice-demo-ops-report.mjs --plumbers
 *   node --env-file=.env.local scripts/voice-demo-ops-report.mjs --email bearllc555@gmail.com
 *   node --env-file=.env.local scripts/voice-demo-ops-report.mjs --id <lead-uuid>
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(repoRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const plumbersOnly = args.includes("--plumbers");
const emailIdx = args.indexOf("--email");
const idIdx = args.indexOf("--id");
const limitIdx = args.indexOf("--limit");
const email = emailIdx >= 0 ? args[emailIdx + 1] : null;
const leadId = idIdx >= 0 ? args[idIdx + 1] : null;
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 5 : 5;

const supa = createClient(url, key);

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York" });
  } catch {
    return iso;
  }
}

function formatMeta(meta) {
  if (!meta || typeof meta !== "object") return "";
  const parts = Object.entries(meta)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`);
  return parts.length ? ` (${parts.join(", ")})` : "";
}

function diagnose(events) {
  const findings = [];
  const goAway = events.filter((e) => /goAway/i.test(e.message)).length;
  const reconnect = events.filter((e) => /reconnect|WebSocket closed/i.test(e.message)).length;
  const exhausted = events.some((e) => /reconnect paused/i.test(e.message));
  if (goAway) findings.push(`goAway: ${goAway}`);
  if (reconnect) findings.push(`reconnect events: ${reconnect}`);
  if (exhausted) findings.push("circuit breaker: reconnect paused");
  return findings.length ? findings.join(" · ") : "no reconnect pattern";
}

let query = supa
  .from("voice_demo_leads")
  .select(
    "id, email, full_name, vertical, updated_at, ops_log, session_summary"
  )
  .order("updated_at", { ascending: false })
  .limit(limit);

if (leadId) query = query.eq("id", leadId);
else if (email) query = query.ilike("email", email.trim().toLowerCase());
else if (plumbersOnly) query = query.eq("vertical", "plumbers");

const { data, error } = await query;
if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

if (!data?.length) {
  console.log("No matching voice_demo_leads rows.");
  process.exit(0);
}

for (const row of data) {
  const events = Array.isArray(row.ops_log) ? row.ops_log : [];
  console.log("=".repeat(72));
  console.log(
    `${row.full_name || "(no name)"} · ${row.email} · ${row.vertical || "marketing"}`
  );
  console.log(`lead_id: ${row.id}`);
  console.log(`updated: ${formatTime(row.updated_at)}`);
  console.log(`diagnosis: ${diagnose(events)}`);
  if (row.session_summary) console.log(`summary: ${row.session_summary}`);
  console.log("-".repeat(72));
  if (!events.length) {
    console.log("(empty ops_log)\n");
    continue;
  }
  for (const e of events) {
    if (!e?.message) continue;
    console.log(
      `${formatTime(e.at)} [${e.severity || "info"}] ${e.kind}: ${e.message}${formatMeta(e.meta)}`
    );
  }
  console.log("");
}

console.log(`Reported ${data.length} session(s). Paste output into Cursor for analysis.`);
