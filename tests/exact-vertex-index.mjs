import assert from "node:assert/strict";
import * as THREE from "three";
import { indexRepeatedGeometry } from "../src/scene/indexRepeatedGeometry.js";
import { packCell, unpackCell } from "../src/scene/cellTransfer.js";

let vertexCount = 0;
let uniqueCount = 0;
for (const detail of [0, 1, 2, 3]) {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const attributes = { ...geometry.attributes };
  const originalCount = geometry.attributes.position.count;
  indexRepeatedGeometry(geometry);
  for (const [name, attribute] of Object.entries(attributes)) {
    assert.equal(
      geometry.attributes[name],
      attribute,
      "Original attribute buffer must stay untouched",
    );
    const stride = attribute.itemSize * attribute.array.BYTES_PER_ELEMENT;
    const bytes = new Uint8Array(
      attribute.array.buffer,
      attribute.array.byteOffset,
      attribute.array.byteLength,
    );
    for (let vertex = 0; vertex < originalCount; vertex++) {
      const indexed = geometry.index?.getX(vertex) ?? vertex;
      assert.deepEqual(
        bytes.subarray(vertex * stride, (vertex + 1) * stride),
        bytes.subarray(indexed * stride, (indexed + 1) * stride),
        `${name}: triangle-corner bytes changed`,
      );
    }
  }
  const index = geometry.index;
  assert.equal(indexRepeatedGeometry(geometry), geometry);
  assert.equal(
    geometry.index,
    index,
    "Already-indexed geometry must not be rebuilt",
  );
  vertexCount += originalCount;
  uniqueCount += index ? new Set(index.array).size : originalCount;
}
assert(
  uniqueCount < vertexCount * 0.6,
  "Repeated smooth primitives should reuse most vertex work",
);
// Equal positions with different normals/UVs must remain separate; +0 and -0
// are preserved as distinct bit patterns as well.
const seams = new THREE.BufferGeometry();
seams.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0, 0, 0, 0, 0, 0],
    3,
  ),
);
seams.setAttribute(
  "normal",
  new THREE.Float32BufferAttribute(
    [0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    3,
  ),
);
seams.setAttribute(
  "uv",
  new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], 2),
);
indexRepeatedGeometry(seams);
assert.deepEqual([...seams.index.array], [0, 0, 2, 3, 4, 0]);
const cell = new THREE.Group();
const mesh = new THREE.InstancedMesh(
  seams,
  new THREE.MeshPhysicalMaterial(),
  2,
);
cell.add(mesh);
mesh.setMatrixAt(1, new THREE.Matrix4().makeTranslation(3, 0, 0));
const { payload } = packCell({
  cell,
  groups: {},
  parts: {},
  full: [],
  anchors: {},
  resources: [],
});
const received = unpackCell(structuredClone(payload)).cell.children[0];
assert.deepEqual([...received.geometry.index.array], [...seams.index.array]);
assert.deepEqual(
  [...received.instanceMatrix.array],
  [...mesh.instanceMatrix.array],
);
console.log(
  `Exact indexing: ${vertexCount} original corners / ${uniqueCount} distinct vertices; every position, normal, UV byte and instance preserved`,
);
