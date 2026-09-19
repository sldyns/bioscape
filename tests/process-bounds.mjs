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
console.log(
  "Visible process bounds: hidden branches, animated instances, edited geometry and transparency PASS",
);
