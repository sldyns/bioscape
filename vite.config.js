import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
const releaseNotices = {
  "LICENSE.txt": "LICENSE",
  "NOTICE.txt": "NOTICE",
  "THIRD_PARTY_NOTICES.txt": "THIRD_PARTY_NOTICES.md",
};
const noticeText = (file) =>
  readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "release-notices",
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
