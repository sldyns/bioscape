// Local-only production desk. Nothing here is included in the application build.
import { createServer } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import config from "../../vite.config.js";
const output = resolve(
  process.env.BIOSCAPE_MEDIA_OUTPUT || "/tmp/bioscape-media",
);
await mkdir(output, { recursive: true });
const server = await createServer({
  ...config,
  configFile: false,
  server: { host: "127.0.0.1", port: 5174, strictPort: true },
  plugins: [
    ...config.plugins,
    {
      name: "local-media-export",
      configureServer(server) {
        server.middlewares.use("/__media", async (req, res, next) => {
          if (req.method !== "POST") return next();
          const name = req.url.slice(1).split("?")[0];
          if (!/^[a-z0-9-]+\.(jpg|png|json)$/.test(name)) {
            res.statusCode = 400;
            res.end();
            return;
          }
          const chunks = [];
          let size = 0;
          try {
            for await (const chunk of req) {
              size += chunk.length;
              if (size > 150 * 1024 * 1024) throw new Error("Export too large");
              chunks.push(chunk);
            }
            await writeFile(resolve(output, name), Buffer.concat(chunks));
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ saved: name, bytes: size }));
          } catch (error) {
            res.statusCode = 500;
            res.end(error.message);
          }
        });
      },
    },
  ],
});
await server.listen();
console.log(
  `Media studio: http://127.0.0.1:5174/scripts/media/studio.html\nOutput: ${output}`,
);
