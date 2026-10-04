import assert from "node:assert/strict";
import * as THREE from "three";
import { membraneSurface } from "./membranes.js";
import { membraneSurface as frozenMembraneSurface } from "./fixtures/membranes-baseline-20261004.mjs";
import { assertEquivalentTrees } from "./membraneEquivalenceTestUtils.mjs";

const sphere = (t) => [-Math.cos(Math.PI * t), Math.sin(Math.PI * t)];
let comparedStates = 0;
for (const axis of ["x", "y"])
  for (const rings of [9, 65, 82, 129]) {
    const actual = membraneSurface(
        new THREE.Group(),
        new THREE.MeshStandardMaterial(),
        rings,
        64,
        axis,
      ),
      expected = frozenMembraneSurface(
        new THREE.Group(),
        new THREE.MeshStandardMaterial(),
        rings,
        64,
        axis,
      );
    const versions = () =>
      actual.mesh.children.map((object) => [
        object.geometry.attributes.position.version,
        object.geometry.attributes.normal?.version,
        object.instanceMatrix?.version,
      ]);
    const counts = { normals: 0, boxes: 0, spheres: 0, instances: 0 };
    for (const object of actual.mesh.children) {
      const targets = object.isInstancedMesh ? [object] : [object.geometry];
      for (const target of targets)
        for (const [method, counter] of [
          ["computeVertexNormals", "normals"],
          ["computeBoundingBox", "boxes"],
          ["computeBoundingSphere", "spheres"],
          ["setMatrixAt", "instances"],
        ]) {
          if (!target[method]) continue;
          const original = target[method];
          target[method] = function (...args) {
            counts[counter]++;
            return original.apply(this, args);
          };
        }
    }
    function compare(profile, label) {
      actual.set(profile);
      expected.set(profile);
      actual.mesh.updateMatrixWorld(true);
      expected.mesh.updateMatrixWorld(true);
      assertEquivalentTrees(
        actual.mesh,
        expected.mesh,
        `${axis}/${rings}/${label}`,
      );
      comparedStates++;
    }
    // The constructor starts with zeros; the first zero profile must still
    // construct normals, bounds and instances before it can ever be skipped.
    compare(() => [0, 0], "initial zero");
    assert(counts.normals > 0 && counts.instances > 0);
    compare(sphere, "sphere");
    const beforeVersions = versions(),
      beforeCounts = { ...counts };
    let calls = 0;
    compare((t) => {
      calls++;
      return sphere(t);
    }, "same values with new callback");
    assert.equal(calls, rings * 2, "both builders still sample every ring");
    assert.deepEqual(
      versions(),
      beforeVersions,
      "static profile avoids GPU uploads",
    );
    assert.deepEqual(
      counts,
      beforeCounts,
      "static profile avoids normals, bounds and instances",
    );
    const finalRing = (t) => {
      const value = sphere(t);
      if (t === 1) value[0] += 0.001;
      return value;
    };
    compare(finalRing, "last ring alone changes");
    assert(
      counts.normals > beforeCounts.normals,
      "last-ring changes invalidate the full profile",
    );
    compare((t) => [t, -0.1], "negative radii clamp");
    const clampedCounts = { ...counts };
    compare((t) => [t, -0.9], "same effective clamped profile");
    assert.deepEqual(counts, clampedCounts);
    compare((t) => [t === 0 ? -0 : t, 0.2], "negative zero");
    const signedCounts = { ...counts };
    compare((t) => [t === 0 ? 0 : t, 0.2], "positive zero");
    assert(
      counts.normals > signedCounts.normals,
      "signed zero is not silently collapsed",
    );
    compare((t) => [t * t, 0.35 + 0.18 * Math.sin(9.7 * t)], "curved profile");
    actual.mesh.position.set(2, -1, 0.5);
    expected.mesh.position.copy(actual.mesh.position);
    actual.setOpacity(0.4);
    expected.setOpacity(0.4);
    compare(sphere, "seek back with external transform and opacity");
    compare(sphere, "repeated transformed state");
  }
console.log(
  `Traffic membrane performance regression: ${comparedStates} byte-identical states; unchanged profiles skip uploads, normal/bounds recomputation and instance writes`,
);
