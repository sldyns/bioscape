import assert from "node:assert/strict";
import { Box3, Ray, Triangle, Vector3 } from "three";
import pump from "./activeTransportProcess.js";

function triangles(mesh) {
  const geometry = mesh.geometry,
    position = geometry.attributes.position,
    index = geometry.index;
  const result = [];
  for (let i = 0; i < index.count; i += 3) {
    const points = [0, 1, 2].map((j) =>
      new Vector3()
        .fromBufferAttribute(position, index.getX(i + j))
        .applyMatrix4(mesh.matrixWorld),
    );
    result.push(new Triangle(...points));
  }
  return result;
}

// Test actual finite triangle edges against actual rendered triangle surfaces.
// A box overlap or endpoint near the head is insufficient to establish a join.
function surfaceIntersections(source, target) {
  const sourceTriangles = triangles(source),
    targetTriangles = triangles(target),
    point = new Vector3(),
    delta = new Vector3(),
    ray = new Ray();
  let hits = 0;
  for (const triangle of sourceTriangles) {
    for (const [start, end] of [
      [triangle.a, triangle.b],
      [triangle.b, triangle.c],
      [triangle.c, triangle.a],
    ]) {
      const length = delta.subVectors(end, start).length();
      if (length < 1e-9) continue;
      ray.set(start, delta.divideScalar(length));
      for (const other of targetTriangles) {
        if (
          ray.intersectTriangle(other.a, other.b, other.c, false, point) &&
          point.distanceTo(start) <= length + 1e-8
        ) {
          hits++;
          break;
        }
      }
    }
  }
  return hits;
}

const scene = pump.create();
scene.update(0, { energy: "atp" });
scene.group.updateMatrixWorld(true);
const head = scene.group.getObjectByName("beta-subunit-extracellular-domain");
// The position fallback also tests the original, unnamed membrane helix.
const helix =
  scene.group.getObjectByName("beta-subunit-transmembrane-helix") ??
  scene.group.children.find(
    (o) =>
      o.isMesh && o.position.distanceTo(new Vector3(0.63, 0, -0.64)) < 1e-8,
  );
assert(head && helix, "beta subunit geometry missing");
const headBox = new Box3().setFromObject(head),
  helixBox = new Box3().setFromObject(helix),
  gap = headBox.min.y - helixBox.max.y,
  loop = scene.group.getObjectByName("beta-subunit-extracellular-linker");
assert(
  loop,
  `beta head is detached: actual world-space y gap ${gap}; no connecting chain`,
);
const helixHits = surfaceIntersections(loop, helix);
const headHits = head.children
  .filter((o) => o.isMesh)
  .reduce((sum, mesh) => sum + surfaceIntersections(loop, mesh), 0);
assert(
  helixHits > 0,
  "beta linker does not intersect the membrane helix surface",
);
assert(
  headHits > 0,
  "beta linker does not intersect the extracellular head surface",
);

// Both joins must belong to one connected triangle strip, with no detached
// connector fragment that merely touches the other endpoint independently.
const index = loop.geometry.index,
  neighbors = new Map();
for (let i = 0; i < index.count; i += 3) {
  const vertices = [0, 1, 2].map((j) => index.getX(i + j));
  for (const vertex of vertices) {
    if (!neighbors.has(vertex)) neighbors.set(vertex, new Set());
    for (const neighbor of vertices) neighbors.get(vertex).add(neighbor);
  }
}
const visited = new Set(),
  pending = [index.getX(0)];
while (pending.length) {
  const vertex = pending.pop();
  if (visited.has(vertex)) continue;
  visited.add(vertex);
  for (const neighbor of neighbors.get(vertex)) pending.push(neighbor);
}
assert.equal(
  visited.size,
  neighbors.size,
  "beta linker surface is disconnected",
);

const initial = [helix, loop, head].map((o) => o.matrixWorld.toArray());
const nodes = [];
scene.group.traverse((o) => nodes.push(o.uuid));
let states = 0;
for (const energy of ["atp", "none"]) {
  for (const p of [0, 0.2, 0.38, 0.56, 0.71, 0.86, 1, 0.38]) {
    scene.update(p, { energy });
    scene.group.updateMatrixWorld(true);
    assert.deepEqual(
      [helix, loop, head].map((o) => o.matrixWorld.toArray()),
      initial,
      `beta interface changed at ${energy}/${p}`,
    );
    const currentNodes = [];
    scene.group.traverse((o) => currentNodes.push(o.uuid));
    assert.deepEqual(currentNodes, nodes);
    assert(loop.visible && helix.visible && head.visible);
    states++;
  }
}
console.log(
  JSON.stringify({
    test: "pump-beta-connectivity",
    states,
    originalComponentGap: gap,
    helixSurfaceIntersections: helixHits,
    headSurfaceIntersections: headHits,
    connectedSurfaceVertices: visited.size,
    result: "PASS",
  }),
);
