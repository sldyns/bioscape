import assert from "node:assert/strict";
import * as THREE from "three";
import { visibleProcessBounds } from "../src/processes/sceneBounds.js";
const root = new THREE.Group();
const material = new THREE.MeshBasicMaterial();
const visible = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material);
root.add(visible);
const hidden = new THREE.Group();
hidden.visible = false;
const distant = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material);
distant.position.set(100, 100, 100);
hidden.add(distant);
root.add(hidden);
assert.deepEqual(visibleProcessBounds(root).max.toArray(), [1, 1, 1]);
hidden.visible = true;
assert.deepEqual(visibleProcessBounds(root).max.toArray(), [101, 101, 101]);
hidden.visible = false;
const instances = new THREE.InstancedMesh(
  new THREE.BoxGeometry(2, 2, 2),
  material,
  1,
);
root.add(instances);
instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(4, 0, 0));
assert.equal(visibleProcessBounds(root).max.x, 5);
instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(7, 0, 0));
assert.equal(visibleProcessBounds(root).max.x, 8);
instances.visible = false;
visible.geometry.attributes.position.setX(0, 3);
assert.equal(visibleProcessBounds(root).max.x, 3);
visible.material = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
});
assert(visibleProcessBounds(root).isEmpty());
visible.material.opacity = 0.5;
assert.equal(visibleProcessBounds(root).max.x, 3);

// Framing includes every position entry, even when an index or drawRange hides
// a tail vertex; morph bounds and stale geometry bounds must not change it.
const fullBuffer = new THREE.BufferGeometry();
fullBuffer.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(
    [...Array.from({ length: 11 }, () => [1, 2, 3]).flat(), 7, -2, -3],
    3,
  ),
);
fullBuffer.setIndex([0, 1, 2]);
fullBuffer.setDrawRange(0, 3);
fullBuffer.morphAttributes.position = [
  new THREE.Float32BufferAttribute(new Float32Array(36).fill(100), 3),
];
fullBuffer.computeBoundingBox();
const fullBufferMesh = new THREE.Mesh(fullBuffer, material);
const fullBounds = visibleProcessBounds(fullBufferMesh);
assert.deepEqual(fullBounds.min.toArray(), [1, -2, -3]);
assert.deepEqual(fullBounds.max.toArray(), [7, 2, 3]);
fullBufferMesh.scale.set(-2, 0, 3);
fullBufferMesh.position.set(4, -5, 6);
const transformedBounds = visibleProcessBounds(fullBufferMesh);
assert.deepEqual(transformedBounds.min.toArray(), [-10, -5, -3]);
assert.deepEqual(transformedBounds.max.toArray(), [2, -5, 15]);
fullBuffer.dispose();

// Compare transformed instances against Three.js, including geometry edits
// without a version bump, reflection, shear and the projective fallback.
const affineRoot = new THREE.Group();
affineRoot.position.set(2, -3, 4);
affineRoot.rotation.set(0.2, -0.3, 0.4);
const affineInstances = new THREE.InstancedMesh(
  new THREE.BoxGeometry(2, 3, 4),
  material,
  1,
);
affineRoot.add(affineInstances);
const reflected = new THREE.Matrix4().makeScale(-2, 0.7, 1.3);
reflected.setPosition(5, 6, 7);
const sheared = reflected.clone();
sheared.elements[4] = 0.37;
sheared.elements[9] = -0.21;
const projective = reflected.clone();
projective.elements[3] = 0.04;
for (const transform of [
  reflected,
  sheared,
  projective,
  new THREE.Matrix4().makeScale(0, -1, 2),
]) {
  affineInstances.setMatrixAt(0, transform);
  affineInstances.geometry.attributes.position.setX(0, 3);
  affineRoot.updateWorldMatrix(true, true);
  affineInstances.geometry.computeBoundingBox();
  const stored = new THREE.Matrix4();
  affineInstances.getMatrixAt(0, stored);
  const world = new THREE.Matrix4().multiplyMatrices(
    affineInstances.matrixWorld,
    stored,
  );
  const expected = affineInstances.geometry.boundingBox
    .clone()
    .applyMatrix4(world);
  const actual = visibleProcessBounds(affineRoot);
  assert.deepEqual(actual.min.toArray(), expected.min.toArray());
  assert.deepEqual(actual.max.toArray(), expected.max.toArray());
}
affineInstances.dispose();
affineInstances.geometry.dispose();
console.log(
  "Visible process bounds: visibility, instances, edited geometry, full buffers and mirrored transforms PASS",
);
