import assert from "node:assert/strict";
import * as THREE from "three";
import model from "./nitrogenFixationProcess.js";
const scene = model.create();
for (const side of [-1, 1]) {
  const mesh = scene.group.getObjectByName(`MoFe-interface-support-${side}`);
  const p = mesh.geometry.attributes.position;
  assert.equal(p.count, 116, "bounded closed rim topology");
  const box = new THREE.Box3().setFromBufferAttribute(p);
  assert(box.min.y < -1.3 && box.max.y > 1.2, "support spans alpha and beta");
  assert(box.max.z > 0.1, "support reaches front cut plane");
  for (let i = 0; i < p.count; i++) {
    assert(
      Number.isFinite(p.getX(i)) &&
        Number.isFinite(p.getY(i)) &&
        Number.isFinite(p.getZ(i)),
    );
    if (p.getY(i) > 0.35 && p.getY(i) < 0.9)
      assert(
        side * p.getX(i) > 1.2,
        "lateral support keeps FeMo pocket aperture clear",
      );
  }
}
const nodes = [],
  geometry = new Set(),
  materials = new Set();
let bytes = 0;
scene.group.traverse((o) => {
  nodes.push(o.uuid);
  if (o.geometry) geometry.add(o.geometry);
  if (o.material) materials.add(o.material);
});
for (const g of geometry) {
  for (const a of Object.values(g.attributes)) bytes += a.array.byteLength;
  if (g.index) bytes += g.index.array.byteLength;
}
for (const oxygen of ["protected", "exposed"])
  for (const p of [0, 0.16, 0.3, 0.46, 0.66, 0.83, 1, 0.3])
    scene.update(p, { oxygen });
const after = [];
scene.group.traverse((o) => after.push(o.uuid));
assert.deepEqual(after, nodes);
console.log(
  JSON.stringify({
    id: model.id,
    nodes: nodes.length,
    geometries: geometry.size,
    materials: materials.size,
    geometryBytes: bytes,
  }),
);
console.log(
  "PASS: front alpha/beta rims span the assembly, retain open cofactor apertures, finite bounded topology and stable branch resources.",
);
