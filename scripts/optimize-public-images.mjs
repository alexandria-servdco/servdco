/**
 * Generate responsive WebP variants for marketing PNGs in public/.
 * Run: node scripts/optimize-public-images.mjs
 */
import sharp from "sharp";
import { readdirSync, statSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, parse, basename } from "node:path";

const PUBLIC = join(process.cwd(), "public");
const WIDTHS = [480, 768, 1280, 1920];
const LOGO_BASES = new Set(["1", "3"]);
const LOGO_WIDTHS = [128, 256, 480];
const SKIP = new Set([
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "placeholder.svg",
  "robots.txt",
  "sitemap.xml",
]);

const manifest = {};

async function processImage(filePath) {
  const name = basename(filePath);
  if (SKIP.has(name) || !/\.(png|jpe?g)$/i.test(name)) return;

  const base = parse(name).name;
  const meta = await sharp(filePath).metadata();
  const origW = meta.width ?? 1920;
  const origH = meta.height ?? 1080;
  const sizes = [];
  const targetWidths = LOGO_BASES.has(base) ? LOGO_WIDTHS : WIDTHS;

  for (const w of targetWidths) {
    if (w > origW) continue;
    const outName = `${base}-${w}.webp`;
    const outPath = join(PUBLIC, outName);
    const h = Math.round((origH / origW) * w);
    await sharp(filePath)
      .resize(w, h, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(outPath);
    sizes.push({ width: w, height: h, path: `/${outName}`, bytes: statSync(outPath).size });
  }

  const fallbackName = `${base}-1280.webp`;
  const fallbackPath = join(PUBLIC, fallbackName);
  if (!existsSync(fallbackPath)) {
    const w = Math.min(1280, origW);
    const h = Math.round((origH / origW) * w);
    await sharp(filePath)
      .resize(w, h, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(fallbackPath);
    if (!sizes.some((s) => s.width === w)) {
      sizes.push({ width: w, height: h, path: `/${fallbackName}`, bytes: statSync(fallbackPath).size });
    }
  }

  sizes.sort((a, b) => a.width - b.width);
  manifest[base] = {
    original: `/${name}`,
    originalBytes: statSync(filePath).size,
    aspectRatio: `${origW} / ${origH}`,
    defaultWidth: origW,
    defaultHeight: origH,
    sizes,
  };
  console.log(`  ${base}: ${sizes.length} WebP variants`);
}

const files = readdirSync(PUBLIC).filter((f) => /\.(png|jpe?g)$/i.test(f));
console.log(`Optimizing ${files.length} images...\n`);
for (const f of files) {
  await processImage(join(PUBLIC, f));
}

const manifestPath = join(process.cwd(), "shared", "marketingImages.json");
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\nWrote ${manifestPath}`);
