import assert from "node:assert/strict";
import * as THREE from "three";
import model from "./plantDivisionProcess.js";
const v = model.create();
v.update(1);
v.group.updateMatrixWorld(true);
const shells = [];
v.group.traverse((n) => {
  if (n.name === "Daughter nuclear envelope cutaway") shells.push(n);
});
for (const shell of shells) {
  assert.equal(
    shell.material.side,
    THREE.DoubleSide,
    "bounded interior cutaway is rendered",
  );
  const g = shell.geometry,
    p = g.attributes.position,
    normal = g.attributes.normal,
    idx = g.index;
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3(),
    face = new THREE.Vector3();
  let count = 0;
  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(p, idx.getX(i));
    b.fromBufferAttribute(p, idx.getX(i + 1));
    c.fromBufferAttribute(p, idx.getX(i + 2));
    face.crossVectors(b.clone().sub(a), c.clone().sub(a));
    if (face.lengthSq() < 1e-12) continue;
    assert(face.dot(a) > 0, "sphere triangle winding is outward");
    count++;
  }
  assert(count > 100);
  for (let i = 0; i < p.count; i++) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(normal, i);
    assert(a.dot(b) > 0.99, "stored normals outward");
    assert(a.z <= 1e-6, "front hemisphere stays open");
  }
  const domains = shell.children.find(
    (n) => n.name === "Decondensing daughter chromatin domains",
  );
  for (const mesh of domains.children) {
    mesh.updateMatrix();
    for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      a.fromBufferAttribute(mesh.geometry.attributes.position, i).applyMatrix4(
        mesh.matrix,
      );
      assert(
        a.length() < 0.98,
        "decondensed trace remains inside daughter envelope",
      );
    }
  }
}
console.log(
  "Daughter cutaway: outward winding/normals, bounded interior rendering and chromatin containment passed.",
);
