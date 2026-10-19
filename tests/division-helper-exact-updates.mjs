import assert from "node:assert/strict";
import { divisionKit } from "../src/processes/modules/division/divisionShapes.js";
import { THREE } from "../src/processes/kit.js";

const bytes = (array) =>
  Buffer.from(array.buffer, array.byteOffset, array.byteLength);

// Direct instance writes must match the established Object3D/Matrix4 path,
// including Float32 conversion and zero-length segment fallback.
const kit = divisionKit();
const bundle = kit.bundle();
for (const endpoints of [
  [-2, 0.2, -0.1, 2, -0.3, 0.1, 0.012, 0.07],
  [0, 0, 0, 0, 0, 0, 0.02, 0],
  [1, -0.2, 0.3, -1, 0.7, -0.4, 0.009, -0.04],
]) {
  kit.setBundle(bundle, ...endpoints);
  const expected = new Float32Array(bundle.instanceMatrix.array.length);
  const temp = new THREE.Object3D();
  const [ax, ay, az, bx, by, bz, radius, bowY] = endpoints;
  for (let s = 0; s < 5; s++)
    for (let j = 0; j < 12; j++) {
      const t = j / 12,
        u = (j + 1) / 12,
        a = (s * Math.PI * 2) / 5;
      const wave = Math.sin(t * Math.PI),
        next = Math.sin(u * Math.PI);
      kit.setSegment(
        temp,
        ax + (bx - ax) * t,
        ay + (by - ay) * t + (Math.cos(a) * 0.04 + bowY) * wave,
        az + (bz - az) * t + (0.14 + Math.sin(a) * 0.04) * wave,
        ax + (bx - ax) * u,
        ay + (by - ay) * u + (Math.cos(a) * 0.04 + bowY) * next,
        az + (bz - az) * u + (0.14 + Math.sin(a) * 0.04) * next,
        radius,
      );
      temp.updateMatrix();
      temp.matrix.toArray(expected, (s * 12 + j) * 16);
    }
  assert.deepEqual(bytes(bundle.instanceMatrix.array), bytes(expected));
}
function state(cell, includeVersions = false) {
  const out = [];
  cell.mesh.traverse((o) => {
    for (const a of [
      o.geometry?.attributes.position,
      o.geometry?.attributes.normal,
      o.instanceMatrix,
    ])
      if (a)
        out.push(
          Buffer.from(bytes(a.array)),
          ...(includeVersions ? [a.version] : []),
        );
    for (const own of [o.geometry, o]) {
      if (own?.boundingBox) out.push(own.boundingBox.clone());
      if (own?.boundingSphere) out.push(own.boundingSphere.clone());
    }
  });
  return out;
}
const dimensions = [
  [3.2, 2.25, 1.38],
  [1.62, 1.58, 1.22],
];
const cells = dimensions.map((d) => kit.cell(...d));
for (const args of [
  [0, 1, "x"],
  [0.7, 1.12, "x"],
  [0.7, 1.12, "y"],
  [0.2, 0.98, "x"],
  [0, 1, "x"],
])
  for (let i = 0; i < cells.length; i++) {
    cells[i].shape(...args);
    const reference = divisionKit().cell(...dimensions[i]);
    reference.shape(...args);
    assert.deepEqual(
      state(cells[i]),
      state(reference),
      "absolute seeks preserve every buffer and bound",
    );
    const unchanged = state(cells[i], true);
    cells[i].shape(...args);
    assert.deepEqual(
      state(cells[i], true),
      unchanged,
      "identical shape inputs do not rebuild or upload",
    );
  }
// Prepared queries must retain both original transforms, including the
// world/model roundtrip under moving ancestors and nonuniform root scale.
const axisKit = divisionKit();
const ancestor = new THREE.Group();
ancestor.add(axisKit.group);
const chromatid = axisKit.chromatid(-1, 0.65, axisKit.green);
const queries = [-0.3, 0, 0.13, chromatid.exchangeY, 0.65];
for (const value of [0, 0.7, -0.3, 0.2, 0.7, 0]) {
  ancestor.position.set(0.3, -0.17, 0.2);
  ancestor.rotation.set(value * 0.11, -0.2, 0.07);
  axisKit.group.position.set(value, -0.2, 0.1);
  axisKit.group.rotation.set(0.13, value * 0.2, -0.09);
  axisKit.group.scale.set(1.07, 0.93, 1.12);
  chromatid.group.position.set(-0.1, value * 0.4, 0.2);
  chromatid.group.rotation.z = value * Math.PI;
  chromatid.group.scale.setScalar(1 - value * 0.1);
  chromatid.setDeflection(value * 0.2, -value * 0.17);
  axisKit.beginAxisPointFrame();
  chromatid.beginAxisPoints();
  for (const y of queries) {
    const ordinary = chromatid.axisPoint(y);
    const prepared = chromatid.axisPointPrepared(y);
    assert.deepEqual(
      bytes(new Float64Array(prepared.toArray())),
      bytes(new Float64Array(ordinary.toArray())),
      "prepared axis query preserves both original matrix steps exactly",
    );
  }
}
console.log("division helper exact updates: passed");
