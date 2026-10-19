import assert from "node:assert/strict";
import * as THREE from "three";
import { geometrySnapshot } from "./geometrySnapshot.test-support.mjs";

function smoothInterval(value, start, end) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function reviewedPoreScale(progress, parameters = {}) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const total = p * (parameters.osmotic === "mild" ? 1.05 : 1.42);
  const cycle = total >= 1 ? total - 1 : total;
  return {
    original: cycle >= 0.76 && cycle < 0.91 ? 1 : 0.74,
    current:
      0.74 +
      0.26 *
        smoothInterval(cycle, 0.74, 0.76) *
        (1 - smoothInterval(cycle, 0.91, 0.94)),
  };
}

function pore(model) {
  const matches = [];
  model.group.traverse((object) => {
    if (object.name === "contractile-vacuole-discharge-pore")
      matches.push(object);
  });
  assert.equal(matches.length, 1, "one reviewed discharge pore");
  return matches[0];
}

function assertActualPose(object, scale) {
  assert.deepEqual(object.scale.toArray(), [scale, scale, scale]);
  const local = new THREE.Matrix4().compose(
    object.position,
    object.quaternion,
    new THREE.Vector3(scale, scale, scale),
  );
  const world = new THREE.Matrix4().multiplyMatrices(
    object.parent.matrixWorld,
    local,
  );
  assert.deepEqual(object.matrix.elements, local.elements);
  assert.deepEqual(object.matrixWorld.elements, world.elements);
}

// Only the reviewed pore scale and its derived matrices are normalized.
// Validate the actual pose first; every other object field and all original
// buffers/materials/labels remain in the complete frozen snapshot comparison.
// The wrapper does not mutate the current scene or the historical reference.
export function assertVacuolePoreReview(
  current,
  original,
  progress,
  parameters,
) {
  current.parent.updateMatrixWorld(true);
  original.parent.updateMatrixWorld(true);
  const now = pore(current.model),
    before = pore(original.model),
    expected = reviewedPoreScale(progress, parameters);
  assertActualPose(now, expected.current);
  assertActualPose(before, expected.original);
  const reviewedGroup = {
    traverse(visitor) {
      current.model.group.traverse((object) => {
        visitor(
          object === now
            ? {
                ...object,
                scale: before.scale,
                matrix: before.matrix,
                matrixWorld: before.matrixWorld,
              }
            : object,
        );
      });
    },
  };
  assert.deepEqual(
    geometrySnapshot(
      { ...current.model, group: reviewedGroup },
      current.parent,
    ),
    geometrySnapshot(original.model, original.parent),
    "only the reviewed pore scale transition may differ from frozen output",
  );
}
