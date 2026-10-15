import assert from "node:assert/strict";
import * as THREE from "three";
import movement from "./chloroplastMovementProcess.js";
import transport from "./plantLongDistanceTransportProcess.js";
import plasmolysis from "./plasmolysisProcess.js";

const moving = movement.create();
const rear = moving.group.getObjectByName("rear cortical cytoplasm surface");
assert(rear);
const rearBox = new THREE.Box3().setFromObject(rear);
assert(
  rearBox.max.z < -1.49,
  "rear cortex must remain behind organelle routes",
);
const sides = moving.group.children.filter(
  (n) => n.name === "bounded anticlinal wall surface",
);
assert.equal(sides.length, 2);
assert.equal(sides[0].geometry, sides[1].geometry);
for (const side of sides) {
  const box = new THREE.Box3().setFromObject(side);
  assert(
    box.max.z < -1.19,
    "side wall lips leave the anterior viewing aperture open",
  );
}
const tissue = transport.create();
const rootWalls = tissue.group.children.filter(
  (n) => n.name === "root cortical rear wall cutaway",
);
const leafWalls = tissue.group.children.filter(
  (n) => n.name === "mesophyll rear wall cutaway",
);
assert.equal(rootWalls.length, 4);
assert.equal(leafWalls.length, 4);
assert(rootWalls.every((n) => n.geometry === rootWalls[0].geometry));
assert(leafWalls.every((n) => n.geometry === leafWalls[0].geometry));
for (const wall of leafWalls) {
  const positions = wall.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++)
    assert(positions.getZ(i) <= 1e-6, "leaf walls stay behind the air space");
}
const plasm = plasmolysis.create();
const bundles = plasm.group.getObjectByName("crossed cellulose wall lamellae");
assert(bundles?.isInstancedMesh);
assert.equal(bundles.count, 132);
for (const model of [moving, tissue, plasm]) {
  const before = [];
  model.group.traverse((n) => before.push([n, n.geometry, n.material]));
  for (const t of [0, 0.7, 0.2, 1, 0.7]) model.update(t);
  const after = [];
  model.group.traverse((n) => after.push([n, n.geometry, n.material]));
  assert.deepEqual(
    after,
    before,
    "seeking retains every scene resource identity",
  );
}
console.log(
  "plantWater refinement PASS: bounded posterior surfaces, open viewing/air apertures, shared tissue buffers, 132 instanced wall bundles and stable seek resources",
);
