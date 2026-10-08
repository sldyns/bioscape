import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const temporary = await mkdtemp(join(tmpdir(), "bioscape-plant-label-review-"));
try {
  const outfile = join(temporary, "presentation.mjs");
  await build({
    stdin: {
      contents:
        'export { plantWallDetail } from "./src/scene/plantWallDetails.js"; export { plantDefinitions } from "./src/catalog/cellTypes.js"; export { detailModel } from "./src/scene/detailModels.js"; export { makePresentation } from "./src/scene/presentation.js";',
      resolveDir: fileURLToPath(new URL("..", import.meta.url)),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const { plantWallDetail, plantDefinitions, detailModel, makePresentation } =
    await import(pathToFileURL(outfile));

  const definitions = new Map(plantDefinitions.map((d) => [d[0], d]));
  const ids = definitions.get("cellWall")[6];
  const wall = plantWallDetail("cellWall");
  wall.updateMatrixWorld(true);
  const hash = createHash("sha256");
  let meshes = 0;
  wall.traverse((mesh) => {
    if (!mesh.isMesh) return;
    meshes++;
    hash.update(
      JSON.stringify([
        mesh.userData,
        mesh.matrixWorld.elements,
        mesh.material.color.getHexString(),
      ]),
    );
    for (const attr of Object.values(mesh.geometry.attributes))
      hash.update(
        new Uint8Array(
          attr.array.buffer,
          attr.array.byteOffset,
          attr.array.byteLength,
        ),
      );
    const index = mesh.geometry.index;
    hash.update(
      new Uint8Array(
        index.array.buffer,
        index.array.byteOffset,
        index.array.byteLength,
      ),
    );
  });
  const landmarks = wall.userData.landmarks ?? [];
  const duplicates = [];
  for (const [lang, column] of [
    ["zh", 1],
    ["en", 2],
  ]) {
    const seen = new Set();
    for (const text of [
      ...ids.map((id) => definitions.get(id)[column]),
      ...landmarks.map((l) => l[lang]),
    ]) {
      if (seen.has(text)) duplicates.push({ lang, text });
      seen.add(text);
    }
  }
  console.log(
    JSON.stringify({
      meshes,
      geometrySHA256: hash.digest("hex"),
      duplicates,
      partAnchorIds: Object.keys(wall.userData.partAnchors),
    }),
  );
  assert.deepEqual(
    duplicates,
    [],
    "Do not duplicate a drill-down label with a same-named landmark",
  );
  assert.deepEqual(
    Object.keys(wall.userData.partAnchors).sort(),
    [...ids].sort(),
  );
  const view = makePresentation(
    null,
    "cellWall",
    detailModel("cellWall", wall),
  );
  for (const id of ids) {
    const part = view.parts.find((p) => p.userData.hitId === id);
    assert(
      part?.children.length,
      `Retain visible drill-down geometry for ${id}`,
    );
    assert(part.userData.labelAnchor.toArray().every(Number.isFinite));
  }
  assert.equal(view.landmarks.length, 0);
  view.root.traverse((mesh) => {
    mesh.geometry?.dispose();
    mesh.material?.dispose();
  });
  console.log(
    "Cell-wall labels are unique; all three drill-down parts and anchors remain available.",
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
