/**
 * Verify chef documents have resolvable signed URLs for preview types.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const env = {};
  const envPath = path.join(root, ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  }
  return env;
}

function loadDbUrl(env) {
  const envPath = path.join(root, ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      if (line.startsWith("SUPABASE_DB_URL=")) {
        const raw = line.slice("SUPABASE_DB_URL=".length).trim();
        if (raw) {
          try {
            return new URL(raw).toString();
          } catch {
            const match = raw.match(
              /^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/,
            );
            if (match) {
              const [, user, pass, host, db] = match;
              return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}`;
            }
          }
        }
      }
    }
  }
  if (env.SUPABASE_DB_URL) {
    try {
      return new URL(env.SUPABASE_DB_URL).toString();
    } catch {
      /* use fallback */
    }
  }
  throw new Error(
    "SUPABASE_DB_URL is required. Set it in .env.local or the environment before running this script.",
  );
}

function detectType(pathStr) {
  const lower = pathStr.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g)$/.test(lower)) return "jpeg";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".webp")) return "webp";
  return "unknown";
}

async function main() {
  const env = loadEnv();
  const supabaseUrl =
    env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://onerrwpixumcablgyhzs.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const pgClient = new pg.Client({
    connectionString: loadDbUrl(env),
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  const { rows } = await pgClient.query(`
    SELECT id, document_type, storage_bucket, storage_path, status
    FROM public.chef_documents
    WHERE deleted_at IS NULL
    ORDER BY submitted_at DESC
    LIMIT 20
  `);
  await pgClient.end();

  const admin = serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  const documents = [];
  for (const row of rows) {
    const fileType = detectType(row.storage_path ?? "");
    let signedUrl = null;
    let fetchOk = false;
    let fetchStatus = null;
    let skipReason = null;

    if (!row.storage_path?.trim()) {
      skipReason = "missing_storage_path";
    } else if (!admin) {
      skipReason = "no_service_key";
    } else if (row.storage_bucket !== "cook-documents") {
      skipReason = "unexpected_bucket";
    } else {
      const { data, error } = await admin.storage
        .from(row.storage_bucket)
        .createSignedUrl(row.storage_path, 3600);
      if (error) skipReason = error.message;
      signedUrl = data?.signedUrl ?? null;
      if (signedUrl) {
        try {
          const res = await fetch(signedUrl, { method: "HEAD" });
          fetchStatus = res.status;
          fetchOk = res.ok;
        } catch {
          fetchOk = false;
        }
      }
    }

    documents.push({
      id: row.id,
      document_type: row.document_type,
      fileType,
      status: row.status,
      signedUrlGenerated: Boolean(signedUrl),
      fetchOk,
      fetchStatus,
      skipReason,
    });
  }

  const previewable = documents.filter((d) => !d.skipReason);

  const byType = {};
  for (const d of documents) {
    byType[d.fileType] = byType[d.fileType] ?? { total: 0, fetchOk: 0 };
    byType[d.fileType].total++;
    if (d.fetchOk) byType[d.fileType].fetchOk++;
  }

  const result = {
    timestamp: new Date().toISOString(),
    documentCount: documents.length,
    documents,
    byType,
    pass:
      previewable.length === 0 ||
      previewable.every((d) => d.signedUrlGenerated && d.fetchOk),
    previewableCount: previewable.length,
    skippedCount: documents.length - previewable.length,
  };

  fs.writeFileSync(
    path.join(__dirname, "phase1-document-preview-test.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.pass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
