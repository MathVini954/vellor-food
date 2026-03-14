import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const targetDir = path.join(rootDir, "public-app", "public", "admin");
const buildCommand = process.platform === "win32" ? "npm.cmd run build" : "npm run build";

execSync(buildCommand, {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    VITE_APP_BASE_PATH: "/admin/",
    VITE_BUILD_OUT_DIR: targetDir,
  },
});
