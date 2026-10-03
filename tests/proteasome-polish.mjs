import assert from "node:assert/strict";
import * as THREE from "three";
import definition from "../src/processes/modules/turnover/proteasomeProcess.js";
const model = definition.create(),
  nodes = [],
  geometries = new Set(),
  materials = new Set();
model.group.traverse((n) => {
  nodes.push(n);
  if (n.geometry) geometries.add(n.geometry);
  if (n.material) materials.add(n.material);
});
const rings = nodes.filter((n) => /^20S (alpha|beta) ring/.test(n.name));
assert.equal(rings.length, 4);
assert.deepEqual(
  rings.map((n) => n.children.length),
  [7, 7, 7, 7],
);
assert.equal(nodes.filter((n) => /^Rpt ATPase/.test(n.name)).length, 6);
assert([...materials].every((m) => model.materials.includes(m)));
const snapshot = () =>
  JSON.stringify(
    nodes.map((n) => [
      n.visible,
      ...n.position.toArray(),
      ...n.quaternion.toArray(),
      ...n.scale.toArray(),
    ]),
  );
for (const tag of ["ubiquitin", "untagged"])
  for (const shell of ["cutaway", "whole"]) {
    const params = { tag, shell };
    for (const p of [0, 0.16, 0.34, 0.48, 0.52, 0.64, 0.72, 0.9, 1]) {
      model.update(p, params);
      const before = snapshot();
      model.update(0.2, params);
      model.update(p, params);
      assert.equal(snapshot(), before);
      model.group.updateMatrixWorld(true);
      for (const n of nodes)
        assert(n.matrixWorld.elements.every(Number.isFinite));
      const bounds = new THREE.Box3().setFromObject(model.group),
        size = bounds.getSize(new THREE.Vector3());
      assert(Math.max(...size.toArray()) < 20);
      assert.equal(
        rings.reduce(
          (count, r) => count + r.children.filter((n) => n.visible).length,
          0,
        ),
        shell === "whole" ? 28 : 20,
      );
    }
    model.update(1, params);
    assert.equal(model.labels[0].active, tag === "untagged");
    assert.equal(model.labels[4].active, shell === "cutaway");
    const residues = nodes.filter((n) => /^substrate residue/.test(n.name));
    assert.equal(
      residues.filter((n) => n.visible).length,
      tag === "untagged" ? 42 : 0,
    );
    assert.equal(
      model.group.userData.peptidesReleased,
      tag === "untagged" ? 0 : 7,
    );
  }
const after = [];
model.group.traverse((n) => after.push(n));
assert.deepEqual(after, nodes);
for (const geometry of geometries)
  for (const attribute of Object.values(geometry.attributes))
    assert([...attribute.array].every(Number.isFinite));
let triangles = 0;
for (const n of nodes)
  if (n.geometry)
    triangles +=
      (n.geometry.index?.count ?? n.geometry.attributes.position.count) / 3;
console.log(
  JSON.stringify(
    {
      nodes: nodes.length,
      meshes: nodes.filter((n) => n.isMesh).length,
      geometries: geometries.size,
      materials: materials.size,
      triangles,
      checks:
        "four heptamers, both tag branches and both cutaways, repeated seeks, finite bounds/resources, complete clearance",
    },
    null,
    2,
  ),
);
