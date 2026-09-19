import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { processCatalog } from "../src/processes/catalog.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");
assert(
  fs.existsSync(path.join(dist, "THIRD_PARTY_NOTICES.txt")),
  "Third-party notices must accompany the build",
);
assert(fs.existsSync(path.join(dist, "index.html")), "Run npm run build first");
const previews = JSON.parse(
  fs.readFileSync(path.join(root, "docs/process-rendered-previews.json")),
);
assert.equal(new Set(previews.map((entry) => entry.id)).size, previews.length);
for (const entry of Object.values(processCatalog)) {
  assert(
    previews.some((preview) => preview.id === entry.id),
    `Missing preview record: ${entry.id}`,
  );
  for (const asset of [entry.thumbnail, entry.renderedThumbnail]) {
    const file = path.join(dist, asset.replace(/^\//, ""));
    assert(
      fs.existsSync(file) && fs.statSync(file).size > 0,
      `Missing built asset: ${asset}`,
    );
  }
}
const files = fs
  .readdirSync(dist, { recursive: true })
  .filter((name) => fs.statSync(path.join(dist, name)).isFile());
for (const name of files) {
  assert(
    !/(?:^|[/\\])(?:\.env(?:\..*)?|.*\.(?:test|smoke)\.[cm]?js|process-preview\.html)$/.test(
      name,
    ),
    `Development file in build: ${name}`,
  );
  if (/\.(?:html|css)$/.test(name)) {
    const content = fs.readFileSync(path.join(dist, name), "utf8");
    assert(
      !/(?:["'=])\/(?:assets|process-thumbnails)\//.test(content),
      `Root-only asset path in ${name}`,
    );
  }
}
console.log(
  `Release assets: ${Object.keys(processCatalog).length} processes, ${files.length} built files; subdirectory paths and development-file exclusions PASS`,
);
