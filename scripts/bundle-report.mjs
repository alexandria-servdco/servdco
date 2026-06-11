import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const distAssets = join(process.cwd(), "dist", "assets");

function listFiles(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isFile()) {
      entries.push({ name, bytes: stat.size });
    }
  }
  return entries.sort((a, b) => b.bytes - a.bytes);
}

try {
  const files = listFiles(distAssets);
  const total = files.reduce((n, f) => n + f.bytes, 0);
  console.log("Bundle analysis (dist/assets):\n");
  for (const f of files) {
    const kb = (f.bytes / 1024).toFixed(1);
    console.log(`  ${kb.padStart(8)} KB  ${f.name}`);
  }
  console.log(`\n  Total: ${(total / 1024).toFixed(1)} KB (${files.length} files)`);
} catch (err) {
  console.error("Run pnpm build before analyze:", err.message);
  process.exit(1);
}
