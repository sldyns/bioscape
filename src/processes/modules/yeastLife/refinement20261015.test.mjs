import assert from "node:assert/strict";
import * as THREE from "three";
import fermentation from "./yeastFermentationProcess.js";
import sporulation from "./yeastSporulationProcess.js";

const enzymeScene = fermentation.create();
for (const name of ["fermentation-pdc", "fermentation-adh"]) {
  const enzyme = enzymeScene.group.getObjectByName(name);
  const domains = enzyme.children.filter(
    (o) => o.name === "enzyme-folded-domain" || o.name.endsWith("label-target"),
  );
  assert.equal(domains.length, 7);
  const lips = enzyme.children.filter(
    (o) => o.name === "open-enzyme-cleft-lip",
  );
  assert.equal(lips.length, 2);
  assert.equal(lips[0].geometry, lips[1].geometry, "cleft lips share a buffer");
  assert(
    lips[0].geometry.parameters.arc < Math.PI,
    "pocket lips leave open substrate entry",
  );
  assert.notEqual(
    Math.abs(domains[0].position.x),
    Math.abs(domains[3].position.x),
    "enzyme contour is not a radial flower",
  );
}
const scene = sporulation.create();
const bundles = [];
scene.group.traverse((o) => {
  if (o.name === "meiotic-spindle-parallel-fibers") bundles.push(o);
});
assert.equal(bundles.length, 3);
assert.equal(
  new Set(bundles.map((o) => o.geometry)).size,
  1,
  "all spindle fibers reuse the kit cylinder",
);
const identities = bundles.map((o) => [
  o.uuid,
  o.geometry.uuid,
  Array.from(o.instanceMatrix.array),
]);
for (const p of [0, 0.4, 0.51, 0.65, 1, 0.4]) {
  scene.update(p);
  scene.group.updateMatrixWorld(true);
  for (let i = 0; i < bundles.length; i++) {
    const bundle = bundles[i];
    assert.deepEqual(
      [
        bundle.uuid,
        bundle.geometry.uuid,
        Array.from(bundle.instanceMatrix.array),
      ],
      identities[i],
    );
    assert.equal(bundle.count, 6);
    // Local fibers span exactly the original spindle length. Their transverse
    // endpoints stay inside each pole body rather than floating past it.
    const m = bundle.instanceMatrix.array;
    for (let j = 0; j < 6; j++) {
      assert.equal(m[j * 16 + 5], 1);
      const radial =
        Math.hypot(m[j * 16 + 12], m[j * 16 + 14]) * bundle.parent.scale.x;
      assert(radial <= 0.04 + 1e-7);
    }
  }
}
console.log("2026-10-15 enzyme cleft / shared spindle bundle invariants pass");

for (const p of [0.7, 1, 0.7, 1]) {
  scene.update(p);
  for (let i = 0; i < 4; i++) {
    for (const kind of ["outer-prospore-membrane", "persistent-spore-pm"]) {
      const geometry = scene.group.getObjectByName(
        `sporulation-${kind}-${i}`,
      ).geometry;
      assert.equal(
        geometry.index.count,
        24 * 36 * 6,
        "closed topology retained",
      );
      assert.equal(
        geometry.drawRange.count,
        (p >= 0.84 ? 14 : 24) * 36 * 6,
        "mature viewing cut is deterministic and resets",
      );
    }
  }
}

// Measure the actual indexed triangles submitted by this mesh, including its
// drawRange and complete world transform. Full but undisplayed vertices do not
// establish a physical annotation target.
function displayedMembraneDistance(mesh, position) {
  const vertices = mesh.geometry.attributes.position,
    indices = mesh.geometry.index,
    start = mesh.geometry.drawRange.start,
    end = Math.min(indices.count, start + mesh.geometry.drawRange.count),
    target = new THREE.Vector3().fromArray(position),
    triangle = new THREE.Triangle(),
    closest = new THREE.Vector3();
  mesh.updateWorldMatrix(true, false);
  let nearest = Infinity;
  for (let i = start; i + 2 < end; i += 3) {
    for (const [offset, point] of [
      [0, triangle.a],
      [1, triangle.b],
      [2, triangle.c],
    ]) {
      point
        .fromBufferAttribute(vertices, indices.getX(i + offset))
        .applyMatrix4(mesh.matrixWorld);
    }
    triangle.closestPointToPoint(target, closest);
    nearest = Math.min(nearest, target.distanceTo(closest));
  }
  return nearest;
}

// Traverse the closure/cut boundary in both directions, including the inhibited
// control, and retain object/buffer/position-array identity under parent poses.
{
  const reviewed = sporulation.create(),
    outer = reviewed.group.getObjectByName(
      "sporulation-outer-prospore-membrane-1",
    ),
    label = reviewed.labels[5],
    labelPosition = label.position,
    geometry = outer.geometry,
    vertexBuffer = geometry.attributes.position.array,
    indexBuffer = geometry.index.array,
    parent = new THREE.Group();
  parent.position.set(0.7, -0.4, 0.3);
  parent.rotation.set(0.17, -0.28, 0.11);
  parent.scale.set(1.13, 0.87, 1.06);
  parent.add(reviewed.group);
  reviewed.group.position.set(-0.2, 0.16, -0.08);
  reviewed.group.rotation.set(-0.12, 0.21, 0.08);
  reviewed.group.scale.set(0.94, 1.07, 0.91);
  const progress = [
      0, 0.59, 0.649999, 0.65, 0.68, 0.7, 0.76, 0.799999, 0.8, 0.82, 0.829999,
      0.83, 0.839, 0.839999, 0.84, 0.840001, 0.85, 0.86, 0.869, 0.869999, 0.87,
      0.9, 1,
    ],
    repeats = new Map();
  for (const nutrients of ["starved", "rich", "starved"]) {
    for (const p of [...progress, ...progress.toReversed(), ...progress]) {
      reviewed.update(p, { nutrients });
      parent.updateMatrixWorld(true);
      assert.equal(
        label.active,
        nutrients === "starved" && p >= 0.65 && p < 0.87,
      );
      assert.equal(
        label.position,
        labelPosition,
        "reuse the annotation position array",
      );
      assert.equal(
        outer.geometry,
        geometry,
        "retain the full membrane geometry",
      );
      assert.equal(geometry.attributes.position.array, vertexBuffer);
      assert.equal(geometry.index.array, indexBuffer);
      if (label.active) {
        assert(outer.visible, "active membrane target is actually visible");
        const distance = displayedMembraneDistance(outer, label.position);
        assert(
          distance < 1e-6,
          `active membrane leader must meet a displayed triangle at p=${p}; distance=${distance}`,
        );
      }
      const key = `${nutrients}:${p}`;
      if (repeats.has(key)) assert.deepEqual(label.position, repeats.get(key));
      else repeats.set(key, [...label.position]);
    }
  }
}
console.log(
  "Sporulation membrane leader meets displayed triangles across the viewing cut",
);
