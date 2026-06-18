/**
 * Import the 3 articles that were missing from the 30-run (#5, #17, #25) as
 * drafts. Parses frontmatter loosely (the source YAML has unescaped nested
 * quotes), derives title/description from the body, and strips the hand-written
 * "Related reading" block so the linker (apply-blog-sequence.mjs) can inject the
 * canonical sentinel-wrapped block afterwards.
 *
 * Run with --dry to preview.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");
const SITE_BASE = "https://998webdesigns.com";

const FILES = [
  "how-to-show-up-for-near-me-searches.md",
  "how-to-write-plumbing-service-pages-that-rank.md",
  "plumbing-website-examples-what-good-looks-like.md",
];

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

function parseArticle(filename) {
  const raw = readFileSync(
    new URL(`../content/blog/articles-01/${filename}`, import.meta.url),
    "utf8"
  );
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const fmText = fm ? fm[1] : "";
  let body = (fm ? fm[2] : raw).trim();

  const slug =
    (fmText.match(/^slug:\s*(.+)$/m)?.[1] ?? filename.replace(/\.md$/, "")).trim();

  let tags = [];
  const tagsM = fmText.match(/^tags:\s*\[([^\]]*)\]/m);
  if (tagsM) {
    tags = tagsM[1]
      .split(",")
      .map((t) => t.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  const title = (body.match(/^#\s+(.+)$/m)?.[1] ?? slug).trim();
  const description = (body.match(/^\*(.+)\*\s*$/m)?.[1] ?? "").trim();

  // Strip the hand-written "Related reading" block (up to the CTA separator).
  body = body.replace(/\n+\*\*Related reading\*\*[\s\S]*?(?=\n---\n)/, "\n");
  body = body.replace(/\s+$/, "") + "\n";

  return { slug, title, description, tags, body };
}

async function main() {
  const env = loadEnv();
  const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log(`Mode: ${DRY ? "DRY RUN" : "IMPORT"}\n`);

  for (const file of FILES) {
    const a = parseArticle(file);

    const { data: existing } = await supa
      .from("blog_posts")
      .select("id")
      .eq("slug", a.slug)
      .maybeSingle();

    console.log(`=== ${a.slug} ===`);
    console.log(`title:       ${a.title}`);
    console.log(`description: ${a.description}`);
    console.log(`tags:        [${a.tags.join(", ")}]`);
    console.log(`body chars:  ${a.body.length}`);
    console.log(`tail:        ...${a.body.slice(-90).replace(/\n/g, "\\n")}`);

    if (existing) {
      console.log("ALREADY EXISTS - skipping insert\n");
      continue;
    }
    if (DRY) {
      console.log("would insert\n");
      continue;
    }

    const { error } = await supa.from("blog_posts").insert({
      slug: a.slug,
      title: a.title,
      description: a.description,
      body: a.body,
      url: `${SITE_BASE}/blog/${a.slug}`,
      tags: a.tags,
      author: "998 web designs",
      featured: false,
      og_image_url: null,
      staff_notes: null,
      status: "draft",
      published_at: null,
      scheduled_at: null,
      updated_at: new Date().toISOString(),
    });
    console.log(error ? `INSERT FAILED: ${error.message}\n` : "inserted\n");
  }
}

main();
