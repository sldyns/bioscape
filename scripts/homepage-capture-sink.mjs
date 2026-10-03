import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const outputDirectory =
  process.env.HOMEPAGE_CAPTURE_DIR || "/tmp/bioscape-home-capture";
await fs.mkdir(outputDirectory, { recursive: true });
const allowed = new Set(
  [
    "cell",
    "plant",
    "bacterium",
    "yeast",
    "paramecium",
    "phage",
    "erythrocyte",
    "neuron",
    "muscleFibre",
  ]
    .map((id) => `${id}.webp`)
    .concat("manifest.json"),
);
http
  .createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5174");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const name = req.url.slice(1);
    if (req.method !== "POST" || !allowed.has(name)) {
      res.writeHead(404);
      res.end();
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const location = path.join(outputDirectory, name);
    try {
      await fs.writeFile(path.resolve(location), Buffer.concat(chunks), {
        flag: "wx",
      });
      res.end("saved");
      console.log(location);
    } catch (error) {
      res.writeHead(409);
      res.end(String(error));
    }
  })
  .listen(5179, "127.0.0.1", () =>
    console.log("Homepage capture sink on 5179"),
  );
