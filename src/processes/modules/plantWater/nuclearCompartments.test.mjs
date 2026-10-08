import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { createNuclearCompartmentProbe } from "../../../../tests/helpers/plant-water-nuclear-compartments.mjs";
import {
  processCacheSnapshot,
  disposeCacheModel,
} from "../../../../tests/helpers/process-cache-snapshot.mjs";

const definitions = await Promise.all([
  import(
    process.env.BIOSCAPE_PLASMOLYSIS_REVIEW_MODULE ?? "./plasmolysisProcess.js"
  ),
  import(process.env.BIOSCAPE_STOMATA_REVIEW_MODULE ?? "./stomataProcess.js"),
]);
const evidence = [];
for (const { default: definition } of definitions) {
  if (
    process.env.BIOSCAPE_WATER_REVIEW_ONLY &&
    definition.id !== process.env.BIOSCAPE_WATER_REVIEW_ONLY
  )
    continue;
  const model = definition.create({ rootId: "plant" });
  const probe = createNuclearCompartmentProbe(definition.id, model);
  const control = definition.controls[0];
  const identities = [];
  model.group.traverse((n) => identities.push([n, n.geometry, n.material]));
  const nuclei = probe.pairs.map((p) => p.nucleus);
  const nuclearBuffers = nuclei.map((n) =>
    createHash("sha256")
      .update(Buffer.from(n.geometry.attributes.position.array.buffer))
      .digest("hex"),
  );
  const expectedScale =
    definition.id === "stomata" ? [0.18, 0.25, 0.12] : [0.29, 0.45, 0.17];
  const row = { id: definition.id, conditions: [], keyframes: [] };
  const samples = [
    ...new Set([
      ...Array.from({ length: 201 }, (_, i) => i / 200),
      ...definition.stages.flatMap((s) => [
        Math.max(0, s.at - 1e-6),
        s.at,
        Math.min(1, s.at + 1e-6),
      ]),
    ]),
  ].sort((a, b) => a - b);
  for (const option of control.options) {
    const parameters = { [control.id]: option.value };
    for (const progress of samples) {
      model.update(progress, parameters);
      probe.assert(`${definition.id} ${option.value} p=${progress}`);
      for (const [i, nucleus] of nuclei.entries()) {
        assert.deepEqual(
          nucleus.scale.toArray(),
          expectedScale,
          "Preserve complete nuclear size",
        );
        assert.equal(
          createHash("sha256")
            .update(
              Buffer.from(nucleus.geometry.attributes.position.array.buffer),
            )
            .digest("hex"),
          nuclearBuffers[i],
        );
      }
    }
    row.conditions.push({
      value: option.value,
      sampledFrames: samples.length,
      nucleiPerFrame: nuclei.length,
      minimumCertifiedWorldClearance: 0.01,
    });
    for (const progress of [0, 0.3, 0.46, 0.7, 0.86, 1]) {
      model.update(progress, parameters);
      row.keyframes.push({
        parameters,
        progress,
        geometry: probe.inspect({ exactDistances: true }),
      });
    }
    model.update(0.735, parameters);
    const before = processCacheSnapshot(model);
    model.update(0.19, parameters);
    model.update(0.735, parameters);
    assert.deepEqual(
      processCacheSnapshot(model),
      before,
      "Reverse seek is deterministic",
    );
    model.update(0.95, {
      [control.id]: control.options.find((o) => o.value !== option.value).value,
    });
    model.update(0.735, parameters);
    assert.deepEqual(
      processCacheSnapshot(model),
      before,
      "Switching condition restores the exact pose",
    );
    for (const progress of [NaN, -1, 2]) {
      model.update(progress, parameters);
      probe.assert(`${definition.id} clamped ${progress}`);
    }
  }
  for (const [node, geometry, material] of identities) {
    assert.equal(node.geometry, geometry);
    assert.equal(node.material, material);
  }
  let nodeCount = 0;
  model.group.traverse(() => nodeCount++);
  assert.equal(nodeCount, identities.length);
  evidence.push(row);
  probe.dispose();
  disposeCacheModel(model);
}
if (process.env.BIOSCAPE_WATER_COMPARTMENT_EVIDENCE)
  writeFileSync(
    process.env.BIOSCAPE_WATER_COMPARTMENT_EVIDENCE,
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
console.log(
  "PASS VIS-PWG-01/02: whole nuclear triangle meshes stay inside complete cells, outside vacuoles, with >= 0.01 clearance across both conditions; original nuclear precision, deterministic seeks and stable resources preserved.",
);
