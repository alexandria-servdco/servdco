/**
 * Generates Supabase-compatible TypeScript types from live cloud Postgres.
 * No Docker required — uses pg introspection.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("Set SUPABASE_DB_URL (do not commit).");
  process.exit(1);
}

const tsToPg = {
  uuid: "string",
  text: "string",
  bool: "boolean",
  boolean: "boolean",
  int2: "number",
  int4: "number",
  int8: "number",
  float4: "number",
  float8: "number",
  numeric: "number",
  json: "Json",
  jsonb: "Json",
  "timestamp with time zone": "string",
  timestamptz: "string",
  date: "string",
  time: "string",
  inet: "string",
  "character": "string",
  bpchar: "string",
  _text: "string[]",
};

function mapType(udtName, dataType, isNullable) {
  let t;
  if (udtName.startsWith("_")) {
    const base = udtName.slice(1);
    t = tsToPg[base] ? `${tsToPg[base]}[]` : "Json";
  } else if (dataType === "USER-DEFINED") {
    t = `Database["public"]["Enums"]["${udtName}"]`;
  } else if (dataType === "ARRAY") {
    t = "string[]";
  } else {
    t = tsToPg[udtName] || tsToPg[dataType] || "Json";
  }
  return isNullable === "YES" ? `${t} | null` : t;
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();

  const { rows: enums } = await client.query(`
    SELECT t.typname AS name, e.enumlabel AS value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  `);

  const enumMap = {};
  for (const row of enums) {
    if (!enumMap[row.name]) enumMap[row.name] = [];
    enumMap[row.name].push(row.value);
  }

  const { rows: columns } = await client.query(`
    SELECT table_name, column_name, data_type, udt_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  const tables = {};
  for (const col of columns) {
    if (!tables[col.table_name]) tables[col.table_name] = [];
    tables[col.table_name].push(col);
  }

  let out = `/**
 * Generated from cloud Supabase (project: onerrwpixumcablgyhzs).
 * Regenerate: SUPABASE_DB_URL=... node supabase/scripts/generate-types.mjs
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
`;

  for (const [table, cols] of Object.entries(tables)) {
    const rowType = cols
      .map((c) => `          ${c.column_name}: ${mapType(c.udt_name, c.data_type, c.is_nullable)}`)
      .join("\n");

    out += `      ${table}: {
        Row: {
${rowType}
        };
        Insert: {
${cols.map((c) => {
  const t = mapType(c.udt_name, c.data_type, "YES");
  const optional = c.is_nullable === "YES" || c.column_name === "id" ? "?" : "";
  return `          ${c.column_name}${optional}: ${t}`;
}).join("\n")}
        };
        Update: {
${cols.map((c) => `          ${c.column_name}?: ${mapType(c.udt_name, c.data_type, "YES")}`).join("\n")}
        };
        Relationships: [];
      };
`;
  }

  out += `    };
    Views: Record<string, never>;
    Functions: {
      get_auth_uid: { Args: Record<string, never>; Returns: string };
      get_user_role: { Args: Record<string, never>; Returns: Database["public"]["Enums"]["user_role"] };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_family: { Args: Record<string, never>; Returns: boolean };
      is_chef: { Args: Record<string, never>; Returns: boolean };
      owns_chef_profile: { Args: { p_chef_profile_id: string }; Returns: boolean };
      is_public_chef_profile: { Args: { p_chef_profile_id: string }; Returns: boolean };
    };
    Enums: {
`;

  for (const [name, values] of Object.entries(enumMap)) {
    out += `      ${name}: ${values.map((v) => `"${v}"`).join(" | ")};\n`;
  }

  out += `    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
`;

  const outPath = path.join(__dirname, "..", "..", "client", "lib", "supabase", "database.types.ts");
  fs.writeFileSync(outPath, out);
  console.log(`Types written to ${outPath}`);
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await client.end();
}
