import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import division from "./plantDivisionProcess.js";
import wall from "./cellWallGrowthProcess.js";
import fertilization from "./doubleFertilizationProcess.js";
import hyphae from "./fungalHyphaeProcess.js";
const finite = (values, context) => {
  for (const value of values) assert.ok(Number.isFinite(value), context);
};
// Same full-buffer/material/transform snapshot as tests/processes.mjs.
// Includes unused buffer capacity: old larger frames must not leave stale data.
function snapshot(group) {
  group.updateMatrixWorld(true);
  const hash = createHash("sha256");
  const add = (value) => hash.update(JSON.stringify(value));
  const buffer = (array) =>
    hash.update(Buffer.from(array.buffer, array.byteOffset, array.byteLength));
  const seenGeometry = new Set(),
    seenMaterial = new Set();
  group.traverse((object) => {
    add([object.visible, object.matrix.elements, object.renderOrder]);
    finite(object.matrix.elements, "object transform");
    if (object.instanceMatrix) {
      finite(object.instanceMatrix.array, "instance transform");
      buffer(object.instanceMatrix.array);
    }
    if (object.instanceColor) buffer(object.instanceColor.array);
    const geometry = object.geometry;
    if (geometry && !seenGeometry.has(geometry)) {
      seenGeometry.add(geometry);
      add([geometry.drawRange.start, String(geometry.drawRange.count)]);
      const available =
        geometry.index?.count ?? geometry.attributes.position.count;
      assert.ok(geometry.drawRange.start >= 0, "negative draw range");
      assert.ok(
        geometry.drawRange.count === Infinity ||
          (geometry.drawRange.count >= 0 &&
            geometry.drawRange.start + geometry.drawRange.count <= available),
        "draw range exceeds geometry",
      );
      for (const [name, attribute] of Object.entries(geometry.attributes)) {
        finite(attribute.array, `geometry ${name}`);
        add(name);
        buffer(attribute.array);
      }
      if (geometry.index) buffer(geometry.index.array);
    }
    for (const material of [object.material].flat()) {
      if (!material || seenMaterial.has(material)) continue;
      seenMaterial.add(material);
      // Ignore version/UUID bookkeeping; include all rendered scalar/color state.
      const state = {};
      for (const key of Object.keys(material).sort()) {
        if (["id", "uuid", "version"].includes(key)) continue;
        const value = material[key];
        if (
          typeof value === "number" &&
          !(key === "attenuationDistance" && value === Infinity)
        )
          finite([value], `material ${key}`);
        if (["number", "boolean", "string"].includes(typeof value))
          state[key] = value;
        else if (value?.isColor) state[key] = value.toArray();
      }
      add(state);
    }
  });
  return hash.digest("hex");
}

for (const definition of [division, wall, fertilization, hyphae]) {
  const model = definition.create();
  const samples = [
    ...new Set([
      0,
      0.1,
      0.4,
      1,
      ...definition.stages.flatMap((stage, index) => [
        stage.at,
        Math.max(0, stage.at - 0.001),
        stage.at + 0.001,
        (stage.at + (definition.stages[index + 1]?.at ?? 1)) / 2,
      ]),
    ]),
  ];
  const reference = new Map();
  for (const progress of samples) {
    model.update(progress);
    reference.set(progress, snapshot(model.group));
  }
  for (const progress of [0, 0.4, 1, 0.1, 1, 0, ...samples.toReversed()]) {
    model.update(progress);
    assert.equal(
      snapshot(model.group),
      reference.get(progress),
      `${definition.id}: seek ${progress} does not reset exactly`,
    );
  }
  for (const [input, expected] of [
    [-1, 0],
    [2, 1],
    [NaN, 0],
  ]) {
    model.update(input);
    assert.equal(
      snapshot(model.group),
      reference.get(expected),
      `${definition.id}: input clamp ${input}`,
    );
  }
  const defaults = Object.fromEntries(
    (definition.controls ?? []).map((c) => [c.id, c.default]),
  );
  let scenarios = [defaults];
  for (const c of definition.controls ?? [])
    scenarios = scenarios.flatMap((s) =>
      c.options.map((o) => ({ ...s, [c.id]: o.value })),
    );
  for (const parameters of scenarios) {
    model.update(0.7, parameters);
    const expected = snapshot(model.group);
    model.update(0.2, parameters);
    model.update(0.7, parameters);
    assert.equal(
      snapshot(model.group),
      expected,
      `${definition.id}: condition seeking`,
    );
  }
  console.log(
    `${definition.id}: exact global sequence and full snapshot passed (${samples.length} reference states)`,
  );
}
