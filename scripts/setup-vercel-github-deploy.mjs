#!/usr/bin/env node
/**
 * One-time setup: wire GitHub Actions → Vercel production deploy.
 *
 * Usage (run locally, never commit tokens):
 *   $env:VERCEL_TOKEN="..."; $env:GITHUB_TOKEN="..."; node scripts/setup-vercel-github-deploy.mjs
 *
 * Creates GitHub secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
 * Then triggers a production deploy workflow.
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO ?? "kartik-singhhh03/servdco-saas";

if (!VERCEL_TOKEN || !GITHUB_TOKEN) {
  console.error(
    "Set VERCEL_TOKEN and GITHUB_TOKEN env vars.\n" +
      "VERCEL_TOKEN: https://vercel.com/account/tokens\n" +
      "GITHUB_TOKEN: GitHub → Settings → Developer settings → PAT (repo scope)",
  );
  process.exit(1);
}

async function vercel(path) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Vercel ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function github(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function encryptSecret(publicKey, secretValue) {
  const sodium = await import("node:crypto");
  const keyBytes = Buffer.from(publicKey, "base64");
  const valueBytes = Buffer.from(secretValue, "utf8");
  // GitHub libsodium sealed box — use tweetnacl if needed; fallback: GitHub CLI
  const { createPublicKey, publicEncrypt } = sodium;
  const key = createPublicKey({
    key: `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
    format: "pem",
  });
  const encrypted = publicEncrypt(
    { key, padding: sodium.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    valueBytes,
  );
  return encrypted.toString("base64");
}

async function setSecret(name, value) {
  const { key, key_id } = await github(`/repos/${REPO}/actions/secrets/public-key`);
  const encrypted = await encryptSecret(key, value);
  await github(`/repos/${REPO}/actions/secrets/${name}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted_value: encrypted, key_id }),
  });
  console.log(`✓ GitHub secret ${name} set`);
}

async function main() {
  const teams = await vercel("/v2/teams");
  const user = await vercel("/v2/user");
  const orgId = teams.teams?.[0]?.id ?? user.user.id;

  const projects = await vercel(`/v9/projects?teamId=${orgId}`);
  const project =
    projects.projects?.find((p) => p.name === "servdco" || p.name === "servdco-one") ??
    projects.projects?.find((p) =>
      p.targets?.production?.alias?.some?.((a) => a.includes("servdco")),
    );

  if (!project) {
    console.error("Could not find Vercel project 'servdco'. Projects:", projects.projects?.map((p) => p.name));
    process.exit(1);
  }

  console.log(`Vercel project: ${project.name} (${project.id})`);
  console.log(`Vercel org: ${orgId}`);

  await setSecret("VERCEL_TOKEN", VERCEL_TOKEN);
  await setSecret("VERCEL_ORG_ID", orgId);
  await setSecret("VERCEL_PROJECT_ID", project.id);

  await github(`/repos/${REPO}/actions/workflows/deploy-vercel.yml/dispatches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "main" }),
  });
  console.log("✓ Triggered deploy-vercel.yml on main");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
