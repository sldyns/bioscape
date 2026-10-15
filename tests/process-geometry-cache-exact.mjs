import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import {
  processCacheSnapshot,
  disposeCacheModel,
} from "./helpers/process-cache-snapshot.mjs";

import {
  createRefinementComparison,
  createCurrentStateGuard,
} from "./helpers/process-refinement-20261015-cache.mjs";
// Geometry-derived mechanism/attachment assertions remain mandatory alongside
// exact retained-subtree comparisons; these are the local owners' science gates.
await import("../src/processes/modules/bacterialCore/science.test.mjs");
await import("../src/processes/modules/chromatin/science.test.mjs");
await import("../src/processes/modules/chromatin/assemblyRefinement.test.mjs");
await import("../src/processes/modules/genome/science.test.mjs");
const covered = new Set();
const adapterCounts = {};
const referenceDirectory = new URL(
  "./fixtures/process-cache-a-reference-ae697be/",
  import.meta.url,
);
const manifest = JSON.parse(
  await fs.readFile(new URL("manifest.json", referenceDirectory), "utf8"),
);
assert.equal(manifest.sourceCommit, "ae697be5f252c1df58b34b57a6e9a8e1c014acf4");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sourcePaths = new Set(manifest.files.map((file) => file.path));
assert.equal(sourcePaths.size, 11);
assert.deepEqual(manifest.externalImports, ["three"]);
for (const file of manifest.files) {
  const source = await fs.readFile(new URL(file.path, referenceDirectory));
  assert.equal(source.length, file.bytes, `Frozen byte count: ${file.path}`);
  assert.equal(digest(source), file.sha256, `Frozen source: ${file.path}`);
  // Local imports must stay inside the immutable source closure.
  const imports = Array.from(
    source.toString("utf8").matchAll(/\bfrom\s+["']([^"']+)["']/g),
    (match) => match[1],
  );
  assert.deepEqual(imports, file.imports, `Frozen imports: ${file.path}`);
  for (const specifier of imports) {
    if (specifier.startsWith(".")) {
      const target = new URL(specifier, new URL(file.path, referenceDirectory));
      assert.ok(target.href.startsWith(referenceDirectory.href));
      assert.ok(
        sourcePaths.has(target.href.slice(referenceDirectory.href.length)),
        `Missing frozen dependency: ${file.path} -> ${specifier}`,
      );
    } else {
      assert.ok(manifest.externalImports.includes(specifier));
    }
  }
}
const fixtureBytes = await fs.readFile(
  new URL(`../${manifest.historicalPoseFixture.path}`, import.meta.url),
);
assert.equal(
  digest(fixtureBytes),
  manifest.historicalPoseFixture.sha256,
  "The original pose list and historical output hashes must remain unchanged",
);
const fixture = JSON.parse(fixtureBytes);
assert.equal(fixture.sourceCommit, "ae697be");
assert.equal(
  fixture.rows.reduce((count, row) => count + row.poses.length, 0),
  862,
);
assert.deepEqual(
  [...new Set(fixture.rows.map((row) => row.file))],
  manifest.entrypoints,
);
let poses = 0;
for (const row of fixture.rows) {
  const definition = (await import(new URL(`../${row.file}`, import.meta.url)))
    .default;
  const referenceDefinition = (
    await import(new URL(row.file, referenceDirectory))
  ).default;
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
  const comparison = createRefinementComparison(row.id, model, reference);
  const guard = createCurrentStateGuard(model);
  if (comparison) covered.add(row.id);
  const parameters = {};
  const referenceParameters = {};
  try {
    for (const pose of row.poses) {
      // Reuse a mutable parameter object to catch caches keyed by identity.
      Object.assign(parameters, pose.parameters);
      Object.assign(referenceParameters, pose.parameters);
      for (let repeat = 0; repeat < 2; repeat++) {
        model.update(pose.progress, parameters);
        reference.update(pose.progress, referenceParameters);
        if (comparison) comparison.assert(`${row.id} p=${pose.progress}`);
        else
          assert.deepEqual(
            processCacheSnapshot(model),
            processCacheSnapshot(reference),
            `${row.id}/${row.rootId} p=${pose.progress} ${JSON.stringify(parameters)} repeat=${repeat}`,
          );
        guard.pose(pose.progress, parameters, `${row.id} p=${pose.progress}`);
        if (comparison)
          adapterCounts[row.id] = (adapterCounts[row.id] ?? 0) + 1;
        poses++;
      }
    }
  } finally {
    disposeCacheModel(model);
    disposeCacheModel(reference);
  }
}
assert.equal(poses, 1724);
assert.deepEqual(
  [...covered].sort(),
  ["bacterialDivision", "chromatinAccess", "dnaRepair", "tad"].sort(),
);
console.log(
  `PASS: ${poses} comparisons retain immutable ae697be unchanged subtrees and scientific art adapters; all current models pass repeated/reverse seeks and exact resource identities.`,
);

console.log(JSON.stringify({ adapterCounts }));
