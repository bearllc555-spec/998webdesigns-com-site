#!/usr/bin/env node
/**
 * Pre-cutover ops checklist for Cloudflare preview/production URLs.
 * Usage: node scripts/cf-ops-checklist.mjs [base-url]
 * Example: node scripts/cf-ops-checklist.mjs https://998webdesigns-com-site.workers.dev
 */

const base = (process.argv[2] || process.env.CF_OPS_BASE_URL || "https://998webdesigns.com").replace(
  /\/$/,
  ""
);
const bearer = process.env.BALANCE_CAPTURE_SECRET?.trim();

if (!bearer) {
  console.error("Set BALANCE_CAPTURE_SECRET in the environment.");
  process.exit(1);
}

const checks = [
  {
    name: "env-status",
    run: async () => {
      const res = await fetch(`${base}/api/admin/env-status`, {
        headers: { Authorization: `Bearer ${bearer}` },
      });
      const json = await res.json();
      return {
        ok: res.ok && json.readyForLiveCharges === true && (json.warnings?.length ?? 0) === 0,
        detail: json,
      };
    },
  },
  {
    name: "sitemap",
    run: async () => {
      const res = await fetch(`${base}/sitemap.xml`);
      const text = await res.text();
      return { ok: res.ok && text.includes("<urlset"), detail: { status: res.status } };
    },
  },
  {
    name: "robots",
    run: async () => {
      const res = await fetch(`${base}/robots.txt`);
      const text = await res.text();
      return { ok: res.ok && text.includes("Sitemap:"), detail: { status: res.status } };
    },
  },
  {
    name: "book-page",
    run: async () => {
      const res = await fetch(`${base}/book`);
      const text = await res.text();
      return { ok: res.ok && text.includes("book"), detail: { status: res.status } };
    },
  },
  {
    name: "crm-login",
    run: async () => {
      const res = await fetch(`${base}/crm/login`);
      return { ok: res.ok, detail: { status: res.status } };
    },
  },
];

async function main() {
  console.log(`CF ops checklist against ${base}\n`);
  let failed = 0;
  for (const check of checks) {
    try {
      const result = await check.run();
      const mark = result.ok ? "PASS" : "FAIL";
      console.log(`${mark}  ${check.name}`);
      if (!result.ok) {
        failed += 1;
        console.log(JSON.stringify(result.detail, null, 2));
      }
    } catch (err) {
      failed += 1;
      console.log(`FAIL  ${check.name}`);
      console.error(err);
    }
  }
  console.log(`\nManual: Stripe webhook E2E, discovery SMS+Calendly, crons (cf-cron.yml), voice demo token.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
