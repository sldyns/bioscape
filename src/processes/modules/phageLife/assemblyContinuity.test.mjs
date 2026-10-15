import assert from "node:assert/strict";
import { sceneKit } from "../../kit.js";
import { hostCutaway } from "./geometry.js";
import { cutawayHead } from "./assemblyGeometry.js";
import assembly from "./phageAssemblyProcess.js";
import packaging from "./phagePackagingProcess.js";

// Facet surfaces share the same appearance resources without losing the open
// front, inner shell or physical cut rims.
const k = sceneKit();
const head = cutawayHead(k, k.group);
const capsomers = [],
  innerWalls = [];
for (const panel of head.panels) {
  panel.traverse((o) => {
    if (o.name === "capsomer-domain-lattice") capsomers.push(o.material);
    if (o.isMesh && o.geometry === panel.geometry && o !== panel)
      innerWalls.push(o.material);
  });
}
assert(capsomers.length > 20);
assert.equal(new Set(capsomers).size, 1);
assert.equal(new Set(innerWalls).size, 1);

const host = hostCutaway(k, k.group);
const sectors = [];
host.group.traverse((o) => {
  if (o.isMesh && o.geometry.type === "SphereGeometry" && o.scale.x > 2)
    sectors.push(o.geometry);
});
assert.equal(sectors.length, 30);
assert.equal(
  new Set(sectors).size,
  6,
  "all envelope leaflets reuse six unit sectors",
);

const scene = assembly.create();
const rows = [];
scene.group.traverse((o) => {
  if (o.name === "helical-sheath-subunits") rows.push(o.parent);
});
assert.equal(rows.length, 18);
let partialRows = 0;
for (let i = 0; i <= 240; i++) {
  scene.update(i / 240);
  for (const row of rows) {
    if (row.visible && row.scale.x < 0.999) partialRows++;
    assert(row.scale.x > 0 && row.scale.x <= 1);
  }
}
assert(
  partialRows > 50,
  "sheath rows incorporate continuously, not binary reveal",
);
scene.update(1);
assert(rows.every((row) => row.visible && row.scale.x === 1));
scene.update(1, { protease: "inactive" });
assert.equal(scene.group.userData.matureVirion, false);

// The ATPase stroke returns smoothly to its resting transform at either end
// of translocation, including a reverse seek across the boundary.
const motorScene = packaging.create();
function snapshot(p) {
  motorScene.update(p);
  const out = [];
  motorScene.group.traverse((o) => {
    out.push(...o.position, ...o.scale, ...o.quaternion);
  });
  return out;
}
for (const edge of [0.25, 0.78]) {
  const before = snapshot(edge - 1e-7),
    after = snapshot(edge + 1e-7);
  assert(
    Math.max(...before.map((value, i) => Math.abs(value - after[i]))) < 1e-4,
    `no ATPase pose jump at ${edge}`,
  );
}
console.log(
  "phage facet resource sharing and continuous assembly/motor checks passed",
);
