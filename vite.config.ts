import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, ".", "");
  const explicitBasePath = env.VITE_APP_BASE_PATH?.trim();
  const explicitOutDir = env.VITE_BUILD_OUT_DIR?.trim();

  return {
    plugins: [react()],
    base: explicitBasePath || (command === "build" ? "/vellor-food/" : "/"),
    build: {
      outDir: explicitOutDir || "dist",
      emptyOutDir: true,
    },
  };
});
