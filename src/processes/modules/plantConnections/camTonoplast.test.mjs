import assert from "node:assert/strict";
import * as THREE from "three";
import definition from "./c4camProcess.js";

const model = definition.create();
model.update(0, { strategy: "cam" });
model.group.updateMatrixWorld(true);
const sites = [];
model.group.traverse((o) => {
  if (o.name === "tonoplast-malate-transport-site-schematic") sites.push(o);
});
sites.sort((a, b) => a.position.x - b.position.x);
assert.equal(sites.length, 2, "retain an import and an export site");
const atoms = sites[0].parent.children
  .filter((o) => o.userData.trackedCarbon !== undefined)
  .sort((a, b) => a.userData.trackedCarbon - b.userData.trackedCarbon);
assert.equal(atoms.length, 4);
const ranges = [
  [0.16, 0.32],
  [0.49, 0.64],
];
const crossings = sites.map(() => atoms.map(() => 0));
let previous = null;
let transitSamples = 0;
let maxStep = 0;
const world = new THREE.Vector3();
for (let n = 0; n <= 2000; n++) {
  const progress = n / 2000;
  model.update(progress, { strategy: "cam" });
  model.group.updateMatrixWorld(true);
  const current = atoms.map((atom) =>
    atom.getWorldPosition(new THREE.Vector3()),
  );
  if (previous)
    for (let a = 0; a < atoms.length; a++) {
      const step = current[a].distanceTo(previous[a]);
      assert(
        step < 0.04,
        `p=${progress}: tracked carbon jumps between keyframes`,
      );
      maxStep = Math.max(maxStep, step);
    }
  for (let s = 0; s < sites.length; s++) {
    if (progress < ranges[s][0] || progress > ranges[s][1]) continue;
    const site = sites[s];
    const center = site.getWorldPosition(new THREE.Vector3());
    for (let a = 0; a < atoms.length; a++) {
      if (!previous || previous[a].x >= center.x || current[a].x < center.x)
        continue;
      const t = (center.x - previous[a].x) / (current[a].x - previous[a].x);
      const crossing = previous[a].clone().lerp(current[a], t);
      const local = site.worldToLocal(crossing);
      assert(
        Math.hypot(local.x, local.z) < 0.005,
        `site ${s}, carbon ${a}: membrane crossing misses the displayed channel axis`,
      );
      const direction = current[a].clone().sub(previous[a]).normalize();
      const axis = new THREE.Vector3(0, 1, 0).transformDirection(
        site.matrixWorld,
      );
      assert(direction.dot(axis) > 0.999, "cargo moves along the channel axis");
      crossings[s][a]++;
    }
  }
  previous = current;
}
assert(
  crossings.flat().every((n) => n === 1),
  "all four carbons cross each site once",
);

// Check the actual displayed port rings and membrane faces, rather than a
// userData declaration of a lumen radius. The cut-rim opening must clear the
// spheres and bonds throughout passage, including between stage endpoints.
const apertures = sites.map((site) => {
  const rims = site.children.filter(
    (o) => o.name === "CAM-tonoplast-channel-rim",
  );
  assert.equal(rims.length, 2);
  return Math.min(
    ...rims.map(
      (rim) => rim.geometry.parameters.radius - rim.geometry.parameters.tube,
    ),
  );
});
// The six rendered helices must leave the same clear axis as the end rings.
// A conservative AABB for every helix mesh contains all of its triangles.
let minHelixClearance = Infinity;
for (const site of sites)
  for (const helix of site.children.filter(
    (o) => o.name === "transmembrane-helix",
  ))
    helix.traverse((mesh) => {
      if (!mesh.geometry) return;
      const bounds = new THREE.Box3();
      const position = mesh.geometry.attributes.position;
      for (let i = 0; i < position.count; i++)
        bounds.expandByPoint(
          site.worldToLocal(
            mesh.localToWorld(
              new THREE.Vector3().fromBufferAttribute(position, i),
            ),
          ),
        );
      const dx = Math.max(bounds.min.x, -bounds.max.x, 0);
      const dz = Math.max(bounds.min.z, -bounds.max.z, 0);
      const clearance = Math.hypot(dx, dz) - 0.085;
      assert(clearance > 0.04, "actual helix mesh blocks tracked carbon");
      minHelixClearance = Math.min(minHelixClearance, clearance);
    });
const bonds = [0, 1, 2].map((i) =>
  model.group.getObjectByName(`CAM-carbon-bond-${i}`),
);
assert(bonds.every(Boolean));
let minCargoClearance = Infinity;
for (let n = 0; n <= 2000; n++) {
  const progress = n / 2000;
  model.update(progress, { strategy: "cam" });
  model.group.updateMatrixWorld(true);
  for (let s = 0; s < sites.length; s++) {
    if (progress < ranges[s][0] || progress > ranges[s][1]) continue;
    const site = sites[s];
    const radius = apertures[s];
    for (const atom of atoms) {
      const local = site.worldToLocal(atom.getWorldPosition(world).clone());
      const atomRadius = atom.geometry.parameters.radius * atom.scale.x;
      if (Math.abs(local.y) > 0.18 + atomRadius) continue;
      const clearance = radius - Math.hypot(local.x, local.z) - atomRadius;
      assert(clearance > 0.03, `p=${progress}: carbon sphere clips the port`);
      minCargoClearance = Math.min(minCargoClearance, clearance);
      transitSamples++;
    }
    for (const bond of bonds.filter((o) => o.visible)) {
      const ends = [-0.5, 0.5].map((y) =>
        site.worldToLocal(bond.localToWorld(new THREE.Vector3(0, y, 0))),
      );
      if (
        Math.min(...ends.map((e) => e.y)) > 0.18 ||
        Math.max(...ends.map((e) => e.y)) < -0.18
      )
        continue;
      const radial = Math.max(...ends.map((e) => Math.hypot(e.x, e.z)));
      assert(radial + bond.scale.x < radius, "carbon bond clips the port");
    }
  }
}
assert(transitSamples > 100);

const triangle = new THREE.Triangle();
const nearest = new THREE.Vector3();
const origin = new THREE.Vector3();
const membranes = [
  "tonoplast-cytosol-facing-leaflet",
  "tonoplast-lumen-facing-leaflet",
  "CAM-vacuolar-lumen-tint",
].map((name) => model.group.getObjectByName(name));
assert(membranes.every(Boolean));
let minMembraneClearance = Infinity;
let faces = 0;
for (const membrane of membranes) {
  assert.equal(
    membrane.geometry.attributes.position.count,
    membrane.name === "CAM-vacuolar-lumen-tint" ? 425 : 925,
    "retain leaflet and tint resolution",
  );
  const position = membrane.geometry.attributes.position;
  const index = membrane.geometry.index;
  for (const site of sites)
    for (let i = 0; i < index.count; i += 3) {
      const points = [0, 1, 2].map((offset) =>
        site.worldToLocal(
          membrane.localToWorld(
            new THREE.Vector3().fromBufferAttribute(
              position,
              index.getX(i + offset),
            ),
          ),
        ),
      );
      if (
        Math.min(...points.map((p) => p.y)) > 0.3 ||
        Math.max(...points.map((p) => p.y)) < -0.3
      )
        continue;
      for (const point of points) point.y = 0;
      triangle.set(...points);
      let distance;
      if (triangle.getArea() > 1e-12) {
        triangle.closestPointToPoint(origin, nearest);
        distance = nearest.length();
      } else {
        distance = Math.min(
          ...points.map((point, j) =>
            new THREE.Line3(point, points[(j + 1) % 3])
              .closestPointToPoint(origin, true, nearest)
              .length(),
          ),
        );
      }
      assert(distance > 0.13, "actual tonoplast face still blocks the channel");
      minMembraneClearance = Math.min(minMembraneClearance, distance - 0.085);
      faces++;
    }
}
assert(faces > 100);

model.update(0.32, { strategy: "cam" });
const stored = atoms.map((o) => o.position.toArray());
for (const progress of [0.35, 0.42, 0.49]) {
  model.update(progress, { strategy: "cam" });
  assert(
    atoms.every(
      (o, i) => o.position.distanceTo(new THREE.Vector3(...stored[i])) < 1e-12,
    ),
    "retain the vacuolar storage dwell",
  );
}

// Re-entry after an alternate strategy must restore the same tracked atoms,
// bonds and scientific state. The unchanged C4 path has its own full sweep.
function snapshot(progress, strategy) {
  model.update(progress, { strategy });
  return JSON.stringify({
    atoms: atoms.map((o) => o.position.toArray()),
    bonds: bonds.map((o) => [
      o.visible,
      o.position.toArray(),
      o.scale.toArray(),
      o.quaternion.toArray(),
    ]),
    state: model.group.userData,
  });
}
for (const strategy of ["cam", "c4"])
  for (const progress of [
    0, 0.16, 0.205, 0.22, 0.24, 0.27, 0.32, 0.49, 0.535, 0.55, 0.58, 0.595,
    0.64, 0.77, 1,
  ]) {
    const expected = snapshot(progress, strategy);
    snapshot(0.91, strategy === "cam" ? "c4" : "cam");
    snapshot(0.04, strategy);
    assert.equal(snapshot(progress, strategy), expected);
    assert.equal(model.group.userData.trackedCarbonAtoms, 4);
    assert.equal(model.group.userData.acceptorCarbonAtoms, 3);
    assert.equal(
      model.group.userData.capturedCarbonAtoms,
      progress >= 0.16 ? 1 : 0,
    );
  }
console.log(
  "PASS CAM-TONOPLAST-01: aligned import/export through visible open tonoplast sites",
  {
    crossings,
    transitSamples,
    minCargoClearance,
    minMembraneClearance,
    minHelixClearance,
    maxStep,
    membraneFacesChecked: faces,
  },
);
