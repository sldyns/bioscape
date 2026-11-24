import assert from "node:assert/strict";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import mitosis from "./mitosisProcess.js";

const scene = mitosis.create();
const wall = scene.group.getObjectByName("membrane-inner-leaflet");
const bvh = new MeshBVH(wall.geometry, { indirect: true });
const astrals = scene.group.children.filter(
  (object) => object.name === "astral-microtubule",
);
const poles = scene.group.children.filter(
  (object) => object.name === "centrosome-with-orthogonal-centriole-triplets",
);
assert.equal(astrals.length, 14);
assert.equal(poles.length, 2);
const point = new THREE.Vector3(),
  tip = new THREE.Vector3(),
  start = new THREE.Vector3();
const ray = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, 0, -1));
let samples = 0,
  corticalTips = 0;
for (const attachment of ["normal", "unattached", "normal"]) {
  for (const p of [0, 0.19, 0.37, 0.65, 0.72, 0.79, 0.827, 0.83, 1, 0.37]) {
    scene.update(p, { attachment });
    scene.group.updateMatrixWorld(true);
    bvh.refit();
    const effective = attachment === "unattached" ? Math.min(0.43, p) : p;
    let near = 0;
    for (let i = 0; i < astrals.length; i++) {
      const mesh = astrals[i];
      assert.equal(mesh.visible, effective < 0.83);
      if (!mesh.visible) continue;
      start.set(0, -0.5, 0).applyMatrix4(mesh.matrixWorld);
      tip.set(0, 0.5, 0).applyMatrix4(mesh.matrixWorld);
      assert(start.distanceTo(poles[Math.floor(i / 7)].position) < 1e-6);
      if (bvh.closestPointToPoint(tip).distance < 0.04) near++;
      // The rear bowl also defines the enclosed front half by reflection.
      // Check the shaft and both caps, including the near-cortical ends.
      const positions = mesh.geometry.attributes.position;
      for (let j = 0; j < positions.count; j++) {
        point.fromBufferAttribute(positions, j).applyMatrix4(mesh.matrixWorld);
        ray.origin.set(point.x, point.y, 0.2);
        const hit = bvh.raycastFirst(ray, THREE.DoubleSide);
        assert(
          hit && -Math.abs(point.z) >= hit.point.z - 1e-6,
          "astral fiber penetrates plasma membrane",
        );
        samples++;
      }
    }
    if (effective >= 0.36 && effective <= 0.74) {
      assert.equal(
        near,
        8,
        "four fibers from each pole reach the cortex, interleaved with shorter astrals",
      );
      corticalTips += near;
    }
  }
}
console.log(
  `Mitotic asters: ${samples} fiber surface vertices inside actual cortex, ${corticalTips} near-cortical tips across forward/reverse and checkpoint poses`,
);
