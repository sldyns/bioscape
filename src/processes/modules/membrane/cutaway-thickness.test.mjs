import assert from "node:assert/strict";
import definition from "./osmoticBalanceProcess.js";
const scene = definition.create();
const rim = scene.group.getObjectByName(
  "cutaway-continuous-membrane-thickness",
);
const outer = scene.group.getObjectByName("deforming-red-cell-membrane");
assert(rim.userData.boundaryEdges > 10);
const geometry = rim.geometry;
const buffer = geometry.attributes.position.array;
function pose(progress, tonicity) {
  scene.update(progress, { tonicity });
  assert.equal(rim.geometry, geometry);
  assert.equal(geometry.attributes.position.array, buffer);
  assert([...buffer].every(Number.isFinite));
  for (let n = 0; n < rim.userData.boundaryEdges; n++) {
    const offset = n * 18;
    for (let axis = 0; axis < 3; axis++) {
      // Both triangles share their diagonal, outer edge and inset endpoints.
      assert.equal(buffer[offset + axis], buffer[offset + 9 + axis]);
      assert.equal(buffer[offset + 6 + axis], buffer[offset + 12 + axis]);
      assert(
        Math.abs(
          buffer[offset + 6 + axis] - buffer[offset + 3 + axis] * 0.935,
        ) < 1e-6,
      );
      assert(
        Math.abs(buffer[offset + 15 + axis] - buffer[offset + axis] * 0.935) <
          1e-6,
      );
    }
  }
  assert([...geometry.attributes.normal.array].every(Number.isFinite));
  // The closed measurement shell and cutaway material grouping survive.
  assert(outer.geometry.groups.some((g) => g.materialIndex === 1));
  return [...buffer];
}
for (const condition of ["hypotonic", "isotonic", "hypertonic"]) {
  const expected = pose(0.73, condition);
  pose(0.1, "hypertonic");
  assert.deepEqual(pose(0.73, condition), expected);
}
console.log(
  JSON.stringify({
    test: "red-cell-cutaway-thickness",
    boundaryEdges: rim.userData.boundaryEdges,
    positionBytes: buffer.byteLength,
    result: "PASS",
  }),
);
