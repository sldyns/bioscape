import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import {
  packCell,
  unpackCell,
  disposeCell,
} from "../src/scene/cellTransfer.js";
import { packDetail, unpackDetail } from "../src/scene/detailTransfer.js";

const bytes = (array) =>
  createHash("sha256")
    .update(new Uint8Array(array.buffer, array.byteOffset, array.byteLength))
    .digest("hex");
const bounds = (object) => ({
  box: object.boundingBox
    ? [object.boundingBox.min.toArray(), object.boundingBox.max.toArray()]
    : null,
  sphere: object.boundingSphere
    ? [object.boundingSphere.center.toArray(), object.boundingSphere.radius]
    : null,
});
function fixture() {
  const geometry = new THREE.BoxGeometry(0.7, 1.3, 2.1);
  geometry.rotateX(0.31);
  geometry.translate(1.8, -0.7, 0.6);
  const material = new THREE.MeshPhysicalMaterial({
    color: "#bacb93",
    ior: 1.31,
    roughness: 0.43,
  });
  const mesh = new THREE.Mesh(geometry, material);
  const instances = new THREE.InstancedMesh(geometry, material, 3);
  for (let i = 0; i < instances.count; i++) {
    const transform = new THREE.Object3D();
    transform.position.set(i * 1.7, 0.3 - i * 0.5, i * -0.23);
    transform.rotation.set(i * 0.13, -0.37, 0.72);
    transform.scale.set(0.3 + i, 0.8, 1.4 - i * 0.17);
    transform.updateMatrix();
    instances.setMatrixAt(i, transform.matrix);
  }
  const cell = new THREE.Group();
  cell.add(mesh, instances);
  return {
    cell,
    groups: { pair: cell },
    parts: { instances: [instances] },
    full: [mesh],
    anchors: { pair: new THREE.Vector3(0.3, 0.7, 0.2) },
    resources: [],
  };
}

const ordinary = fixture();
const lazyPayload = packCell(ordinary).payload;
assert.deepEqual(bounds(ordinary.cell.children[0].geometry), {
  box: null,
  sphere: null,
});
assert.deepEqual(bounds(ordinary.cell.children[1]), {
  box: null,
  sphere: null,
});
const lazy = unpackCell(structuredClone(lazyPayload));
assert.deepEqual(bounds(lazy.cell.children[0].geometry), {
  box: null,
  sphere: null,
});
assert.deepEqual(bounds(lazy.cell.children[1]), { box: null, sphere: null });
disposeCell(lazy);
disposeCell(ordinary);

const expected = fixture();
const referenceGeometry = expected.cell.children[0].geometry;
referenceGeometry.computeBoundingBox();
referenceGeometry.computeBoundingSphere();
const referenceInstances = expected.cell.children[1];
referenceInstances.computeBoundingBox();
referenceInstances.computeBoundingSphere();
const expectedGeometryBounds = bounds(referenceGeometry);
const expectedInstanceBounds = bounds(referenceInstances);

const prepared = fixture();
const originalArrays = Object.fromEntries(
  Object.entries(prepared.cell.children[0].geometry.attributes).map(
    ([name, attribute]) => [name, bytes(attribute.array)],
  ),
);
const originalMatrix = bytes(prepared.cell.children[1].instanceMatrix.array);
const { payload, buffers } = packCell(prepared, { prepareBounds: true });
assert.deepEqual(
  bounds(prepared.cell.children[0].geometry),
  expectedGeometryBounds,
);
assert.deepEqual(bounds(prepared.cell.children[1]), expectedInstanceBounds);
const transferred = structuredClone(payload, { transfer: buffers });
const first = unpackCell(transferred);
const second = unpackCell(transferred);
const firstGeometry = first.cell.children[0].geometry;
const secondGeometry = second.cell.children[0].geometry;
assert.equal(firstGeometry, first.cell.children[1].geometry);
assert.notEqual(firstGeometry, secondGeometry);
assert.equal(
  firstGeometry.attributes.position.array,
  secondGeometry.attributes.position.array,
);
assert.deepEqual(bounds(firstGeometry), expectedGeometryBounds);
assert.deepEqual(bounds(first.cell.children[1]), expectedInstanceBounds);
assert.deepEqual(
  Object.fromEntries(
    Object.entries(firstGeometry.attributes).map(([name, attribute]) => [
      name,
      bytes(attribute.array),
    ]),
  ),
  originalArrays,
);
assert.equal(
  bytes(first.cell.children[1].instanceMatrix.array),
  originalMatrix,
);
firstGeometry.boundingBox.min.x = -99;
firstGeometry.boundingSphere.radius = 99;
first.cell.children[1].boundingBox.min.y = -99;
first.cell.children[1].boundingSphere.radius = 99;
disposeCell(first);
assert.deepEqual(bounds(secondGeometry), expectedGeometryBounds);
assert.deepEqual(bounds(second.cell.children[1]), expectedInstanceBounds);
const third = unpackCell(transferred);
assert.deepEqual(
  bounds(third.cell.children[0].geometry),
  expectedGeometryBounds,
);
assert.deepEqual(bounds(third.cell.children[1]), expectedInstanceBounds);
disposeCell(second);
disposeCell(third);
disposeCell(prepared);

// A transfer also preserves existing custom bounds without recomputing them.
referenceGeometry.boundingBox.min.x = -127;
referenceInstances.boundingSphere.radius = 91;
const custom = unpackCell(structuredClone(packCell(expected).payload));
assert.deepEqual(
  bounds(custom.cell.children[0].geometry),
  bounds(referenceGeometry),
);
assert.deepEqual(bounds(custom.cell.children[1]), bounds(referenceInstances));
disposeCell(custom);
disposeCell(expected);

for (const empty of [false, true]) {
  const root = new THREE.Group();
  const geometry = empty
    ? new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(), 3),
      )
    : new THREE.BoxGeometry(0.71, 1.29, 2.11);
  const material = new THREE.MeshStandardMaterial({ color: "#ccaa99" });
  root.add(new THREE.Mesh(geometry, material));
  const lazyDetail = unpackDetail(structuredClone(packDetail(root).payload));
  assert.deepEqual(bounds(lazyDetail.children[0].geometry), {
    box: null,
    sphere: null,
  });
  lazyDetail.children[0].geometry.dispose();
  lazyDetail.children[0].material.dispose();
  const reference = geometry.clone();
  reference.computeBoundingBox();
  reference.computeBoundingSphere();
  const { payload: detail, buffers: transfers } = packDetail(root, {
    prepareBounds: true,
  });
  const data = structuredClone(detail, { transfer: transfers });
  const left = unpackDetail(data);
  const right = unpackDetail(data);
  assert.deepEqual(bounds(left.children[0].geometry), bounds(reference));
  assert.deepEqual(bounds(right.children[0].geometry), bounds(reference));
  left.children[0].geometry.boundingBox.min.x = -22;
  left.children[0].geometry.boundingSphere.radius = 22;
  assert.deepEqual(bounds(right.children[0].geometry), bounds(reference));
  for (const group of [root, left, right]) {
    group.children[0].geometry.dispose();
    group.children[0].material.dispose();
  }
  reference.dispose();
}

// Detail workers prepare framing boxes while leaving missing spheres lazy.
// Detail meshes are already flattened, so geometry contains their transforms.
for (const existingSphere of [false, true]) {
  const root = new THREE.Group();
  const geometry = new THREE.BoxGeometry(0.63, 1.47, 2.19);
  geometry.rotateX(0.29);
  geometry.scale(0.73, 1.41, 0.92);
  geometry.translate(-1.7, 0.9, 2.3);
  if (existingSphere)
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0.31, -0.47, 0.93),
      17.29,
    );
  const material = new THREE.MeshPhysicalMaterial({
    color: "#ccaa99",
    ior: 1.37,
  });
  const source = new THREE.Mesh(geometry, material);
  root.add(source);
  const reference = geometry.clone();
  reference.computeBoundingBox();
  const expectedBounds = bounds(reference);
  const attributeState = (g) =>
    Object.fromEntries(
      Object.entries(g.attributes).map(([name, a]) => [
        name,
        {
          bytes: bytes(a.array),
          type: a.array.constructor.name,
          itemSize: a.itemSize,
          normalized: a.normalized,
        },
      ]),
    );
  const beforeAttributes = attributeState(geometry);
  const beforeIndex = bytes(geometry.index.array);
  source.updateMatrix();
  const beforeTransform = source.matrix.toArray();
  const sphereBeforePack = geometry.boundingSphere;
  const { payload: detail, buffers: transfers } = packDetail(root, {
    prepareBounds: true,
    prepareSpheres: false,
  });
  assert.equal(
    geometry.boundingSphere,
    sphereBeforePack,
    "Box-only preparation must leave missing and existing spheres untouched",
  );
  assert.deepEqual(bounds(geometry), expectedBounds);
  const data = structuredClone(detail, { transfer: transfers });
  const restored = unpackDetail(data);
  const repeated = unpackDetail(data);
  const received = restored.children[0];
  received.updateMatrix();
  assert.deepEqual(attributeState(received.geometry), beforeAttributes);
  assert.equal(bytes(received.geometry.index.array), beforeIndex);
  assert.deepEqual(received.matrix.toArray(), beforeTransform);
  assert.deepEqual(bounds(received.geometry), expectedBounds);
  assert.equal(received.material.ior, material.ior);
  assert.deepEqual(received.material.color.toArray(), material.color.toArray());
  received.geometry.boundingBox.min.x = -99;
  if (existingSphere) received.geometry.boundingSphere.radius = 99;
  else {
    reference.computeBoundingSphere();
    received.geometry.computeBoundingSphere();
    assert.deepEqual(
      bounds(received.geometry).sphere,
      bounds(reference).sphere,
      "The original lazy sphere computation must remain exact",
    );
  }
  assert.deepEqual(bounds(repeated.children[0].geometry), expectedBounds);
  for (const group of [root, restored, repeated]) {
    group.children[0].geometry.dispose();
    group.children[0].material.dispose();
  }
  reference.dispose();
}

console.log(
  "Model bounds transfer: default null, exact prepared geometry/instance bounds, box-only lazy spheres, preserved existing spheres, shared arrays, independent lifetimes and empty geometry passed",
);
