import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const workspaceLocal = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  ".local"
);
for (const f of ["supabase-helmet-url.txt", "supabase-998-helmet-notes.txt"]) {
  const p = path.join(workspaceLocal, f);
  if (!fs.existsSync(p)) continue;
  const t = fs.readFileSync(p, "utf8");
  const url = t.match(/https:\/\/[a-z0-9]+\.supabase\.co/i)?.[0];
  const pg = t.match(/postgres\.([a-z0-9]+)@/i)?.[1];
  console.log(f, url ?? pg ?? "unknown");
}
