/**
 * Apply the 30-article posting sequence + internal linking map to the
 * blog_posts already in Supabase.
 *
 * - Injects a "Related reading" block (idempotent, sentinel-wrapped) before the
 *   in-body CTA of each sequenced article, with links remapped to the actual DB
 *   slugs. Links to articles that are not in the DB are dropped.
 * - Adds the relevant homepage add-on anchor link where the map specifies one.
 * - Deletes the planning doc that was accidentally imported as a post.
 *
 * Run with --dry to preview without writing.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");

function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

/* Canonical plan slug -> actual DB slug. null = article not imported yet. */
const CANON_TO_DB = {
  "why-isnt-my-plumbing-business-showing-up-on-google": "why-isn-t-my-plumbing-business-showing-up-on-google",
  "how-to-get-more-roofing-leads": "how-to-get-more-roofing-leads-without-buying-them-from-a-lead-service",
  "how-much-should-a-plumbing-or-roofing-website-cost": "how-much-should-a-plumbing-or-roofing-website-cost-in-2026",
  "do-plumbers-really-need-a-website": "do-plumbers-really-need-a-website-if-most-work-comes-from-referrals",
  "how-to-show-up-for-near-me-searches": null,
  "what-makes-a-plumbing-website-convert": "what-actually-makes-a-plumbing-website-convert-visitors-into-calls",
  "why-is-my-contractor-website-slow-on-phones": "why-is-my-contractor-website-so-slow-on-phones-and-why-it-matters",
  "how-to-get-more-google-reviews-for-your-trade-business": "how-to-get-more-google-reviews-for-your-plumbing-or-roofing-business",
  "how-to-claim-and-verify-google-business-profile": "how-to-claim-and-verify-your-google-business-profile-step-by-step",
  "roofing-website-mistakes-that-cost-you-jobs": "7-roofing-website-mistakes-that-quietly-cost-you-jobs",
  "what-pages-does-a-plumbing-website-need": "what-pages-does-a-plumbing-website-actually-need",
  "website-or-google-profile-which-first-for-contractors": "website-or-google-business-profile-which-should-a-contractor-do-first",
  "diy-website-builder-vs-hiring-a-pro-for-a-contractor": "diy-website-builder-vs-hiring-a-pro-which-is-right-for-a-contractor",
  "how-to-get-customers-to-leave-photos-and-reviews": "how-to-get-customers-to-leave-reviews-with-photos-and-why-it-matters",
  "how-much-does-a-plumber-make-from-a-good-website": "what-is-a-good-website-actually-worth-to-a-plumber-the-math",
  "should-roofers-use-an-ai-receptionist-for-missed-calls": "missed-calls-are-costing-roofers-jobs-is-an-ai-receptionist-the-fix",
  "how-to-write-plumbing-service-pages-that-rank": null,
  "how-to-stand-out-from-cheaper-competitors": "how-to-win-jobs-when-a-competitor-always-undercuts-your-price",
  "what-to-look-for-in-a-web-designer-for-trades": "what-to-look-for-when-hiring-someone-to-build-your-contractor-website",
  "how-long-does-it-take-to-build-a-contractor-website": "how-long-does-it-take-to-build-a-contractor-website",
  "what-is-local-seo-and-does-my-trade-business-need-it": "what-is-local-seo-and-does-my-plumbing-or-roofing-business-need-it",
  "do-i-need-a-website-or-just-a-facebook-page": "do-i-need-a-website-or-is-a-facebook-page-enough-for-my-trade-business",
  "how-ai-chatbots-help-trade-websites": "can-an-ai-chatbot-actually-help-a-plumbing-or-roofing-website",
  "should-roofers-offer-online-booking": "should-roofers-offer-online-booking-or-stick-to-phone-calls",
  "plumbing-website-examples-what-good-looks-like": null,
  "do-i-need-a-separate-website-for-each-service-area": "do-i-need-a-separate-page-for-each-town-i-serve",
  "how-to-get-your-new-website-found-on-google-fast": "how-to-get-a-brand-new-contractor-website-found-on-google-faster",
  "is-it-worth-paying-for-google-ads-as-a-plumber": "is-it-worth-paying-for-google-ads-as-a-plumber-or-roofer",
  "how-often-should-a-trade-business-blog": "how-often-should-a-plumbing-or-roofing-business-blog-if-at-all",
  "why-storm-season-is-when-roofers-need-a-website-most": "why-storm-season-is-when-a-roofer-s-website-matters-most",
};

/* Posting order: canonical slug -> sequence number (1-30). */
const SEQUENCE = [
  "why-isnt-my-plumbing-business-showing-up-on-google",
  "how-to-get-more-roofing-leads",
  "how-much-should-a-plumbing-or-roofing-website-cost",
  "do-plumbers-really-need-a-website",
  "how-to-show-up-for-near-me-searches",
  "what-makes-a-plumbing-website-convert",
  "why-is-my-contractor-website-slow-on-phones",
  "how-to-get-more-google-reviews-for-your-trade-business",
  "how-to-claim-and-verify-google-business-profile",
  "roofing-website-mistakes-that-cost-you-jobs",
  "what-pages-does-a-plumbing-website-need",
  "website-or-google-profile-which-first-for-contractors",
  "diy-website-builder-vs-hiring-a-pro-for-a-contractor",
  "how-to-get-customers-to-leave-photos-and-reviews",
  "how-much-does-a-plumber-make-from-a-good-website",
  "should-roofers-use-an-ai-receptionist-for-missed-calls",
  "how-to-write-plumbing-service-pages-that-rank",
  "how-to-stand-out-from-cheaper-competitors",
  "what-to-look-for-in-a-web-designer-for-trades",
  "how-long-does-it-take-to-build-a-contractor-website",
  "what-is-local-seo-and-does-my-trade-business-need-it",
  "do-i-need-a-website-or-just-a-facebook-page",
  "how-ai-chatbots-help-trade-websites",
  "should-roofers-offer-online-booking",
  "plumbing-website-examples-what-good-looks-like",
  "do-i-need-a-separate-website-for-each-service-area",
  "how-to-get-your-new-website-found-on-google-fast",
  "is-it-worth-paying-for-google-ads-as-a-plumber",
  "how-often-should-a-trade-business-blog",
  "why-storm-season-is-when-roofers-need-a-website-most",
];

function parseLinkingMap() {
  const text = readFileSync(new URL("../content/blog/00-internal-linking-map.md", import.meta.url), "utf8");
  const slugRe = /^`([a-z0-9-]+)`\s*$/gm;
  const matches = [...text.matchAll(slugRe)];
  const sections = {};
  for (let i = 0; i < matches.length; i++) {
    const canonical = matches[i][1];
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const seg = text.slice(start, end);

    const links = [];
    const fence = seg.match(/```markdown\n([\s\S]*?)```/);
    if (fence) {
      const bulletRe = /^- \[([^\]]+)\]\(https?:\/\/998webdesigns\.com\/blog\/([a-z0-9-]+)\)\s*$/gm;
      for (const lm of fence[1].matchAll(bulletRe)) {
        links.push({ label: lm[1], canonical: lm[2] });
      }
    }

    let addon = null;
    const addonM = seg.match(/\*Also link the add-on:\*\s*([^()]+?)\s*\(\/#(addon-[a-z-]+)\)/);
    if (addonM) addon = { label: addonM[1].trim(), id: addonM[2] };

    sections[canonical] = { links, addon };
  }
  return sections;
}

function buildBlock(canonical, section, dbSlug) {
  const lines = ["<!-- related-reading -->", "**Related reading**", ""];
  let bulletCount = 0;
  for (const link of section.links) {
    const targetDb = CANON_TO_DB[link.canonical];
    if (!targetDb || targetDb === dbSlug) continue; // drop missing + self
    lines.push(`- [${link.label}](/blog/${targetDb})`);
    bulletCount += 1;
  }
  if (bulletCount === 0) return null; // nothing worth adding
  if (section.addon) {
    lines.push("");
    lines.push(`*Also see: [${section.addon.label}](/#${section.addon.id}).*`);
  }
  lines.push("<!-- /related-reading -->");
  return lines.join("\n");
}

function injectBlock(body, block) {
  // Strip any prior injected block first (idempotent).
  let clean = body.replace(/\n*<!-- related-reading -->[\s\S]*?<!-- \/related-reading -->\n*/g, "\n");
  const sep = "\n---\n";
  const idx = clean.lastIndexOf(sep);
  if (idx === -1) {
    // No CTA separator: append at end.
    return `${clean.replace(/\s+$/, "")}\n\n${block}\n`;
  }
  const before = clean.slice(0, idx).replace(/\s+$/, "");
  const after = clean.slice(idx); // includes leading \n---\n
  return `${before}\n\n${block}\n${after}`;
}

async function main() {
  const env = loadEnv();
  const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const sections = parseLinkingMap();

  const { data: posts, error } = await supa
    .from("blog_posts")
    .select("id, slug, title, status, body");
  if (error) {
    console.error("Fetch error:", error.message);
    process.exit(1);
  }
  const bySlug = new Map(posts.map((p) => [p.slug, p]));

  console.log(`Mode: ${DRY ? "DRY RUN" : "APPLY"}`);
  console.log(`Posts in DB: ${posts.length}\n`);

  const missing = [];
  let updated = 0;
  let firstSample = true;

  for (let i = 0; i < SEQUENCE.length; i++) {
    const canonical = SEQUENCE[i];
    const seq = i + 1;
    const dbSlug = CANON_TO_DB[canonical];
    if (!dbSlug) {
      missing.push({ seq, canonical });
      continue;
    }
    const post = bySlug.get(dbSlug);
    if (!post) {
      missing.push({ seq, canonical, note: "mapped slug not found in DB" });
      continue;
    }
    const section = sections[canonical];
    if (!section) {
      console.log(`#${seq} ${dbSlug}: no linking-map section, skipping`);
      continue;
    }
    const block = buildBlock(canonical, section, dbSlug);
    if (!block) {
      console.log(`#${seq} ${dbSlug}: no valid related links, skipping`);
      continue;
    }
    const newBody = injectBlock(post.body, block);
    if (newBody === post.body) {
      console.log(`#${seq} ${dbSlug}: already up to date`);
      continue;
    }

    if (firstSample) {
      console.log("----- sample injected block (#" + seq + " " + dbSlug + ") -----");
      console.log(block);
      console.log("-----------------------------------------------------\n");
      firstSample = false;
    }

    if (!DRY) {
      const { error: upErr } = await supa
        .from("blog_posts")
        .update({ body: newBody, updated_at: new Date().toISOString() })
        .eq("id", post.id);
      if (upErr) {
        console.log(`#${seq} ${dbSlug}: UPDATE FAILED - ${upErr.message}`);
        continue;
      }
    }
    updated += 1;
    console.log(`#${seq} ${dbSlug}: ${DRY ? "would inject" : "injected"} related reading`);
  }

  // Delete the planning doc that got imported as a post.
  const junk = bySlug.get("00-posting-sequence-all-30");
  if (junk) {
    if (!DRY) {
      const { error: delErr } = await supa.from("blog_posts").delete().eq("id", junk.id);
      console.log(`\nJunk post 00-posting-sequence-all-30: ${delErr ? "DELETE FAILED " + delErr.message : "deleted"}`);
    } else {
      console.log(`\nJunk post 00-posting-sequence-all-30: would delete (id ${junk.id})`);
    }
  }

  console.log(`\n${DRY ? "Would update" : "Updated"} ${updated} article bodies.`);
  if (missing.length) {
    console.log(`\nMissing articles (not in DB, cannot sequence/link):`);
    for (const m of missing) console.log(`  #${m.seq} ${m.canonical}${m.note ? " (" + m.note + ")" : ""}`);
  }
}

main();
