import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const buildCommand = process.platform === "win32" ? "npm.cmd run build" : "npm run build";

execSync(buildCommand, {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    VITE_APP_BASE_PATH: "/vellor-food/",
  },
});

execSync("node scripts/prepare-pages.mjs", {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});
