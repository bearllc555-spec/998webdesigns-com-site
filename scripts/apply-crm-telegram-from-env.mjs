/**
 * Apply crm_telegram_settings using POSTGRES_* from a dotenv file (default .env.vercel.prod).
 * Usage: node scripts/apply-crm-telegram-from-env.mjs [.env.vercel.prod]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const envFile = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(repoRoot, ".env.vercel.prod");
const migrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260602180000_crm_telegram_settings.sql"
);

function parseEnv(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)="(.*)"\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function main() {
  if (!fs.existsSync(envFile)) {
    console.error("Env file not found:", envFile);
    process.exit(1);
  }
  const env = parseEnv(fs.readFileSync(envFile, "utf8"));
  const sql = fs.readFileSync(migrationPath, "utf8");

  const configs = [];
  if (env.POSTGRES_URL_NON_POOLING) {
    const connectionString = env.POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/gi, "").replace(/\?$/, "");
    configs.push({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  if (env.POSTGRES_HOST && env.POSTGRES_PASSWORD) {
    configs.push({
      host: env.POSTGRES_HOST,
      port: 5432,
      database: env.POSTGRES_DATABASE || "postgres",
      user: env.POSTGRES_USER || "postgres",
      password: env.POSTGRES_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });
  }

  if (!configs.length) {
    console.error("No POSTGRES_URL_NON_POOLING or POSTGRES_HOST in", envFile);
    process.exit(1);
  }

  let lastErr;
  for (const config of configs) {
    const client = new pg.Client(config);
    try {
      await client.connect();
      await client.query(sql);
      const check = await client.query(
        `select table_name from information_schema.tables where table_schema = 'public' and table_name = 'crm_telegram_settings'`
      );
      const host = config.host ?? "pooler";
      console.log(
        check.rows.length
          ? `OK — crm_telegram_settings on ${host}`
          : `WARN — ran on ${host} but table not visible`
      );
      await client.end();
      return;
    } catch (err) {
      lastErr = err;
      await client.end().catch(() => undefined);
    }
  }
  console.error(lastErr?.message ?? "Failed");
  process.exit(1);
}

main();
