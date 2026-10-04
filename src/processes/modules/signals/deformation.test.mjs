import assert from "node:assert/strict";
import * as THREE from "three";
import differentiation from "./differentiationProcess.js";

const model = differentiation.create();
const point = new THREE.Vector3(),
  normal = new THREE.Vector3(),
  expected = new THREE.Vector3();
const ease = (p, from, to) => {
  const v = Math.max(0, Math.min(1, (p - from) / (to - from)));
  return v * v * (3 - 2 * v);
};
let vertices = 0;
for (const p of [0, 0.75, 0.79, 0.835, 0.87, 0.92, 1, 0.81, 0]) {
  model.update(p);
  const deform = 0.22 * Math.sin(Math.PI * ease(p, 0.75, 0.92));
  for (const { mesh, rest, fromNuclear } of model.science.deformingMeshes) {
    const geometry = mesh.geometry;
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      point.fromBufferAttribute(geometry.attributes.position, i);
      normal.fromBufferAttribute(geometry.attributes.normal, i);
      const x = rest[i * 3],
        waist = 1 - deform * Math.exp(-((x / 1.1) ** 2) / 0.16);
      expected
        .set(x, rest[i * 3 + 1] * waist, rest[i * 3 + 2] * waist)
        .applyMatrix4(fromNuclear);
      assert(
        point.distanceTo(expected) < 2e-7,
        "optimized deformation retains original vertex transform",
      );
      assert(
        geometry.boundingBox.distanceToPoint(point) < 2e-7,
        "conservative box contains every deformed vertex",
      );
      assert(
        point.distanceTo(geometry.boundingSphere.center) <=
          geometry.boundingSphere.radius + 2e-7,
        "conservative sphere contains every deformed vertex",
      );
      assert(
        Number.isFinite(normal.length()) &&
          Math.abs(normal.length() - 1) < 2e-6,
        "analytic normal is finite and unit length",
      );
      vertices++;
    }
  }
}
console.log(
  `signals-deformation: ${vertices} original-transform, conservative-bounds and finite unit-normal checks PASS`,
);
