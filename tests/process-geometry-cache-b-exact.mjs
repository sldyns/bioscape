import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import {
  processCacheSnapshot,
  disposeCacheModel,
} from "./helpers/process-cache-snapshot.mjs";

const fixture = JSON.parse(
  await fs.readFile(
    new URL(
      "./fixtures/process-geometry-cache-b-ae697be.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
assert.equal(fixture.sourceCommit, "ae697be");
const referenceRoot = new URL(
  "./fixtures/process-cache-b-reference-ae697be/",
  import.meta.url,
);
const manifest = JSON.parse(
  await fs.readFile(new URL("manifest.json", referenceRoot), "utf8"),
);
assert.equal(manifest.sourceShortCommit, fixture.sourceCommit);
assert.equal(manifest.sourceCommit, "ae697be5f252c1df58b34b57a6e9a8e1c014acf4");
for (const file of manifest.files) {
  const source = await fs.readFile(new URL(file.path, referenceRoot));
  assert.equal(source.byteLength, file.bytes, `${file.path}: source length`);
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    file.sha256,
    `${file.path}: immutable ae697be source`,
  );
}
let poses = 0;
for (const row of fixture.rows) {
  const definition = (await import(new URL(`../${row.file}`, import.meta.url)))
    .default;
  const referenceDefinition = (await import(new URL(row.file, referenceRoot)))
    .default;
  const model = definition.create({ rootId: row.rootId });
  const reference = referenceDefinition.create({ rootId: row.rootId });
  const parameters = {},
    referenceParameters = {};
  try {
    for (const pose of row.poses) {
      Object.assign(parameters, pose.parameters);
      Object.assign(referenceParameters, pose.parameters);
      for (let repeat = 0; repeat < 2; repeat++) {
        model.update(pose.progress, parameters);
        reference.update(pose.progress, referenceParameters);
        // The historical golden hashes are retained as evidence. The oracle
        // executes immutable ae697be source in this same runtime, preserving
        // exact checks without importing another platform's transcendental bits.
        assert.deepEqual(
          processCacheSnapshot(model),
          processCacheSnapshot(reference),
          `${row.id} p=${pose.progress} ${JSON.stringify(parameters)} repeat=${repeat}`,
        );
        poses++;
      }
    }
  } finally {
    disposeCacheModel(model);
    disposeCacheModel(reference);
  }
}
assert.equal(poses, 756, "retain every original B-group comparison");
console.log(
  `PASS: ${poses} B-group full process snapshots exactly match immutable ae697be source in the same runtime, including repeated poses, parameter changes and reverse seeks.`,
);
