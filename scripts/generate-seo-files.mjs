/**
 * Generate public/sitemap.xml and public/robots.txt at build time.
 * Uses VITE_SITE_URL → SITE_URL → VERCEL_URL (no hardcoded deployment host).
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

function resolveBuildSiteUrl() {
  const raw =
    process.env.VITE_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_URL;

  if (!raw) {
    console.warn(
      "[generate-seo-files] No VITE_SITE_URL / SITE_URL / VERCEL_URL — using relative sitemap paths only.",
    );
    return null;
  }

  if (raw.startsWith("http")) return raw.replace(/\/$/, "");
  return `https://${raw.replace(/\/$/, "")}`;
}

const SITEMAP_PATHS = [
  "/",
  "/browse-chefs",
  "/pricing",
  "/how-it-works",
  "/for-chefs",
  "/faq",
  "/contact",
  "/about",
  "/register/family",
  "/register/chef",
  "/privacy",
  "/terms",
  "/cookies",
  "/legal",
];

const base = resolveBuildSiteUrl();

const sitemapEntries = SITEMAP_PATHS.map((path) => {
  const loc = base ? `${base}${path === "/" ? "" : path}` : path;
  const priority = path === "/" ? "1.0" : path === "/browse-chefs" ? "0.9" : "0.7";
  const changefreq =
    path === "/browse-chefs" ? "daily" : path === "/" ? "weekly" : "monthly";
  return `  <url><loc>${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;

const robots = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

${base ? `Sitemap: ${base}/sitemap.xml` : "# Set VITE_SITE_URL at build time for absolute sitemap URL"}
`;

writeFileSync(join(publicDir, "sitemap.xml"), sitemap, "utf8");
writeFileSync(join(publicDir, "robots.txt"), robots, "utf8");

console.log(
  `[generate-seo-files] Wrote sitemap.xml + robots.txt${base ? ` for ${base}` : ""}`,
);
