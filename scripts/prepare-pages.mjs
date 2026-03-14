import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const docsDir = path.join(rootDir, "docs");
const legacyEntryAliases = {
  js: ["index-aE-d4HV0.js", "index-CQgmyNDo.js"],
  css: ["index-DO6OSDAe.css", "index-IotI3Tla.css"],
};

await rm(docsDir, { recursive: true, force: true });
await mkdir(docsDir, { recursive: true });
await cp(distDir, docsDir, { recursive: true });
await cp(path.join(docsDir, "index.html"), path.join(docsDir, "404.html"));
await writeFile(path.join(docsDir, ".nojekyll"), "");

const html = await readFile(path.join(docsDir, "index.html"), "utf8");
const jsMatch = html.match(/\/vellor-food\/assets\/(index-[^"]+\.js)/);
const cssMatch = html.match(/\/vellor-food\/assets\/(index-[^"]+\.css)/);

if (jsMatch) {
  for (const alias of legacyEntryAliases.js) {
    if (alias !== jsMatch[1]) {
      await cp(path.join(docsDir, "assets", jsMatch[1]), path.join(docsDir, "assets", alias));
    }
  }
}

if (cssMatch) {
  for (const alias of legacyEntryAliases.css) {
    if (alias !== cssMatch[1]) {
      await cp(path.join(docsDir, "assets", cssMatch[1]), path.join(docsDir, "assets", alias));
    }
  }
}
