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

// Frozen ae697be byte-string oracle: deliberately independent of the production
// hash table. Preserve the first representative, including arbitrary attributes.
function originalIndices(geometry) {
  const attributes = Object.values(geometry.attributes);
  const views = attributes.map((attribute) => ({
    bytes: new Uint8Array(
      attribute.array.buffer,
      attribute.array.byteOffset,
      attribute.array.byteLength,
    ),
    stride: attribute.itemSize * attribute.array.BYTES_PER_ELEMENT,
  }));
  const representatives = new Map();
  const result = [];
  for (let vertex = 0; vertex < geometry.attributes.position.count; vertex++) {
    const key = views
      .map(({ bytes, stride }) =>
        bytes.subarray(vertex * stride, (vertex + 1) * stride).join(","),
      )
      .join("|");
    if (!representatives.has(key)) representatives.set(key, vertex);
    result.push(representatives.get(key));
  }
  return representatives.size < result.length ? result : null;
}

function checkAgainstOriginal(geometry) {
  const expected = originalIndices(geometry);
  const attributes = Object.entries(geometry.attributes).map(
    ([name, attr]) => ({
      name,
      attr,
      // Include bytes outside offset views to detect accidental buffer writes.
      bytes: new Uint8Array(attr.array.buffer).slice(),
    }),
  );
  const groups = structuredClone(geometry.groups),
    drawRange = { ...geometry.drawRange };
  indexRepeatedGeometry(geometry);
  assert.deepEqual(geometry.index ? [...geometry.index.array] : null, expected);
  assert.deepEqual(geometry.groups, groups);
  assert.deepEqual(geometry.drawRange, drawRange);
  for (const { name, attr, bytes } of attributes) {
    assert.equal(geometry.attributes[name], attr);
    assert.deepEqual(new Uint8Array(attr.array.buffer), bytes);
  }
}

const bitPatterns = new THREE.BufferGeometry();
const offsetBuffer = new ArrayBuffer(16 + 6 * 3 * 4 + 16);
new Uint8Array(offsetBuffer).fill(0xa5);
const rawPositions = new Uint32Array(offsetBuffer, 16, 18);
rawPositions.set([
  0, 0, 0, 0x80000000, 0, 0, 0x7fc00001, 0, 0, 0x7fc00002, 0, 0, 0x7fc00001, 0,
  0, 0, 0, 0,
]);
bitPatterns.setAttribute(
  "position",
  new THREE.BufferAttribute(new Float32Array(offsetBuffer, 16, 18), 3),
);
bitPatterns.setAttribute(
  "normal",
  new THREE.BufferAttribute(new Float32Array(18), 3),
);
bitPatterns.setAttribute(
  "uv",
  new THREE.BufferAttribute(new Float64Array(12), 2),
);
bitPatterns.setAttribute(
  "extra",
  new THREE.BufferAttribute(new Int16Array([1, 1, 1, 1, 1, 2]), 1, true),
);
bitPatterns.addGroup(0, 3, 2);
bitPatterns.setDrawRange(0, 6);
checkAgainstOriginal(bitPatterns);
assert.deepEqual([...bitPatterns.index.array], [0, 1, 2, 3, 2, 5]);

// Compute the hash with integer arithmetic, independent of Math.imul. This
// fixed pair collides across all 32 hash bits, not only the table's slot mask.
function referenceHash(bytes) {
  let hash = 2166136261n;
  for (const byte of bytes)
    hash = ((hash ^ BigInt(byte)) * 16777619n) & 0xffffffffn;
  hash ^= hash >> 16n;
  hash = (hash * 0x85ebca6bn) & 0xffffffffn;
  hash ^= hash >> 13n;
  return Number(hash);
}
const colliders = [
  [128, 206, 0, 0, 128, 70, 169, 191],
  [22, 207, 1, 0, 54, 148, 219, 237],
];
assert.notDeepEqual(colliders[0], colliders[1]);
assert.equal(referenceHash(colliders[0]), 3079002137);
assert.equal(referenceHash(colliders[0]), referenceHash(colliders[1]));
const collisions = new THREE.BufferGeometry();
collisions.setAttribute(
  "position",
  new THREE.BufferAttribute(
    new Uint8Array([...colliders[0], ...colliders[1], ...colliders[0]]),
    8,
  ),
);
checkAgainstOriginal(collisions);
assert.deepEqual([...collisions.index.array], [0, 1, 0]);

const uniqueGeometry = new THREE.BufferGeometry();
uniqueGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 2, 0, 0]), 3),
);
checkAgainstOriginal(uniqueGeometry);
assert.equal(uniqueGeometry.index, null);

for (const bypass of ["morph", "interleaved", "instanced", "count", "empty"]) {
  const geometry = new THREE.BufferGeometry();
  if (bypass !== "empty")
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(9), 3),
    );
  if (bypass === "morph")
    geometry.morphAttributes.position = [
      new THREE.BufferAttribute(new Float32Array(9), 3),
    ];
  if (bypass === "interleaved")
    geometry.setAttribute(
      "extra",
      new THREE.InterleavedBufferAttribute(
        new THREE.InterleavedBuffer(new Float32Array(9), 3),
        3,
        0,
      ),
    );
  if (bypass === "instanced")
    geometry.setAttribute(
      "extra",
      new THREE.InstancedBufferAttribute(new Float32Array(3), 1),
    );
  if (bypass === "count")
    geometry.setAttribute(
      "extra",
      new THREE.BufferAttribute(new Float32Array(2), 1),
    );
  assert.equal(indexRepeatedGeometry(geometry), geometry);
  assert.equal(
    geometry.index,
    null,
    `${bypass} geometry must be left unchanged`,
  );
}
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
