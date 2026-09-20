import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { processCatalog } from "../src/processes/catalog.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");
for (const [built, source] of Object.entries({
  "LICENSE.txt": "LICENSE",
  "NOTICE.txt": "docs/legal/NOTICE",
  "THIRD_PARTY_NOTICES.txt": "docs/legal/THIRD_PARTY_NOTICES.md",
})) {
  assert.equal(
    fs.readFileSync(path.join(dist, built), "utf8"),
    fs.readFileSync(path.join(root, source), "utf8"),
    `${built} must accompany the build without alteration`,
  );
}
assert(fs.existsSync(path.join(dist, "index.html")), "Run npm run build first");
// Each localized README and film page must ship the matching final edition.
const films = JSON.parse(
  fs.readFileSync(path.join(root, "docs/media/films.json"), "utf8"),
);
assert.deepEqual(films.map((film) => film.language).sort(), ["en", "zh"]);
for (const film of films) {
  const bytes = fs.readFileSync(
    path.join(dist, film.file.replace(/^public\//, "")),
  );
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    film.sha256,
    `Film manifest mismatch: ${film.language}`,
  );
  const readme = fs.readFileSync(
    path.join(root, film.language === "en" ? "README.md" : "README.zh-CN.md"),
    "utf8",
  );
  assert(
    readme.includes(`\n${film.attachment}\n`),
    `Missing native video: ${film.language}`,
  );
  assert(readme.includes(`docs/media/${film.language}/structures.jpg`));
  assert(readme.includes(`docs/media/${film.language}/transcription.jpg`));
  for (const asset of [
    `media/cover-${film.language}.jpg`,
    `media/film.${film.language}.vtt`,
  ])
    assert(
      fs.statSync(path.join(dist, asset)).size > 0,
      `Missing film asset: ${asset}`,
    );
}
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
  assert(!/^scripts[/\\]/.test(name), `Development studio in build: ${name}`);
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
