/**
 * Apply blog authoring columns on helmet (xwldbxburzqryxlzocck).
 * Direct Postgres connection using the DB password in slatepress/.local/.
 * Use when POSTGRES_* DDL vars are not available locally.
 *
 * Usage: node scripts/apply-blog-authoring-migration.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const REF = "xwldbxburzqryxlzocck";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workspaceLocal = path.resolve(repoRoot, "..", "..", ".local");
const migrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260618150000_blog_posts_authoring.sql"
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

const POOLER_HOSTS = ["aws-1-us-east-1.pooler.supabase.com"];

function buildConfigs(cred) {
  if (cred.mode === "uri") {
    return [{ connectionString: cred.value, ssl: { rejectUnauthorized: false } }];
  }
  const password = cred.value;
  const configs = [
    {
      host: `db.${REF}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password,
      ssl: { rejectUnauthorized: false },
    },
  ];
  for (const host of POOLER_HOSTS) {
    configs.push({
      host,
      port: 5432,
      database: "postgres",
      user: `postgres.${REF}`,
      password,
      ssl: { rejectUnauthorized: false },
    });
  }
  return configs;
}

async function main() {
  const cred =
    process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
      ? {
          mode: "uri",
          value: (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL).trim(),
        }
      : readPasswordFile();

  if (!cred) {
    console.error("Missing DB credentials in .local/ or DATABASE_URL");
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf8");
  const configs = buildConfigs(cred);
  let lastErr;
  for (const config of configs) {
    const client = new pg.Client(config);
    try {
      await client.connect();
      await client.query(sql);
      const cols = await client.query(
        `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'blog_posts' and column_name in ('body','status','scheduled_at','view_count','tags') order by 1`
      );
      console.log(
        cols.rows.length === 5
          ? "OK - blog authoring columns exist"
          : `WARN - columns found: ${cols.rows.map((r) => r.column_name).join(", ")}`
      );
      await client.end();
      return;
    } catch (err) {
      lastErr = err;
      await client.end().catch(() => undefined);
    }
  }
  console.error(lastErr?.message ?? "Could not apply migration");
  process.exit(1);
}

main();
