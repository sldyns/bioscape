import * as THREE from "three";
import fs from "node:fs";
import assert from "node:assert/strict";
import currentDefinition from "../src/processes/modules/parameciumLife/contractileVacuoleProcess.js";
import {
  setupSnapshot,
  disposeSnapshot,
  frozenDefinitions,
} from "../src/processes/modules/parameciumLife/geometrySnapshot.test-support.mjs";
import { assertVacuolePoreReview } from "../src/processes/modules/parameciumLife/vacuolePoreReview.test-support.mjs";
const directory = new URL(
  "../src/processes/modules/parameciumLife/",
  import.meta.url,
);
const referenceBytes = fs.readFileSync(
    new URL("geometry-reference.json", directory),
  ),
  reference = JSON.parse(referenceBytes),
  definitions = await frozenDefinitions(reference, referenceBytes);
const result = {
  historicalPositive: 0,
  edgePositive: 0,
  negativeControls: [],
  continuityPairs: 0,
};
for (const row of reference.cases.filter(
  (row) => row.id === "contractileVacuole",
)) {
  const original = setupSnapshot(definitions.get(row.id), row.transformed),
    current = setupSnapshot(currentDefinition, row.transformed);
  const positive = (p) => {
    for (const scene of [original, current])
      scene.model.update(p, row.parameters);
    assertVacuolePoreReview(current, original, p, row.parameters);
  };
  for (const state of row.states) {
    positive(state.progress);
    result.historicalPositive++;
  }
  const speed = row.parameters.osmotic === "mild" ? 1.05 : 1.42;
  for (const boundary of [0.74, 0.76, 0.91, 0.94, 1])
    for (const e of [-1e-9, 0, 1e-9]) {
      positive((boundary + e) / speed);
      result.edgePositive++;
    }
  const p = 0.75 / speed;
  positive(p);
  const target = current.model.group.getObjectByName(
    "contractile-vacuole-discharge-pore",
  );
  const check = () =>
    assertVacuolePoreReview(current, original, p, row.parameters);
  const corrupt = (name, change, restore) => {
    change();
    try {
      assert.throws(check, undefined, name);
      result.negativeControls.push({
        osmotic: row.parameters.osmotic,
        transformed: row.transformed,
        name,
      });
    } finally {
      restore();
    }
    check();
  };
  const scale = target.scale.x;
  corrupt(
    "reviewed-scale",
    () => (target.scale.x += 0.001),
    () => (target.scale.x = scale),
  );
  const x = target.position.x;
  corrupt(
    "unreviewed-position",
    () => (target.position.x += 0.001),
    () => (target.position.x = x),
  );
  const quaternion = target.quaternion.clone();
  corrupt(
    "unreviewed-quaternion",
    () => (target.quaternion.x += 0.001),
    () => target.quaternion.copy(quaternion),
  );
  const material = target.material,
    opacity = material.opacity;
  corrupt(
    "opacity",
    () => (material.opacity -= 0.001),
    () => (material.opacity = opacity),
  );
  const color = material.color.clone();
  corrupt(
    "color",
    () => (material.color.r += 0.001),
    () => material.color.copy(color),
  );
  const positions = target.geometry.attributes.position.array,
    vertex = positions[0];
  corrupt(
    "vertex",
    () => (positions[0] += 0.001),
    () => (positions[0] = vertex),
  );
  const indices = target.geometry.index.array,
    index = indices[0];
  corrupt(
    "index",
    () =>
      (indices[0] = (index + 1) % target.geometry.attributes.position.count),
    () => (indices[0] = index),
  );
  const count = target.geometry.drawRange.count;
  corrupt(
    "draw-range",
    () => (target.geometry.drawRange.count = 3),
    () => (target.geometry.drawRange.count = count),
  );
  const other = current.model.group.children.find(
      (object) => object !== target,
    ),
    visible = other.visible;
  corrupt(
    "other-visibility",
    () => (other.visible = !visible),
    () => (other.visible = visible),
  );
  const poreVisible = target.visible;
  corrupt(
    "pore-visibility",
    () => (target.visible = !poreVisible),
    () => (target.visible = poreVisible),
  );
  const label = current.model.labels[0].position,
    lx = label[0];
  corrupt(
    "label",
    () => (label[0] += 0.001),
    () => (label[0] = lx),
  );
  corrupt(
    "metadata",
    () => (current.model.group.userData.reviewMutation = true),
    () => delete current.model.group.userData.reviewMutation,
  );
  const parentX = current.parent.position.x;
  corrupt(
    "parent-transform",
    () => (current.parent.position.x += 0.001),
    () => (current.parent.position.x = parentX),
  );
  const name = target.name;
  corrupt(
    "reviewed-object-identity",
    () => (target.name = "incorrect-pore"),
    () => (target.name = name),
  );
  // Measure actual transformed vertices, not just the interpolation value.
  const worldVertices = (progress) => {
    current.model.update(progress, row.parameters);
    current.parent.updateMatrixWorld(true);
    const attribute = target.geometry.attributes.position;
    return Array.from({ length: attribute.count }, (_, index) =>
      new THREE.Vector3()
        .fromBufferAttribute(attribute, index)
        .applyMatrix4(target.matrixWorld),
    );
  };
  for (const boundary of [0.74, 0.76, 0.91, 0.94, 1]) {
    for (const direction of [1, -1]) {
      const steps = [];
      for (const epsilon of [1e-3, 1e-6, 1e-9]) {
        const a = worldVertices((boundary - direction * epsilon) / speed);
        const b = worldVertices((boundary + direction * epsilon) / speed);
        const displacement = Math.max(
          ...a.map((point, index) => point.distanceTo(b[index])),
        );
        assert(Number.isFinite(displacement));
        steps.push(displacement);
        result.continuityPairs++;
      }
      assert(
        steps[1] <= steps[0] * 1e-4 + 1e-14,
        "world-vertex displacement converges at the boundary",
      );
      assert(steps[2] < 1e-12, "no finite pore jump at a vanishing time step");
    }
  }
  disposeSnapshot(original.model);
  disposeSnapshot(current.model);
}
assert.equal(result.historicalPositive, 72);
assert.equal(result.edgePositive, 60);
assert.equal(result.negativeControls.length, 56);
assert.equal(result.continuityPairs, 120);
console.log(
  `PASS: vacuole pore: ${result.historicalPositive + result.edgePositive} frozen-scope states, ${result.continuityPairs} actual-vertex continuity pairs, ${result.negativeControls.length} rejected corruptions; immutable historical source/pose hashes verified.`,
);
