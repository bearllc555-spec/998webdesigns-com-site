/** Reload PostgREST schema cache on helmet after DDL migrations. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const REF = "xwldbxburzqryxlzocck";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceLocal = path.resolve(__dirname, "..", "..", "..", ".local");

function readPasswordFile() {
  const candidates = [
    path.join(workspaceLocal, "supabase-helmet-db-password.txt"),
    path.join(workspaceLocal, "supabase-998-helmet-notes.txt"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    const uri = text.match(/postgres(?:ql)?:\/\/[^\s#]+/i)?.[0];
    if (uri) return uri;
  }
  return null;
}

async function main() {
  const uri = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || readPasswordFile();
  if (!uri) {
    console.error("Missing DATABASE_URL or .local password file");
    process.exit(1);
  }
  const client = new pg.Client({ connectionString: uri, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query("notify pgrst, 'reload schema'");
  console.log("OK - PostgREST schema reload notified");
  await client.end();
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
