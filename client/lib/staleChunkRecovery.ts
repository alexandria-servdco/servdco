const STALE_CHUNK_SESSION_KEY = "servdco:stale-chunk-reload:v1";

export type StaleChunkSignature =
  | "ChunkLoadError"
  | "Failed to fetch dynamically imported module"
  | "text/html is not a valid JavaScript MIME type"
  | "Unexpected token '<'";

const SIGNATURES: Array<{ signature: StaleChunkSignature; needle: string }> = [
  { signature: "ChunkLoadError", needle: "ChunkLoadError" },
  {
    signature: "Failed to fetch dynamically imported module",
    needle: "Failed to fetch dynamically imported module",
  },
  {
    signature: "text/html is not a valid JavaScript MIME type",
    needle: "text/html' is not a valid JavaScript MIME type",
  },
  { signature: "Unexpected token '<'", needle: "Unexpected token '<'" },
];

function getErrorMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function detectStaleChunkSignature(
  error: unknown,
): StaleChunkSignature | null {
  const msg = getErrorMessage(error);
  for (const s of SIGNATURES) {
    if (msg.includes(s.needle)) return s.signature;
  }
  return null;
}

/**
 * If the error looks like a stale deployment chunk, reload once per session.
 * Returns the matched signature if a reload was triggered.
 */
export function reloadOnceOnStaleChunk(
  error: unknown,
): StaleChunkSignature | null {
  if (typeof window === "undefined") return null;

  const signature = detectStaleChunkSignature(error);
  if (!signature) return null;

  try {
    if (window.sessionStorage.getItem(STALE_CHUNK_SESSION_KEY) === "1") {
      return null;
    }
    window.sessionStorage.setItem(STALE_CHUNK_SESSION_KEY, "1");
  } catch {
    // If sessionStorage is unavailable, do not risk loops.
    return null;
  }

  window.location.reload();
  return signature;
}

