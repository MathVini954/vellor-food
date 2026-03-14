import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(function (_a) {
    var _b, _c;
    var command = _a.command, mode = _a.mode;
    var env = loadEnv(mode, ".", "");
    var explicitBasePath = (_b = env.VITE_APP_BASE_PATH) === null || _b === void 0 ? void 0 : _b.trim();
    var explicitOutDir = (_c = env.VITE_BUILD_OUT_DIR) === null || _c === void 0 ? void 0 : _c.trim();
    return {
        plugins: [react()],
        base: explicitBasePath || (command === "build" ? "/vellor-food/" : "/"),
        build: {
            outDir: explicitOutDir || "dist",
            emptyOutDir: true,
        },
    };
});
