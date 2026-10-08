import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
import current from "./endocytosisProcess.js";

// The same test can exercise the frozen pre-fix implementation.
const definition = process.env.BIOSCAPE_TRAFFIC_CARGO_BASELINE
  ? (
      await import(
        pathToFileURL(resolve(process.env.BIOSCAPE_TRAFFIC_CARGO_BASELINE))
      )
    ).default
  : current;
const scene = definition.create(),
  cargo = scene.group.children.filter((object) =>
    object.name.startsWith("LDL —"),
  ),
  membrane = scene.group.getObjectByName("early-endosome-membrane"),
  leaflet = membrane.children[0];
assert.equal(cargo.length, 3);
scene.group.updateMatrixWorld(true);

// Recover the actual LDL vertices once in particle-local coordinates. Include
// every instanced lipid head, the ApoB tube, and the neutral lipid core.
const point = new THREE.Vector3(),
  instanceMatrix = new THREE.Matrix4(),
  inverse = new THREE.Matrix4(),
  localVertices = cargo.map((particle) => {
    const vertices = [];
    inverse.copy(particle.matrixWorld).invert();
    particle.traverse((object) => {
      if (!object.geometry) return;
      const positions = object.geometry.attributes.position;
      for (
        let instance = 0;
        instance < (object.isInstancedMesh ? object.count : 1);
        instance++
      ) {
        if (object.isInstancedMesh) {
          object.getMatrixAt(instance, instanceMatrix);
          instanceMatrix.premultiply(object.matrixWorld);
        } else instanceMatrix.copy(object.matrixWorld);
        instanceMatrix.premultiply(inverse);
        for (let i = 0; i < positions.count; i++) {
          point.fromBufferAttribute(positions, i).applyMatrix4(instanceMatrix);
          vertices.push(point.x, point.y, point.z);
        }
      }
    });
    return new Float64Array(vertices);
  });
const radii = localVertices.map((vertices) => {
  let radius = 0;
  for (let i = 0; i < vertices.length; i += 3)
    radius = Math.max(
      radius,
      Math.hypot(vertices[i], vertices[i + 1], vertices[i + 2]),
    );
  return radius;
});
const positions = leaflet.geometry.attributes.position,
  rows = positions.count / 65,
  xs = new Float64Array(rows),
  rs = new Float64Array(rows),
  matrix = new THREE.Matrix4(),
  ray = new THREE.Raycaster(),
  origin = new THREE.Vector3(),
  direction = new THREE.Vector3();
let minimumClearance = Infinity,
  minimumParticleSeparation = Infinity,
  checks = 0;
const poses = [
  0.724,
  ...Array.from({ length: 331 }, (_, i) => 0.67 + i / 1000),
];
for (const [poseIndex, progress] of poses.entries()) {
  // Exercise reverse seeks through the uncoated-carrier state as well.
  if (poseIndex % 29 === 0) {
    scene.update(0.98);
    scene.update(0.49);
  }
  scene.update(progress);
  scene.group.updateMatrixWorld(true);
  let poseMinimum = Infinity,
    worstPoint,
    worstParticle;
  inverse.copy(membrane.matrixWorld).invert();
  for (let row = 0; row < rows; row++) {
    xs[row] = positions.getX(row * 65 + 32);
    rs[row] = Math.hypot(
      positions.getY(row * 65 + 32),
      positions.getZ(row * 65 + 32),
    );
    if (row)
      assert(
        xs[row] >= xs[row - 1],
        "actual leaflet must have an ordered meridian",
      );
  }
  cargo.forEach((particle, particleIndex) => {
    matrix.copy(particle.matrixWorld).premultiply(inverse);
    const vertices = localVertices[particleIndex];
    for (let i = 0; i < vertices.length; i += 3) {
      point.fromArray(vertices, i).applyMatrix4(matrix);
      assert(
        point.x > xs[0] && point.x < xs[rows - 1],
        "LDL crosses a luminal pole",
      );
      let lo = 0,
        hi = rows - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (xs[mid] < point.x) lo = mid;
        else hi = mid;
      }
      const radius =
          rs[lo] + ((rs[hi] - rs[lo]) * (point.x - xs[lo])) / (xs[hi] - xs[lo]),
        clearance = radius - Math.hypot(point.y, point.z);
      minimumClearance = Math.min(minimumClearance, clearance);
      checks++;
      if (clearance < poseMinimum) {
        poseMinimum = clearance;
        worstPoint = point.clone();
        worstParticle = particleIndex;
      }
    }
  });
  if (poseMinimum <= 0.002) {
    // Report a real triangle intersection, not only a revolved profile.
    origin.set(worstPoint.x, 0, 0).applyMatrix4(membrane.matrixWorld);
    worstPoint.applyMatrix4(membrane.matrixWorld);
    direction.subVectors(worstPoint, origin);
    const length = direction.length();
    ray.set(origin, direction.normalize());
    ray.near = 1e-6;
    ray.far = length;
    const hits = ray.intersectObject(leaflet, false);
    assert.fail(
      `LDL ${worstParticle} lacks inner-leaflet clearance at ${progress}: clearance=${poseMinimum}; triangle hits=${hits.length}`,
    );
  }
  cargo.forEach((particle, particleIndex) => {
    for (let other = particleIndex + 1; other < cargo.length; other++) {
      const separation = particle.position.distanceTo(cargo[other].position),
        sumOfRadii =
          radii[particleIndex] * particle.scale.x +
          radii[other] * cargo[other].scale.x;
      minimumParticleSeparation = Math.min(
        minimumParticleSeparation,
        separation - sumOfRadii,
      );
      assert(
        separation > sumOfRadii,
        `distinct LDL particles overlap at ${progress}`,
      );
    }
  });
}
console.log(
  `LDL cargo topology PASS: ${poses.length} fusion/sorting poses, ${checks} actual vertices; minimum inner-leaflet clearance=${minimumClearance}, particle gap=${minimumParticleSeparation}`,
);
