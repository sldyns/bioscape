import assert from "node:assert/strict";
import biofilm from "./biofilmProcess.js";
const scene = biofilm.create();
scene.update(0.7, { cue: "none" });
const footprint = scene.group.getObjectByName("surface-attached-Psl-footprint");
assert(footprint.visible && footprint.children.length === 14);
for (const strand of footprint.children) {
  const points = strand.geometry.parameters.path.points;
  assert(
    points.every((p) => p.y >= -1.73 && p.y <= -1.68),
    "Psl footprint rests on substrate",
  );
}
const cells = Array.from({ length: 24 }, (_, i) =>
  scene.group.getObjectByName(`biofilm-cell-${i}`),
);
assert(
  cells.filter((c) => c.position.y < -1.5).length >= 9,
  "broad basal population",
);
assert(
  Math.max(...cells.map((c) => c.position.y)) <= -0.49,
  "microcolonies remain low and surface connected",
);
const resourceSet = new Set();
scene.group.traverse((n) => {
  resourceSet.add(n);
  if (n.geometry) resourceSet.add(n.geometry);
  if (n.material) resourceSet.add(n.material);
});
for (const cue of ["NO", "none"]) {
  scene.update(0.95, { cue });
  const saved = cells.map((c) => c.position.toArray());
  scene.update(0.2, { cue });
  scene.update(0.95, { cue });
  assert.deepEqual(
    cells.map((c) => c.position.toArray()),
    saved,
  );
  assert.equal(scene.group.userData.releasedCells, cue === "NO" ? 4 : 0);
}
scene.group.traverse((n) => {
  assert(resourceSet.has(n));
  if (n.geometry) assert(resourceSet.has(n.geometry));
  if (n.material) assert(resourceSet.has(n.material));
});
console.log(
  "biofilm refinement: attached footprint, broad basal population, low colony, branch state and stable resources passed",
);

scene.update(0.7, { cue: "none" });
const centers = cells.map((cell) => cell.position.clone());
const bridges = [];
scene.group.traverse((node) => {
  if (node.name === "Psl-fiber-bundle-and-oligosaccharide-repeat-motifs")
    bridges.push(node);
});
const endpoints = centers.slice(3).map((center, offset) => {
  const index = offset + 3;
  let nearest = 0,
    distance = Infinity;
  for (let j = 0; j < index; j++) {
    const next = center.distanceToSquared(centers[j]);
    if (next < distance) {
      distance = next;
      nearest = j;
    }
  }
  return [index, nearest];
});
let previous = bridges.map(() => 0);
for (let sample = 280; sample <= 700; sample++) {
  scene.update(sample / 1000, { cue: "none" });
  bridges.forEach((bridge, i) => {
    if (bridge.visible) {
      assert(
        endpoints[i].every((j) => cells[j].scale.x > 0.75),
        "bridge appears only after both endpoint cells grow",
      );
      assert(
        bridge.scale.x - previous[i] < 0.06,
        "individual scaffold birth ramps continuously",
      );
    }
    previous[i] = bridge.visible ? bridge.scale.x : 0;
  });
}
console.log(
  "biofilm Psl birth: all bridges supported by grown endpoint cells and bounded continuous per-fiber scale ramp",
);

// Geometric support witness: a growing cell either intersects the substrate,
// overlaps an attached neighbor, or intersects a visible Psl mesh vertex.
// Test transformed mesh geometry, rather than a claimed attachment state flag.
import * as THREE from "three";
const point = new THREE.Vector3();
let supportedBirthStates = 0;
for (let sample = 281; sample < 700; sample++) {
  scene.update(sample / 1000, { cue: "none" });
  scene.group.updateMatrixWorld(true);
  for (let i = 3; i < cells.length; i++) {
    const cell = cells[i],
      growth = cell.scale.x;
    if (!cell.visible || growth < 0.05 || growth > 0.99) continue;
    const body = cell.children[0];
    const center = cell.getWorldPosition(new THREE.Vector3());
    // Each unit-sphere vertex transforms into the true rendered cell surface.
    const vertices = body.geometry.attributes.position;
    let supported = false;
    for (let vertex = 0; vertex < vertices.count && !supported; vertex++) {
      point.fromBufferAttribute(vertices, vertex);
      body.localToWorld(point);
      supported = point.y <= -1.72;
    }
    for (let j = 0; j < cells.length && !supported; j++) {
      if (j === i || !cells[j].visible || centers[j].y > centers[i].y + 0.1)
        continue;
      point.copy(center);
      cells[j].children[0].worldToLocal(point);
      supported = point.lengthSq() < 0.95 ** 2;
      for (let v = 0; v < vertices.count && !supported; v++) {
        point.fromBufferAttribute(vertices, v);
        body.localToWorld(point);
        cells[j].children[0].worldToLocal(point);
        supported = point.lengthSq() < 0.99 ** 2;
      }
    }
    for (const bridge of [...bridges, footprint]) {
      if (!bridge.visible || supported) continue;
      for (const mesh of bridge.children) {
        if (mesh.geometry?.type !== "TubeGeometry") continue;
        const meshVertices = mesh.geometry.attributes.position;
        for (let v = 0; v < meshVertices.count && !supported; v++) {
          point.fromBufferAttribute(meshVertices, v);
          mesh.localToWorld(point);
          body.worldToLocal(point);
          supported = point.lengthSq() < 0.99 ** 2;
        }
      }
    }
    if (!supported) {
      const tether = scene.group.getObjectByName(`Psl-adhesion-tether-${i}`);
      if (tether.visible) {
        const tetherVertices = tether.geometry.attributes.position;
        for (let v = 0; v < tetherVertices.count && !supported; v++) {
          point.fromBufferAttribute(tetherVertices, v);
          tether.localToWorld(point);
          body.worldToLocal(point);
          supported = point.lengthSq() < 0.99 ** 2;
        }
      }
    }
    assert(
      supported,
      `cell ${i} at ${sample / 1000} growth ${growth} has an actual substrate/cell/Psl support witness`,
    );
    supportedBirthStates++;
  }
}
assert(supportedBirthStates > 1000);
console.log(
  `biofilm birth: ${supportedBirthStates} actual transformed-geometry support witnesses`,
);
