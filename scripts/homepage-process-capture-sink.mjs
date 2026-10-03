import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const outputDirectory = path.resolve(
  process.env.HOMEPAGE_PROCESS_CAPTURE_DIR || "/tmp/bioscape-process-motion",
);
await fs.mkdir(outputDirectory, { recursive: true });
const ids = ["transcription", "mitosis", "photosynthesis", "actionPotential"];
const allowed = new Set([
  "manifest.json",
  ...ids.flatMap((id) => [
    `${id}.webm`,
    `${id}.mp4`,
    ...["start", "middle", "end"].map((phase) => `${id}-${phase}.webp`),
  ]),
]);
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
    try {
      const chunks = [];
      let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 8e6) throw Error("Capture too large");
        chunks.push(chunk);
      }
      await fs.writeFile(
        path.join(outputDirectory, name),
        Buffer.concat(chunks),
        { flag: "wx" },
      );
      res.end("saved");
      console.log(name, length);
    } catch (error) {
      res.writeHead(409);
      res.end(String(error));
    }
  })
  .listen(5183, "127.0.0.1", () => console.log("Process motion sink on 5183"));
