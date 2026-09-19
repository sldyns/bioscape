import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "third-party-notices",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "THIRD_PARTY_NOTICES.txt",
          source: readFileSync(
            new URL("./THIRD_PARTY_NOTICES.md", import.meta.url),
            "utf8",
          ),
        });
      },
    },
  ],
  worker: { format: "es" },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/build/three.core.js"))
            return "three-core";
          if (id.includes("/node_modules/three/")) return "three-renderer";
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id))
            return "react";
        },
      },
    },
  },
});
