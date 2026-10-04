import assert from "node:assert/strict";
import * as THREE from "three";
import definition from "./c4camProcess.js";

const model = definition.create();
model.update(0.525, { strategy: "cam" });
model.group.updateMatrixWorld(true);
const membrane = model.group.getObjectByName("tonoplast-lumen-facing-leaflet");
const reserves = Array.from({ length: 12 }, (_, index) =>
  model.group.getObjectByName(`CAM-vacuolar-malate-reserve-${index}`),
);
assert(reserves.every(Boolean), "retain all twelve storage-volume markers");
assert.equal(membrane.geometry.attributes.position.count, 925);
assert(
  reserves.every(
    (reserve) => reserve.geometry.attributes.position.count === 425,
  ),
);

// Use the actual rendered inner-leaflet triangles in world space. The front
// half is an intentional cutaway, so reflect those same triangles across its
// local cut plane to test the full biological lumen without adding geometry.
const membraneCenter = membrane.getWorldPosition(new THREE.Vector3());
const positions = membrane.geometry.attributes.position;
const indices = membrane.geometry.index;
const planes = [];
for (let index = 0; index < indices.count; index += 3) {
  const vertices = [0, 1, 2].map((offset) =>
    new THREE.Vector3().fromBufferAttribute(
      positions,
      indices.getX(index + offset),
    ),
  );
  for (const reflected of [false, true]) {
    const world = vertices.map((vertex) => {
      const point = vertex.clone();
      if (reflected) point.z = -point.z;
      return membrane.localToWorld(point);
    });
    const plane = new THREE.Plane().setFromCoplanarPoints(...world);
    if (plane.normal.lengthSq() < 0.9) continue;
    if (plane.distanceToPoint(membraneCenter) > 0) plane.negate();
    planes.push({ plane, reflected });
  }
}
assert(planes.length > 3000, "use the original high-resolution tonoplast");

function allVertexClearances() {
  let minimum = Infinity,
    minimumDisplayedBack = Infinity,
    outside = 0,
    outsideDisplayedBack = 0,
    vertices = 0;
  const point = new THREE.Vector3();
  for (const reserve of reserves) {
    const position = reserve.geometry.attributes.position;
    for (let index = 0; index < position.count; index++) {
      point.fromBufferAttribute(position, index);
      reserve.localToWorld(point);
      let clearance = Infinity,
        backClearance = Infinity;
      for (const { plane, reflected } of planes) {
        const gap = -plane.distanceToPoint(point);
        clearance = Math.min(clearance, gap);
        if (!reflected) backClearance = Math.min(backClearance, gap);
      }
      minimum = Math.min(minimum, clearance);
      minimumDisplayedBack = Math.min(minimumDisplayedBack, backClearance);
      if (clearance < 0) outside++;
      if (backClearance < 0) outsideDisplayedBack++;
      vertices++;
    }
  }
  return {
    minimum,
    minimumDisplayedBack,
    outside,
    outsideDisplayedBack,
    vertices,
  };
}

const repairedPeak = allVertexClearances();
assert(
  repairedPeak.minimum > 0.03,
  "every actual storage vertex stays in the lumen",
);
assert.equal(repairedPeak.outside, 0);

// Negative control reproduces the original peak update's .2 + .8 * 1 scale
// on the very same geometry: it must breach the displayed membrane itself,
// not merely an imagined front cover of the cutaway.
for (const reserve of reserves) reserve.scale.setScalar(1);
model.group.updateMatrixWorld(true);
const originalPeak = allVertexClearances();
assert(originalPeak.minimumDisplayedBack < -0.25);
assert(originalPeak.outsideDisplayedBack > 0);
assert(originalPeak.outside > 0);

// A world-space bounding sphere encloses every geometry vertex. Its distance
// to every actual/mirrored face is a conservative all-vertex bound at each
// sampled progress, including both branch states and non-monotonic seeks.
const progresses = [
  ...Array.from({ length: 1001 }, (_, i) => i / 1000),
  0.525,
  0.275,
  1,
  0.42,
  0.55,
  0,
  0.525,
];
const center = new THREE.Vector3();
let states = 0,
  markerStates = 0,
  minimumSphereClearance = Infinity,
  minimumCenterPlaneDistance = Infinity,
  maximumWorldRadius = 0;
for (const strategy of ["c4", "cam"])
  for (const progress of progresses) {
    model.update(progress, { strategy });
    model.group.updateMatrixWorld(true);
    assert.equal(model.group.userData.trackedCarbonAtoms, 4);
    assert.equal(membrane.parent.visible, strategy === "cam");
    for (const reserve of reserves) {
      reserve.geometry.computeBoundingSphere();
      center.copy(reserve.geometry.boundingSphere.center);
      reserve.localToWorld(center);
      const radius =
        reserve.geometry.boundingSphere.radius *
        reserve.matrixWorld.getMaxScaleOnAxis();
      let clearance = Infinity;
      for (const { plane } of planes) {
        const centerGap = -plane.distanceToPoint(center);
        minimumCenterPlaneDistance = Math.min(
          minimumCenterPlaneDistance,
          centerGap,
        );
        clearance = Math.min(clearance, centerGap - radius);
      }
      maximumWorldRadius = Math.max(maximumWorldRadius, radius);
      assert(
        clearance > 0.03,
        `${strategy} p=${progress}: ${reserve.name} crosses the true vacuolar lumen`,
      );
      minimumSphereClearance = Math.min(minimumSphereClearance, clearance);
      assert(reserve.visible && reserve.material.visible);
      markerStates++;
    }
    states++;
  }

model.update(0, { strategy: "cam" });
const basalRadius = reserves[0].scale.x;
model.update(0.525, { strategy: "cam" });
const peakRadius = reserves[0].scale.x;
assert(
  peakRadius > basalRadius * 1.5,
  "retain a visible nighttime storage increase",
);
assert.equal(model.group.userData.vacuolarStorage, 1);
model.update(1, { strategy: "cam" });
assert.equal(
  reserves[0].scale.x,
  basalRadius,
  "daytime release returns to baseline",
);
assert.equal(model.group.userData.vacuolarStorage, 0);

console.log(
  "PASS 20261004-plantConnections-05: CAM storage remains inside actual tonoplast geometry",
  {
    states,
    markerStates,
    minimumSphereClearance,
    minimumCenterPlaneDistance,
    maximumWorldRadius,
    repairedPeak,
    originalPeak,
  },
);
