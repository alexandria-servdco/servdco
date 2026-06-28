import pg from "pg";
import { loadDbUrl } from "./lib/loadDbUrl.mjs";

const client = new pg.Client({
  connectionString: loadDbUrl(),
  ssl: { rejectUnauthorized: false },
});
await client.connect();
const { rows } = await client.query(`
  SELECT id, storage_bucket, storage_path, status
  FROM public.chef_documents
  WHERE deleted_at IS NULL
    AND (storage_path IS NULL OR storage_path = '' OR storage_bucket IS NULL)
  LIMIT 20
`);
const { rows: all } = await client.query(`
  SELECT id, storage_bucket, storage_path, status
  FROM public.chef_documents WHERE deleted_at IS NULL
  ORDER BY submitted_at DESC LIMIT 20
`);
await client.end();
console.log(JSON.stringify({ invalidPaths: rows, sample: all.slice(0, 5) }, null, 2));
