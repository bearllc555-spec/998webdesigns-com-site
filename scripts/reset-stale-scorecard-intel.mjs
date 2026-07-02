/**
 * Clear bad/stale internal_intel so the VPS worker re-fetches with design_intel.py v40.09+.
 * Run: node scripts/reset-stale-scorecard-intel.mjs
 */
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceLocal = path.resolve(__dirname, "..", "..", "..", ".local");
const text = fs.readFileSync(
  path.join(workspaceLocal, "supabase-helmet-db-password.txt"),
  "utf8"
);
const uri = text.match(/postgres(?:ql)?:\/\/[^\s#]+/i)?.[0];
const client = new pg.Client({
  connectionString: uri.replace(/[?&]sslmode=[^&]*/gi, "").replace(/\?$/, ""),
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const { rows: before } = await client.query(`
  select token, domain,
         internal_intel->'awwwards'->>'title' as aw_title,
         internal_intel->>'fetched_at' as fetched
  from scorecard_reports
  where internal_intel is not null
    and (
      internal_intel->'awwwards'->>'title' ilike '%Visual Cinnamon%'
      or internal_intel->'awwwards'->>'summary' ilike '%Visual Cinnamon%'
      or internal_intel->'awwwards'->>'profile_url' ilike '%searching-for-birds%'
      or internal_intel->'websiterating'->>'error' ilike 'HTTP 403%'
    )
  order by created_at desc
`);

console.log(`Stale intel reports: ${before.length}`);
for (const r of before) {
  console.log(`  ${r.domain} (${r.token}) aw=${r.aw_title} fetched=${r.fetched}`);
}

if (before.length === 0) {
  console.log("Nothing to reset.");
  await client.end();
  process.exit(0);
}

const { rowCount } = await client.query(`
  update scorecard_reports
  set internal_intel = null
  where internal_intel is not null
    and (
      internal_intel->'awwwards'->>'title' ilike '%Visual Cinnamon%'
      or internal_intel->'awwwards'->>'summary' ilike '%Visual Cinnamon%'
      or internal_intel->'awwwards'->>'profile_url' ilike '%searching-for-birds%'
      or internal_intel->'websiterating'->>'error' ilike 'HTTP 403%'
    )
`);

console.log(`Cleared internal_intel on ${rowCount} report(s). VPS worker will re-fetch within ~30s.`);
await client.end();
