import assert from "node:assert/strict";
import * as THREE from "three";
import motor from "./motorTransportProcess.js";
import rna from "./rnaProcessingProcess.js";
import organelle from "./organelleImportProcess.js";
const v = motor.create();
for (const p of [0, 0.35, 0.6, 1]) {
  v.update(p);
  const parts = v.group
    .getObjectByName("kinesin")
    .children.filter((o) => o.name.startsWith("kinesin-neck-0-"));
  assert.equal(parts.length, 8);
  const directions = parts.map((o) =>
    new THREE.Vector3(0, 1, 0).applyQuaternion(o.quaternion),
  );
  assert(directions[0].distanceTo(directions[7]) > 0.1, "neck must bend");
  assert(
    parts.every((o) => o.geometry === parts[0].geometry),
    "neck cylinders share geometry",
  );
}
const r = rna.create();
for (const p of [0.2, 0.56, 0.72, 1]) {
  r.update(p);
  for (let i = 0; i < 46; i += 2) {
    const seg = r.group.getObjectByName(`intron-backbone-${i}`),
      base = r.group.getObjectByName(`intron-base-${i}`);
    const tangent = new THREE.Vector3(0, 1, 0).applyQuaternion(seg.quaternion);
    const start = seg.position
      .clone()
      .addScaledVector(tangent, -seg.scale.y / 2);
    const offset = base.position.clone().sub(start);
    assert(
      Math.abs(offset.dot(tangent)) < 1e-6,
      "base offset normal to local backbone",
    );
    assert(Math.abs(offset.length() - 0.15) < 1e-6);
  }
}
const o = organelle.create();
o.update(1);
const points = [];
for (let i = 10; i < 60; i++) {
  const seg = o.group.getObjectByName(`import-chain-${i}`);
  if (seg) points.push(seg.position.clone());
}
const bounds = new THREE.Box3()
  .setFromPoints(points)
  .getSize(new THREE.Vector3());
assert(bounds.x < 1.2 && bounds.y < 1.2 && bounds.z < 1.2, "compact fold");
assert(
  bounds.y > 0.5 && bounds.z > 0.5,
  "fold occupies a three-dimensional volume",
);
console.log(
  "curved shared neck, local-normal RNA bases, compact 3D folded chain PASS",
);
