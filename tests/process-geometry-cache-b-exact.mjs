import assert from "node:assert/strict";
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
let poses = 0;
for (const row of fixture.rows) {
  const definition = (await import(new URL(`../${row.file}`, import.meta.url)))
    .default;
  const model = definition.create({ rootId: row.rootId });
  const parameters = {};
  try {
    for (const pose of row.poses) {
      Object.assign(parameters, pose.parameters);
      for (let repeat = 0; repeat < 2; repeat++) {
        model.update(pose.progress, parameters);
        assert.deepEqual(
          processCacheSnapshot(model),
          pose.expected,
          `${row.id} p=${pose.progress} ${JSON.stringify(parameters)} repeat=${repeat}`,
        );
        poses++;
      }
    }
  } finally {
    disposeCacheModel(model);
  }
}
console.log(
  `PASS: ${poses} B-group full process snapshots exactly match ae697be, including repeated poses, parameter changes and reverse seeks.`,
);
