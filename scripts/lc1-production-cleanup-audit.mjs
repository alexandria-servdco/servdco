/**
 * LC-1 Section 8 — production cleanup audit (no file mutations).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function rg(pattern, glob, dir) {
  try {
    const out = execSync(
      `rg -n "${pattern}" ${glob ? `-g "${glob}"` : ""} "${dir}"`,
      { encoding: "utf8", cwd: root },
    );
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

const clientConsoleLog = rg("console\\.log\\(", "*.tsx", "client");
const clientConsoleLogTs = rg("console\\.log\\(", "*.ts", "client");
const apiConsoleLog = rg("console\\.log\\(", "*.ts", "api");
const todos = [
  ...rg("TODO|FIXME", "*.ts", "client"),
  ...rg("TODO|FIXME", "*.tsx", "client"),
  ...rg("TODO|FIXME", "*.ts", "api"),
];
const mockFiles = execSync('dir /s /b client\\*mock* 2>nul', {
  encoding: "utf8",
  cwd: root,
  shell: true,
})
  .trim()
  .split("\n")
  .filter(Boolean);

const deadRouteCandidates = [];
const appRoutes = fs
  .readFileSync(path.join(root, "client/App.tsx"), "utf8")
  .match(/path="([^"]+)"/g)
  ?.map((m) => m.replace(/path="/, "").replace('"', "")) ?? [];

const report = {
  timestamp: new Date().toISOString(),
  clientConsoleLog: [...clientConsoleLog, ...clientConsoleLogTs],
  apiConsoleLog,
  todos,
  mockFilePaths: mockFiles,
  registeredRoutes: appRoutes,
  seedUtilities: [
    "supabase/scripts/run-dev-chefs-seed.mjs",
    "supabase/scripts/run-cloud-seed.mjs",
    "pnpm seed:dev-chefs",
  ],
  authServiceMockUser: rg("mock-user|mockRole", "*.ts", "client/services/auth.service.ts"),
  summary: {
    clientConsoleLogCount: clientConsoleLog.length + clientConsoleLogTs.length,
    apiConsoleLogCount: apiConsoleLog.length,
    todoCount: todos.length,
    mockFileCount: mockFiles.length,
  },
  verdict:
    clientConsoleLog.length + clientConsoleLogTs.length === 0 &&
    apiConsoleLog.length === 0 &&
    todos.length === 0
      ? "PASS"
      : "WARN",
};

const outPath = path.join(__dirname, "lc1-production-cleanup-audit.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
