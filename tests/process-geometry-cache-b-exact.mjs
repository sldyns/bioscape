import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import {
  processCacheSnapshot,
  disposeCacheModel,
} from "./helpers/process-cache-snapshot.mjs";
import { createStomataScientificCacheComparison } from "./helpers/stomata-scientific-cache-delta.mjs";

import {
  createRefinementComparison,
  createCurrentStateGuard,
} from "./helpers/process-refinement-20261015-cache.mjs";
await import("../src/processes/modules/membrane/cutaway-thickness.test.mjs");
const covered = new Set();
const adapterCounts = {};
const fixtureBytes = await fs.readFile(
  new URL("./fixtures/process-geometry-cache-b-ae697be.json", import.meta.url),
);
assert.equal(
  createHash("sha256").update(fixtureBytes).digest("hex"),
  "387cb30abae96bd746cab6d61aa28d1693697b0eca3d9ec7dff4a40a18b633cd",
  "retain immutable original B pose fixture",
);
const fixture = JSON.parse(fixtureBytes);
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
  const constructedAgain = definition.create({ rootId: row.rootId });
  assert.deepEqual(
    processCacheSnapshot(model),
    processCacheSnapshot(constructedAgain),
    `${row.id}: deterministic constructor`,
  );
  assert.deepEqual(model.camera, constructedAgain.camera);
  disposeCacheModel(constructedAgain);
  const scientificComparison =
    row.id === "stomata"
      ? createStomataScientificCacheComparison(model, reference)
      : createRefinementComparison(row.id, model, reference);
  if (scientificComparison) covered.add(row.id);
  const guard = createCurrentStateGuard(model);
  const scientificStates = new Map();
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
        const context = `${row.id} p=${pose.progress} ${JSON.stringify(parameters)} repeat=${repeat}`;
        if (scientificComparison) {
          scientificComparison.assert(context);
          const key = JSON.stringify([pose.progress, parameters]);
          const snapshot = processCacheSnapshot(model);
          if (scientificStates.has(key))
            assert.deepEqual(
              snapshot,
              scientificStates.get(key),
              `${context}: repaired pose is deterministic`,
            );
          else scientificStates.set(key, snapshot);
        } else
          assert.deepEqual(
            processCacheSnapshot(model),
            processCacheSnapshot(reference),
            context,
          );
        guard.pose(pose.progress, parameters, context);
        if (scientificComparison)
          adapterCounts[row.id] = (adapterCounts[row.id] ?? 0) + 1;
        poses++;
      }
    }
  } finally {
    scientificComparison?.dispose?.();
    disposeCacheModel(model);
    disposeCacheModel(reference);
  }
}
assert.deepEqual([...covered].sort(), ["osmoticBalance", "stomata"]);
assert.equal(poses, 756, "retain every original B-group comparison");
console.log(
  `PASS: ${poses} B-group comparisons retain immutable ae697be source and every pose. Unchanged models remain fully exact; stomata retains its narrow compartment repair adapter and osmoticBalance retains every old subtree plus an asserted cut face. All current poses pass whole-scene repeated/reverse seeks and exact resource identities.`,
);

console.log(JSON.stringify({ adapterCounts }));
