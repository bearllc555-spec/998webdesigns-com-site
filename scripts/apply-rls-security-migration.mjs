/**
 * Apply public RLS security hardening to helmet (one-off / local ops).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const REF = "xwldbxburzqryxlzocck";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workspaceLocal = path.resolve(repoRoot, "..", "..", ".local");
const sqlPath = path.join(
  repoRoot,
  "supabase/migrations/20260612120000_public_rls_security_hardening.sql"
);

function readPasswordFile() {
  const candidates = [
    path.join(workspaceLocal, "supabase-helmet-db-password.txt"),
    path.join(workspaceLocal, "supabase-998-helmet-notes.txt"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    const uri = text.match(/postgres(?:ql)?:\/\/[^\s#]+/i)?.[0];
    if (uri) return { mode: "uri", value: uri };
    const line = text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#") && !l.startsWith("http") && !l.startsWith("sb_"));
    if (line) return { mode: "password", value: line };
  }
  return null;
}

function buildConfigs(cred) {
  if (cred.mode === "uri") {
    const connectionString = cred.value
      .replace(/[?&]sslmode=[^&]*/gi, "")
      .replace(/\?$/, "");
    return [{ connectionString, ssl: { rejectUnauthorized: false } }];
  }
  const password = cred.value;
  return [
    {
      host: `db.${REF}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password,
      ssl: { rejectUnauthorized: false },
    },
    {
      host: "aws-1-us-east-1.pooler.supabase.com",
      port: 5432,
      database: "postgres",
      user: `postgres.${REF}`,
      password,
      ssl: { rejectUnauthorized: false },
    },
  ];
}

const cred =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
    ? { mode: "uri", value: (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL).trim() }
    : readPasswordFile();

if (!cred) {
  console.error("Missing helmet DB credentials in slatepress/.local/");
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const configs = buildConfigs(cred);
let lastErr;
for (const config of configs) {
  const client = new pg.Client(config);
  try {
    await client.connect();
    await client.query(sql);
    const audit = await client.query(`
      select c.relname as table_name, c.relrowsecurity as rls_enabled,
             exists (
               select 1 from pg_policies p
               where p.schemaname = 'public' and p.tablename = c.relname
                 and p.policyname = 'block_anon_authenticated'
             ) as has_deny_policy
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
        and c.relname in (
          'wd_leads','api_rate_limits','contact_submissions','crm_telegram_settings',
          'processed_stripe_events','discovery_prospects','inbound_sms','blog_posts',
          'voice_demo_leads','jarvis_plumbing_jobs'
        )
      order by 1
    `);
    for (const row of audit.rows) {
      console.log(`${row.table_name}\trls=${row.rls_enabled}\tdeny_policy=${row.has_deny_policy}`);
    }
    const bad = audit.rows.filter((r) => !r.rls_enabled || !r.has_deny_policy);
    if (bad.length) {
      console.error("Incomplete:", bad.map((r) => r.table_name).join(", "));
      process.exit(1);
    }
    console.log("OK - RLS security hardening applied");
    await client.end();
    process.exit(0);
  } catch (err) {
    lastErr = err;
    await client.end().catch(() => undefined);
  }
}

console.error(lastErr?.message ?? "Could not connect");
process.exit(1);
