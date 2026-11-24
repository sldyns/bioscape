import { bufferPreparationHook } from "./scripts/rendererBufferPreparation.mjs";
import { defineConfig } from "vite";
import { readdirSync, readFileSync, unlinkSync } from "node:fs";
import { basename, join } from "node:path";
const releaseNotices = {
  "LICENSE.txt": "LICENSE",
  "NOTICE.txt": "docs/legal/NOTICE",
  "THIRD_PARTY_NOTICES.txt": "docs/legal/THIRD_PARTY_NOTICES.md",
  "MEDIABUNNY-MPL-2.0.txt": "docs/legal/MEDIABUNNY-MPL-2.0.txt",
};
const noticeText = (file) =>
  readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
export default defineConfig({
  base: "./",
  // Historical QA pages are not application dependency entries.
  optimizeDeps: { entries: ["index.html"] },
  plugins: [
    bufferPreparationHook(),
    {
      name: "release-files",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const name = (req.url ?? "").split("?")[0].slice(1);
          if (!Object.hasOwn(releaseNotices, name)) return next();
          const file = releaseNotices[name];
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(noticeText(file));
        });
      },
      generateBundle() {
        for (const [fileName, file] of Object.entries(releaseNotices)) {
          this.emitFile({ type: "asset", fileName, source: noticeText(file) });
        }
      },
      writeBundle({ dir }) {
        // Vite also copies Finder metadata when publishing public/ from a Mac.
        for (const file of readdirSync(dir, { recursive: true })) {
          if (basename(file) === ".DS_Store") unlinkSync(join(dir, file));
        }
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
