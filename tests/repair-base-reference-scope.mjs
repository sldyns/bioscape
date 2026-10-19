import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import current from "../src/processes/modules/genome/dnaRepairProcess.js";
import reference from "./fixtures/process-cache-a-reference-ae697be/src/processes/modules/genome/dnaRepairProcess.js";
import {
  processCacheSnapshot,
  disposeCacheModel,
} from "./helpers/process-cache-snapshot.mjs";
import { createRefinementComparison } from "./helpers/process-refinement-20261015-cache.mjs";

// Keep the historical source and pose fixtures immutable. Only the three
// reviewed base instance buffers/bounds receive the S04 comparison adapter.
const fixtureDirectory = new URL(
  "./fixtures/process-cache-a-reference-ae697be/",
  import.meta.url,
);
const manifest = JSON.parse(
  await fs.readFile(new URL("manifest.json", fixtureDirectory), "utf8"),
);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const file of manifest.files)
  assert.equal(
    sha256(await fs.readFile(new URL(file.path, fixtureDirectory))),
    file.sha256,
  );
assert.equal(
  sha256(
    await fs.readFile(
      new URL(`../${manifest.historicalPoseFixture.path}`, import.meta.url),
    ),
  ),
  manifest.historicalPoseFixture.sha256,
);

let poses = 0,
  rejected = 0;
for (const rootId of ["cell", "plant", "yeast"]) {
  const model = current.create({ rootId }),
    old = reference.create({ rootId }),
    comparison = createRefinementComparison("dnaRepair", model, old);
  try {
    for (const incision of ["active", "blocked"])
      for (const progress of [0, 0.15, 0.2046, 0.31, 0.48, 0.6644, 0.8112, 1]) {
        model.update(progress, { incision });
        old.update(progress, { incision });
        const before = processCacheSnapshot(model);
        comparison.assert(`${rootId}/${incision}/${progress}`);
        assert.deepEqual(processCacheSnapshot(model), before);
        poses++;
      }
    model.update(0.31, { incision: "active" });
    old.update(0.31, { incision: "active" });
    const base = model.group.getObjectByName("damaged-strand-attached-bases"),
      patch = model.group.getObjectByName("repair-patch-attached-bases"),
      backbone = model.group.getObjectByName(
        "damaged-strand-sugar-phosphate-backbone",
      );
    const retained = processCacheSnapshot(model);
    const scalarMutation = (object, key, value) => () => {
      const saved = object[key];
      object[key] = value;
      return () => {
        object[key] = saved;
      };
    };
    const controls = [
      [
        "primitive",
        scalarMutation(base.geometry.attributes.position.array, 0, 42),
      ],
      ["material", scalarMutation(base.material, "opacity", 0.31)],
      ["visibility", scalarMutation(base, "visible", !base.visible)],
      ["transform", scalarMutation(base.position, "x", 2)],
      ["semantic data", scalarMutation(base.userData, "unexpected", true)],
      [
        "hidden base attachment",
        scalarMutation(patch.instanceMatrix.array, 12, 42),
      ],
      ["box", scalarMutation(base.boundingBox.min, "x", 42)],
      ["sphere", scalarMutation(base.boundingSphere, "radius", 0)],
      ["cross-section", scalarMutation(base.instanceMatrix.array, 0, 42)],
      ["affine row", scalarMutation(base.instanceMatrix.array, 15, 2)],
      ["finite matrix", scalarMutation(base.instanceMatrix.array, 4, NaN)],
      ["backbone", scalarMutation(backbone.instanceMatrix.array, 12, 42)],
    ];
    for (const [name, mutate] of controls) {
      const undo = mutate();
      const corrupted = processCacheSnapshot(model);
      try {
        assert.throws(
          () => comparison.assert(`${rootId} negative ${name}`),
          { name: "AssertionError" },
          `Adapter must reject ${name}`,
        );
        assert.deepEqual(processCacheSnapshot(model), corrupted);
        rejected++;
      } finally {
        undo();
        if (name === "semantic data") delete base.userData.unexpected;
      }
      assert.deepEqual(processCacheSnapshot(model), retained);
    }
  } finally {
    disposeCacheModel(model);
    disposeCacheModel(old);
  }
}
assert.equal(poses, 48);
assert.equal(rejected, 36);
console.log(
  `PASS: repair reference adapter: ${poses} restored snapshots, ${rejected} rejected corruptions; historical source and pose hashes unchanged.`,
);
