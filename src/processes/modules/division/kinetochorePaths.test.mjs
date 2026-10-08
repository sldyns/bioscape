import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
import current from "./meiosisProcess.js";

const definition = process.env.BIOSCAPE_DIVISION_PATH_BASELINE
  ? (
      await import(
        pathToFileURL(resolve(process.env.BIOSCAPE_DIVISION_PATH_BASELINE))
      )
    ).default
  : current;
const scene = definition.create();
function named(root, name) {
  const objects = [];
  root.traverse((object) => {
    if (object.name === name) objects.push(object);
  });
  return objects;
}
const chromatids = named(scene.group, "condensed-chromatin-chromatid"),
  fibres = named(scene.group, "kinetochore-microtubule-bundle"),
  obstacles = fibres.map((_, fibreIndex) =>
    chromatids.flatMap((chromatid, index) =>
      index === fibreIndex
        ? []
        : [
            ...named(chromatid, "continuous-chromatid-arm"),
            ...named(chromatid, "centromeric-chromatin"),
            ...named(chromatid, "outer-kinetochore-plate"),
          ],
    ),
  );
assert.equal(fibres.length, 8);
const matrix = new THREE.Matrix4(),
  a = new THREE.Vector3(),
  z = new THREE.Vector3(),
  direction = new THREE.Vector3(),
  ray = new THREE.Raycaster();
const poses = [
  0.28,
  ...Array.from({ length: 55 }, (_, i) => 0.28 + i * 0.005),
  ...Array.from({ length: 58 }, (_, i) => 0.62 + i * 0.005),
  0.54999,
  0.62001,
  0.63999,
  0.90999,
];
let seed = 245721;
for (let i = 0; i < 32; i++) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  poses.push(
    i % 2
      ? 0.62 + (seed / 4294967296) * 0.29
      : 0.28 + (seed / 4294967296) * 0.27,
  );
}
let segments = 0;
for (const [index, progress] of poses.entries()) {
  if (index % 13 === 0) {
    scene.update(0.97);
    scene.update(0.19);
  }
  scene.update(progress);
  scene.group.updateMatrixWorld(true);
  fibres.forEach((fibre, fibreIndex) => {
    if (!fibre.visible) return;
    for (let instance = 0; instance < fibre.count; instance++) {
      fibre.getMatrixAt(instance, matrix);
      matrix.premultiply(fibre.matrixWorld);
      a.set(0, -0.5, 0).applyMatrix4(matrix);
      z.set(0, 0.5, 0).applyMatrix4(matrix);
      direction.subVectors(z, a);
      const length = direction.length();
      ray.set(a, direction.normalize());
      ray.near = 1e-6;
      ray.far = length - 1e-6;
      const hits = ray.intersectObjects(obstacles[fibreIndex], false);
      assert.equal(
        hits.length,
        0,
        `meiosis fibre ${fibreIndex}, segment ${instance} crosses another chromatid at ${progress}: ${hits[0]?.object.name}`,
      );
      segments++;
    }
  });
}
console.log(
  `Meiotic attachment paths PASS: ${poses.length} I/II poses, ${segments} actual microtubule segments, reverse seeks and no other-chromatid crossings`,
);
