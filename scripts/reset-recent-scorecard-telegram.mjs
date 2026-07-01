/**
 * Reset crm_ready_notified_at for recent scorecard reports so backfill can retry
 * after a false-positive mark (telegram failed but row was marked notified).
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceLocal = path.resolve(__dirname, "..", "..", "..", ".local");

function readUri() {
  const p = path.join(workspaceLocal, "supabase-helmet-db-password.txt");
  const text = fs.readFileSync(p, "utf8");
  return text.match(/postgres(?:ql)?:\/\/[^\s#]+/i)?.[0];
}

async function main() {
  const uri = readUri();
  if (!uri) {
    console.error("Missing DB URI");
    process.exit(1);
  }
  const client = new pg.Client({
    connectionString: uri.replace(/[?&]sslmode=[^&]*/gi, "").replace(/\?$/, ""),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const res = await client.query(`
    update public.scorecard_reports
    set crm_ready_notified_at = null
    where crm_ready_notified_at is not null
      and created_at > now() - interval '3 days'
    returning id, domain`);
  console.log("Reset", res.rowCount, "reports:", res.rows.map((r) => r.domain).join(", "));
  await client.end();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
