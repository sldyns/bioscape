import assert from "node:assert/strict";
import * as THREE from "three";
import division from "./plantDivisionProcess.js";
import { mergeSamplingPlanes } from "./membraneLattice.js";
import { disposeScene } from "../../disposeScene.js";

const base = new Float32Array([-2.56, -2.3, 0, 2.3, 2.56]);
const target = new Float32Array(7),
  buffer = target.buffer;
assert.equal(
  mergeSamplingPlanes(base, [2.33, -2.33, 2.33, 9, -9], 5, target),
  6,
);
for (const coordinate of base) assert(target.includes(coordinate));
assert.equal(target.buffer, buffer);
assert.deepEqual(
  Array.from(base),
  Array.from(new Float32Array([-2.56, -2.3, 0, 2.3, 2.56])),
);
assert.throws(
  () => mergeSamplingPlanes(base, [0.2], 1, new Float32Array(5)),
  /capacity exceeded/,
);
for (const invalid of [NaN, Infinity, -Infinity])
  assert.throws(
    () => mergeSamplingPlanes(base, [invalid], 1, target),
    /finite/,
  );
const zeroBase = new Float32Array([-1, -0, 0.125, 1]);
assert.equal(
  mergeSamplingPlanes(zeroBase, [-1e-50, 0.125 + 1e-12], 2, target),
  3,
);
assert(Object.is(target[1], -0), "original signed-zero sample is retained");

const model = division.create();
let membrane;
const vesicles = [];
model.group.traverse((object) => {
  if (
    object.name === "Continuous cell-plate lumen membrane and parental junction"
  )
    membrane = object;
  if (object.name === "Closed incoming cell-plate vesicle")
    vesicles.push(object);
});
assert(membrane && vesicles.length === 48);
const geometry = membrane.geometry,
  positions = geometry.attributes.position.array,
  normals = geometry.attributes.normal.array;
try {
  // In these states the plate has a genuine gap to the parent. Hidden incoming
  // vesicles are contained by radius .11 around their public mesh centers:
  // settling moves their center inward by at most .11 while radius shrinks.
  // Prove they cannot fill the inspected corridor, independently of extraction.
  for (const progress of [0.8325, 0.84, 0.85, 0.86]) {
    model.update(progress);
    model.group.updateMatrixWorld(true);
    const radius = model.group.userData.cellPlateHalfWidth,
      middle = (radius + 2.36) / 2;
    assert(radius < 2.36 - 1e-5);
    for (const vesicle of vesicles.filter((v) => !v.visible))
      assert(
        Math.abs(vesicle.position.x) + 0.11 <= radius ||
          Math.abs(vesicle.position.y) > 0.11 + 0.03 ||
          Math.abs(vesicle.position.z) > 0.11 + 0.04,
        "vesicle cannot fill the independently bounded positive gap",
      );
    for (const y of [-0.03, 0, 0.03])
      for (const z of [-0.04, 0, 0.04])
        for (const side of [-1, 1]) {
          const ray = new THREE.Raycaster(
            new THREE.Vector3(0, y, z),
            new THREE.Vector3(side, 0, 0),
            0,
            2.5,
          );
          const hits = ray
            .intersectObject(membrane, false)
            .map((h) => h.distance);
          assert(
            hits.some((d) => d < middle - 1e-6) &&
              hits.some((d) => d > middle + 1e-6),
            `rendered membranes bracket the real gap at ${progress}, ${y}, ${z}`,
          );
        }
    assert.equal(membrane.geometry, geometry);
    assert.equal(geometry.attributes.position.array, positions);
    assert.equal(geometry.attributes.normal.array, normals);
    assert.equal(positions.length, 40 * 16 * 24 * 36 * 3);
    const used = geometry.drawRange.count * 3;
    assert(positions.subarray(used).every((v) => v === 0));
    assert(normals.subarray(used).every((v) => v === 0));
  }
  model.update(1);
  model.group.updateMatrixWorld(true);
  for (const side of [-1, 1]) {
    const ray = new THREE.Raycaster(
      new THREE.Vector3(),
      new THREE.Vector3(side, 0, 0),
      0,
      2.5,
    );
    assert.equal(
      ray.intersectObject(membrane, false).length,
      0,
      "genuine late joining remains open",
    );
  }
} finally {
  disposeScene(model.group, model.materials);
}
console.log(
  "plantGrowth junction: real intermediate gaps, true final joining, original sample retention and fixed buffers passed",
);
