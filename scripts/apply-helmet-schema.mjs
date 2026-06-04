/**
 * Apply supabase/schema.sql to helmet (xwldbxburzqryxlzocck).
 * Needs DB password in slatepress/.local/supabase-helmet-db-password.txt
 * or DATABASE_URL / SUPABASE_DB_URL in env (full postgres URI).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const REF = "xwldbxburzqryxlzocck";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workspaceLocal = path.resolve(repoRoot, "..", "..", ".local");
const schemaPath = path.join(repoRoot, "supabase", "schema.sql");

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

function buildConfig(cred) {
  if (cred.mode === "uri") {
    return { connectionString: cred.value, ssl: { rejectUnauthorized: false } };
  }
  return {
    host: `db.${REF}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: cred.value,
    ssl: { rejectUnauthorized: false },
  };
}

async function main() {
  const cred =
    process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
      ? { mode: "uri", value: (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL).trim() }
      : readPasswordFile();

  if (!cred) {
    console.error(
      "Missing DB password. Save it to:\n  " +
        path.join(workspaceLocal, "supabase-helmet-db-password.txt") +
        "\n(Get it: Supabase -> helmet -> Project Settings -> Database -> Database password)\n"
    );
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, "utf8");
  const client = new pg.Client(buildConfig(cred));
  await client.connect();
  try {
    await client.query(sql);
    const tables = await client.query(
      `select table_name from information_schema.tables where table_schema = 'public' and table_name in ('wd_leads','api_rate_limits') order by 1`
    );
    console.log("OK — tables:", tables.rows.map((r) => r.table_name).join(", "));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
