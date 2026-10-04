import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import meiosis from "./meiosisProcess.js";

function named(root, name) {
  const nodes = [];
  root.traverse((o) => {
    if (o.name === name) nodes.push(o);
  });
  return nodes;
}
function surfaceDistance(point, mesh) {
  const p = mesh.geometry.attributes.position,
    triangle = new THREE.Triangle(),
    closest = new THREE.Vector3();
  let distance = Infinity;
  for (let i = 0; i < mesh.geometry.drawRange.count; i += 3) {
    for (let j = 0; j < 3; j++)
      [triangle.a, triangle.b, triangle.c][j]
        .fromBufferAttribute(p, i + j)
        .applyMatrix4(mesh.matrixWorld);
    triangle.closestPointToPoint(point, closest);
    distance = Math.min(distance, closest.distanceTo(point));
  }
  return distance;
}
function ringCenter(mesh, segment) {
  const p = mesh.geometry.attributes.position,
    center = new THREE.Vector3();
  for (let radial = 0; radial < 8; radial++)
    center.add(
      new THREE.Vector3().fromBufferAttribute(p, segment * 9 + radial),
    );
  return center.multiplyScalar(1 / 8).applyMatrix4(mesh.matrixWorld);
}
function state(model) {
  model.group.updateMatrixWorld(true);
  const hash = createHash("sha256"),
    identities = [];
  model.group.traverse((o) => {
    identities.push(o.uuid, o.geometry?.uuid, o.material?.uuid);
    hash.update(
      JSON.stringify([o.visible, o.matrixWorld.elements, o.material?.uuid]),
    );
    for (const array of [
      o.geometry?.attributes.position?.array,
      o.geometry?.attributes.normal?.array,
      o.instanceMatrix?.array,
    ]) {
      if (!array) continue;
      assert(array.every(Number.isFinite));
      hash.update(
        Buffer.from(array.buffer, array.byteOffset, array.byteLength),
      );
    }
  });
  return { hash: hash.digest("hex"), identities };
}

const model = meiosis.create(),
  rings = named(model.group, "actomyosin-contractile-belt"),
  inner = named(model.group, "germ-cell-inner-leaflet")[0];
let maxGap = 0;
for (const p of [
  0.43, 0.465, 0.495, 0.525, 0.55, 0.559, 0.8, 0.83, 0.865, 0.9, 0.925, 0.935,
]) {
  model.update(p);
  model.group.updateMatrixWorld(true);
  const ringIds = p < 0.6 ? [0] : [1, 2];
  for (const id of ringIds) {
    const ring = rings[id],
      track = ring.children[2];
    assert(ring.visible);
    assert.equal(track.geometry.parameters.tubularSegments, 100);
    assert.equal(track.geometry.parameters.radialSegments, 8);
    let rearSamples = 0;
    for (const i of [0, 12, 25, 38, 50, 62, 75, 88]) {
      const center = ringCenter(track, i);
      if (center.z > -0.03) continue; // The positive-z membrane is a viewing cut.
      const gap = surfaceDistance(center, inner);
      maxGap = Math.max(maxGap, gap);
      assert(
        gap < 0.065,
        `ring ${id} detached from cortical membrane at ${p}: gap ${gap}`,
      );
      rearSamples++;
    }
    assert(rearSamples >= 3);
  }
  const before = state(model);
  model.update(0.9731);
  model.update(0.0239);
  model.update(p);
  const after = state(model);
  assert.deepEqual(after, before, `absolute contour seek at ${p}`);
}
console.log(
  `Meiotic cortical rings: real inner-membrane surface contact, full track detail and arbitrary-seek determinism PASS; max sampled centreline gap ${maxGap.toFixed(6)}.`,
);
