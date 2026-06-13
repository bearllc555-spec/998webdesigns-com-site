/**
 * Create contact_submissions on helmet (xwldbxburzqryxlzocck).
 * Password: slatepress/.local/supabase-helmet-db-password.txt
 * Or full postgresql:// URI in that file.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const REF = "xwldbxburzqryxlzocck";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workspaceLocal = path.resolve(repoRoot, "..", "..", ".local");
const sqlPath = path.join(repoRoot, "supabase", "contact-submissions.sql");

function readCred() {
  for (const name of ["supabase-helmet-db-password.txt", "supabase-998-helmet-notes.txt"]) {
    const p = path.join(workspaceLocal, name);
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
    return [{ connectionString: cred.value, ssl: { rejectUnauthorized: false } }];
  }
  return [
    {
      host: `db.${REF}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: cred.value,
      ssl: { rejectUnauthorized: false },
    },
    {
      host: "aws-1-us-east-1.pooler.supabase.com",
      port: 5432,
      database: "postgres",
      user: `postgres.${REF}`,
      password: cred.value,
      ssl: { rejectUnauthorized: false },
    },
  ];
}

async function main() {
  const cred = readCred();
  if (!cred) {
    console.error("No DB password in slatepress/.local/supabase-helmet-db-password.txt");
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  let lastErr;
  for (const config of buildConfigs(cred)) {
    const client = new pg.Client(config);
    try {
      await client.connect();
      await client.query(sql);
      const check = await client.query(
        `select 1 from information_schema.tables where table_schema = 'public' and table_name = 'contact_submissions'`
      );
      console.log(
        check.rowCount
          ? `OK - contact_submissions exists (via ${config.host ?? "uri"})`
          : "FAIL - query ran but table not found"
      );
      await client.end();
      process.exit(check.rowCount ? 0 : 1);
    } catch (err) {
      lastErr = err;
      await client.end().catch(() => undefined);
    }
  }
  console.error(lastErr?.message ?? "Could not connect");
  console.error(
    `Run SQL manually: https://supabase.com/dashboard/project/${REF}/sql/new`
  );
  process.exit(1);
}

main();
