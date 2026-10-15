import assert from "node:assert/strict";
import * as THREE from "three";
import transport from "./plantTransportProcess.js";

const scene = transport.create();
const sugar = scene.group.getObjectByName("tracked-sucrose");
const glucose = sugar.getObjectByName(
  "sucrose-glucopyranose-six-membered-ring",
);
const fructose = sugar.getObjectByName(
  "sucrose-fructofuranose-five-membered-ring",
);
assert.equal(glucose.geometry.parameters.tubularSegments, 6);
assert.equal(fructose.geometry.parameters.tubularSegments, 5);
const bridge = sugar.getObjectByName("sucrose-glycosidic-bridge");
const oxygen = sugar.getObjectByName("sucrose-glycosidic-oxygen");
const resources = new Set();
sugar.traverse((o) => resources.add(o.geometry || o));
const initialSize = resources.size;
const local = sugar.children.map((o) => [
  o.position.toArray(),
  o.rotation.toArray(),
]);
for (const energy of ["available", "depleted"]) {
  for (const p of [0, 0.2, 0.7, 1, 0.3, 0.7]) {
    scene.update(p, { energy });
    scene.group.updateMatrixWorld(true);
    const a = new THREE.Vector3(0, -0.5, 0).applyMatrix4(bridge.matrixWorld);
    const b = new THREE.Vector3(0, 0.5, 0).applyMatrix4(bridge.matrixWorld);
    const midpoint = a.add(b).multiplyScalar(0.5);
    assert(
      midpoint.distanceTo(oxygen.getWorldPosition(new THREE.Vector3())) < 1e-7,
    );
    assert.deepEqual(
      sugar.children.map((o) => [o.position.toArray(), o.rotation.toArray()]),
      local,
    );
    sugar.traverse((o) => resources.add(o.geometry || o));
    assert.equal(resources.size, initialSize);
  }
}
console.log(
  "PASS sucrose cargo: distinct six/five-membered rings, attached oxygen bridge, rigid cargo and stable resources through both ATP controls",
);
