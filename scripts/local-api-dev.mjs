/**
 * Local HTTP server for Vercel API routes (no Vercel CLI login required).
 * Preserves raw request bodies for Stripe webhook signature verification.
 */
import http from "node:http";
import { Readable } from "node:stream";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

applyEnvLocal();
const { env, path: envPath } = loadEnvLocal();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const listen = process.argv.includes("--listen")
  ? process.argv[process.argv.indexOf("--listen") + 1]
  : "3000";

const routes = {
  "GET /api/health": "api/health.ts",
  "POST /api/stripe/webhook": "api/stripe/webhook.ts",
  "POST /api/stripe/connect/onboarding": "api/stripe/connect/onboarding.ts",
  "POST /api/stripe/create-checkout-session": "api/stripe/create-checkout-session.ts",
  "POST /api/stripe/subscription/checkout-session":
    "api/stripe/subscription/checkout-session.ts",
  "POST /api/stripe/tips/create-checkout-session":
    "api/stripe/tips/create-checkout-session.ts",
  "POST /api/stripe/refund": "api/stripe/refund.ts",
  "GET /api/stripe/transfers/process": "api/stripe/transfers/process.ts",
  "POST /api/stripe/transfers/process": "api/stripe/transfers/process.ts",
};

const handlerCache = new Map();

async function loadHandler(relPath) {
  if (handlerCache.has(relPath)) return handlerCache.get(relPath);
  const mod = await import(pathToFileURL(resolve(root, relPath)).href);
  const handler = mod.default;
  handlerCache.set(relPath, handler);
  return handler;
}

function parseQuery(url) {
  const idx = url.indexOf("?");
  if (idx === -1) return {};
  const out = {};
  for (const part of url.slice(idx + 1).split("&")) {
    const [k, v = ""] = part.split("=");
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolveBody(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function wrapResponse(nodeRes) {
  nodeRes.status = function status(code) {
    this.statusCode = code;
    return this;
  };
  nodeRes.json = function jsonBody(obj) {
    if (!this.headersSent) {
      this.setHeader("Content-Type", "application/json");
    }
    this.end(JSON.stringify(obj));
    return this;
  };
  return nodeRes;
}

function buildRequest(nodeReq, bodyBuffer, pathname, rawBody) {
  const stream = Readable.from(bodyBuffer);
  let body = bodyBuffer;
  if (!rawBody) {
    const contentType = nodeReq.headers["content-type"] ?? "";
    if (contentType.includes("application/json") && bodyBuffer.length > 0) {
      try {
        body = JSON.parse(bodyBuffer.toString("utf8"));
      } catch {
        body = {};
      }
    } else if (bodyBuffer.length === 0) {
      body = {};
    }
  }
  Object.assign(stream, {
    method: nodeReq.method,
    url: nodeReq.url,
    headers: nodeReq.headers,
    query: parseQuery(nodeReq.url ?? ""),
    body,
    socket: nodeReq.socket,
  });
  return stream;
}

const server = http.createServer(async (nodeReq, nodeRes) => {
  const url = new URL(nodeReq.url ?? "/", `http://127.0.0.1:${listen}`);
  const pathname = url.pathname;
  const key = `${nodeReq.method} ${pathname}`;
  const rel = routes[key];

  wrapResponse(nodeRes);

  if (!rel) {
    nodeRes.status(404).json({ error: "Not found", route: pathname });
    return;
  }

  try {
    const bodyBuffer = await readBody(nodeReq);
    const handler = await loadHandler(rel);
    const rawBody = pathname === "/api/stripe/webhook";
    const req = buildRequest(nodeReq, bodyBuffer, pathname, rawBody);
    await handler(req, nodeRes);
    if (!nodeRes.writableEnded) {
      nodeRes.status(500).json({ error: "Handler did not send a response." });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (!nodeRes.writableEnded) {
      nodeRes.status(500).json({ error: message });
    }
  }
});

server.listen(Number(listen), () => {
  console.log(`[local-api-dev] Loaded ${Object.keys(env).length} keys from ${envPath}`);
  console.log(`[local-api-dev] Listening on http://127.0.0.1:${listen}`);
});
