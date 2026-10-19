import assert from "node:assert/strict";
import * as THREE from "three";
import { computeIndexedFloat32VertexNormals } from "../src/processes/modules/division/indexedFloat32Normals.js";

const bytes = (array) =>
  Buffer.from(array.buffer, array.byteOffset, array.byteLength);

function assertEquivalent(a, b) {
  for (const key of ["position", "normal"]) {
    assert.deepEqual(
      bytes(a.attributes[key].array),
      bytes(b.attributes[key].array),
    );
    assert.equal(a.attributes[key].version, b.attributes[key].version);
  }
  if (a.index) assert.deepEqual(bytes(a.index.array), bytes(b.index.array));
  assert.deepEqual(a.boundingBox, b.boundingBox);
  assert.deepEqual(a.boundingSphere, b.boundingSphere);
}

const sources = [
  new THREE.SphereGeometry(1, 64, 40),
  new THREE.CylinderGeometry(1, 1, 1, 8),
  new THREE.TorusGeometry(1, 0.013, 8, 100),
];
const degenerate = new THREE.BufferGeometry();
degenerate.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(
    [0, -0, 0, 1, 0.2, -0.3, 0, 0, 0, 1e-30, -1e-30, 0],
    3,
  ),
);
degenerate.setAttribute(
  "normal",
  new THREE.Float32BufferAttribute(new Float32Array(12), 3),
);
degenerate.setIndex([0, 0, 1, 0, 1, 2, 1, 2, 3, 3, 3, 3]);
sources.push(degenerate);

// Each triangle contribution must round to Float32 before the next triangle.
for (const geometry of sources) {
  const a = geometry.clone(),
    b = geometry.clone();
  const normalIdentity = b.attributes.normal;
  for (const lag of [0, 0.23, -0.17, 0.001, 0]) {
    for (const g of [a, b]) {
      const p = g.attributes.position.array;
      for (let i = 0; i < p.length; i += 3)
        p[i] =
          geometry.attributes.position.array[i] +
          lag * geometry.attributes.position.array[i + 1] ** 2;
      g.computeBoundingBox();
      g.computeBoundingSphere();
    }
    a.computeVertexNormals();
    computeIndexedFloat32VertexNormals(b);
    assert.equal(b.attributes.normal, normalIdentity);
    assertEquivalent(a, b);
  }
}

function interleavedIndexGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [0, 0, 0, 1, 0, 0.1, 0, 1, 0, 1, 1, 0.2],
      3,
    ),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(new Float32Array(12), 3),
  );
  // The exposed Uint16 array is insufficient: getX also applies stride/offset.
  geometry.setIndex(
    new THREE.InterleavedBufferAttribute(
      new THREE.InterleavedBuffer(
        new Uint16Array([0, 77, 1, 77, 2, 77, 2, 77, 1, 77, 3, 77]),
        2,
      ),
      1,
      0,
    ),
  );
  return geometry;
}

// Unsupported formats must use Three itself, including normal creation.
const fallbacks = [
  interleavedIndexGeometry,
  () => new THREE.BoxGeometry().toNonIndexed(),
  () => new THREE.CylinderGeometry().deleteAttribute("normal"),
  () => {
    const geometry = new THREE.BoxGeometry();
    geometry.attributes.normal.normalized = true;
    return geometry;
  },
  () => {
    const geometry = new THREE.BoxGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float64Array(geometry.attributes.position.array),
        3,
      ),
    );
    return geometry;
  },
];
for (const create of fallbacks) {
  const a = create(),
    b = create();
  for (const geometry of [a, b]) {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
  let delegated = 0;
  b.computeVertexNormals = function () {
    delegated++;
    return THREE.BufferGeometry.prototype.computeVertexNormals.call(this);
  };
  a.computeVertexNormals();
  computeIndexedFloat32VertexNormals(b);
  assert.equal(delegated, 1, "unsupported format delegates to Three");
  assertEquivalent(a, b);
}
console.log("division exact normals: 20 deformations and 5 fallbacks passed");
