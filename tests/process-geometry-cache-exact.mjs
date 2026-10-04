import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  processCacheSnapshot,
  disposeCacheModel,
} from "./helpers/process-cache-snapshot.mjs";

const fixture = JSON.parse(
  await fs.readFile(
    new URL("./fixtures/process-geometry-cache-ae697be.json", import.meta.url),
    "utf8",
  ),
);
assert.equal(fixture.sourceCommit, "ae697be");
let poses = 0;
for (const row of fixture.rows) {
  const definition = (await import(new URL(`../${row.file}`, import.meta.url)))
    .default;
  const model = definition.create({ rootId: row.rootId });
  const parameters = {};
  try {
    for (const pose of row.poses) {
      // Reuse a mutable parameter object to catch caches keyed by identity.
      Object.assign(parameters, pose.parameters);
      for (let repeat = 0; repeat < 2; repeat++) {
        model.update(pose.progress, parameters);
        assert.deepEqual(
          processCacheSnapshot(model),
          pose.expected,
          `${row.id}/${row.rootId} p=${pose.progress} ${JSON.stringify(parameters)} repeat=${repeat}`,
        );
        poses++;
      }
    }
  } finally {
    disposeCacheModel(model);
  }
}
console.log(
  `PASS: ${poses} full process snapshots match ae697be, including repeated poses and condition changes.`,
);
