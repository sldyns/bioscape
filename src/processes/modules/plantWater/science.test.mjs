import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import process from "./chloroplastMovementProcess.js";
import { ease } from "../../kit.js";

// plantWater-01: test the finite-size, rendered organelles, including every
// instance of the internal grana. Centers alone missed the original defect.
const model = process.create({ rootId: "plant" });
const membrane = model.group.getObjectByName("cell plasma membrane boundary");
const vacuole = model.group.getObjectByName("central vacuole");
const plastids = model.group.children.filter((n) =>
  n.name.startsWith("chloroplast cutaway:"),
);
assert(membrane && vacuole);
assert.equal(plastids.length, 16);
model.group.updateMatrixWorld(true);
const cellBox = new THREE.Box3().setFromObject(membrane);
assert.deepEqual(
  cellBox.getSize(new THREE.Vector3()).toArray(),
  [5, 5.300000190734863, 3],
);
const cellInverse = membrane.matrixWorld.clone().invert();
const vacInverse = vacuole.matrixWorld.clone().invert();
const nodes = [],
  geometries = new Set(),
  materials = new Set();
model.group.traverse((n) => {
  nodes.push(n);
  if (n.geometry) geometries.add(n.geometry);
  if (n.material) materials.add(n.material);
});
const temp = new THREE.Vector3(),
  instance = new THREE.Matrix4(),
  relative = new THREE.Matrix4();
function localVertices(plastid) {
  const result = [],
    inverse = plastid.matrixWorld.clone().invert();
  plastid.traverse((n) => {
    if (!n.geometry) return;
    const p = n.geometry.attributes.position;
    for (let item = 0; item < (n.isInstancedMesh ? n.count : 1); item++) {
      relative.multiplyMatrices(inverse, n.matrixWorld);
      if (n.isInstancedMesh) {
        n.getMatrixAt(item, instance);
        relative.multiply(instance);
      }
      for (let i = 0; i < p.count; i++) {
        temp.fromBufferAttribute(p, i).applyMatrix4(relative);
        result.push(temp.x, temp.y, temp.z);
      }
    }
  });
  return new Float64Array(result);
}
function structuralSignature() {
  const hash = createHash("sha256");
  for (const g of geometries) {
    for (const a of Object.values(g.attributes))
      hash.update(
        Buffer.from(a.array.buffer, a.array.byteOffset, a.array.byteLength),
      );
    if (g.index) hash.update(Buffer.from(g.index.array.buffer));
  }
  for (const n of nodes)
    if (n.instanceMatrix)
      hash.update(Buffer.from(n.instanceMatrix.array.buffer));
  return hash.digest("hex");
}
const initialStructure = structuralSignature();
const vertexSets = plastids.map(localVertices);
const transform = new THREE.Matrix4(),
  vacTransform = new THREE.Matrix4();
const normalizedBox = new THREE.Box3(),
  closest = new THREE.Vector3(),
  origin = new THREE.Vector3();
let minCellClearance = Infinity,
  minVacDistance = Infinity;
function geometryResult(plastid, points) {
  transform.multiplyMatrices(cellInverse, plastid.matrixWorld);
  vacTransform.multiplyMatrices(vacInverse, plastid.matrixWorld);
  normalizedBox.makeEmpty();
  let clearance = Infinity;
  for (let i = 0; i < points.length; i += 3) {
    temp.fromArray(points, i).applyMatrix4(transform);
    assert(Number.isFinite(temp.x + temp.y + temp.z));
    clearance = Math.min(
      clearance,
      2.5 - Math.abs(temp.x),
      2.65 - Math.abs(temp.y),
      1.5 - Math.abs(temp.z),
    );
    temp.fromArray(points, i).applyMatrix4(vacTransform);
    normalizedBox.expandByPoint(temp);
  }
  // The inverse vacuole transform maps its complete ellipsoid to the unit
  // sphere. Its conservative organelle AABB contains ALL triangles/volume.
  // If even this enclosing box is outside the sphere, no intervening triangle
  // can cross it. This is not a nearest-vertex distance-to-surface assertion.
  const distance = normalizedBox.clampPoint(origin, closest).length();
  return { clearance, distance };
}
function signature() {
  const hash = createHash("sha256");
  model.group.traverse((n) => {
    hash.update(
      JSON.stringify([
        n.visible,
        ...n.position.toArray(),
        ...n.scale.toArray(),
        ...n.quaternion.toArray(),
      ]),
    );
    if (n.geometry)
      for (const a of Object.values(n.geometry.attributes))
        hash.update(
          Buffer.from(a.array.buffer, a.array.byteOffset, a.array.byteLength),
        );
    if (n.instanceMatrix)
      hash.update(Buffer.from(n.instanceMatrix.array.buffer));
  });
  return hash.digest("hex");
}
function assertStableAndFinite() {
  let count = 0;
  model.group.traverse((n) => {
    count++;
    assert(nodes.includes(n));
    if (n.geometry) {
      assert(geometries.has(n.geometry));
      for (const a of Object.values(n.geometry.attributes))
        assert(a.array.every(Number.isFinite));
    }
    if (n.material) assert(materials.has(n.material));
    if (n.instanceMatrix) assert(n.instanceMatrix.array.every(Number.isFinite));
  });
  assert.equal(count, nodes.length);
}
const samples = new Set([
  NaN,
  -0.1,
  1.1,
  0.235,
  0.725,
  ...process.stages.map((s) => s.at),
]);
for (let step = 0; step <= 400; step++) samples.add(step / 400);
for (const genotype of ["wild", "phot2"]) {
  for (const progress of samples) {
    model.update(progress, { genotype });
    model.group.updateMatrixWorld(true);
    // The immutable-local-vertex cache is valid only while every real geometry
    // and instance buffer stays unchanged; verify that on every sampled frame.
    assert.equal(structuralSignature(), initialStructure);
    let sceneNodeCount = 0;
    model.group.traverse((n) => {
      sceneNodeCount++;
      assert(nodes.includes(n));
      if (n.geometry) assert(geometries.has(n.geometry));
      if (n.material) assert(materials.has(n.material));
    });
    assert.equal(sceneNodeCount, nodes.length);
    for (let i = 0; i < plastids.length; i++) {
      const result = geometryResult(plastids[i], vertexSets[i]);
      assert(
        result.clearance > 0.015,
        `${genotype} p=${progress} plastid ${i} crosses cell: clearance=${result.clearance}`,
      );
      assert(
        result.distance > 1.015,
        `${genotype} p=${progress} plastid ${i} enters vacuole: enclosing-box distance=${result.distance}`,
      );
      minCellClearance = Math.min(minCellClearance, result.clearance);
      minVacDistance = Math.min(minVacDistance, result.distance);
    }
  }
  model.update(0.725, { genotype });
  const before = signature();
  model.update(0.235, { genotype });
  model.update(0.725, { genotype });
  assert.equal(signature(), before);
  assertStableAndFinite();
  model.update(0.4, { genotype });
  assert(
    plastids.every(
      (c) =>
        Math.abs(c.rotation.z) < 1e-9 && Math.abs(c.position.y + 2.4) < 1e-9,
    ),
  );
  model.update(1, { genotype });
  assert(
    plastids.every((c) =>
      genotype === "wild"
        ? Math.abs(Math.abs(c.rotation.z) - Math.PI / 2) < 1e-9
        : Math.abs(c.rotation.z) < 1e-9,
    ),
  );
}

// Negative controls reproduce the two audited legacy frames on actual meshes.
// They demonstrate that this regression rejects the original visual defect.
function legacyPlacement(c, i, p) {
  const acc = ease(p, 0.1, 0.35),
    avoid = ease(p, 0.54, 0.92),
    col = i % 4,
    side = col < 2 ? -1 : 1;
  const sx = -1.74 + col * 1.16,
    sideY = -0.95 + (col % 2) * 2;
  const descent = ease(acc, 0, 0.55),
    spread = ease(acc, 0.55, 1),
    edge = ease(avoid, 0, 0.45),
    rise = ease(avoid, 0.45, 1);
  const baseX = side * 2.32 + (sx - side * 2.32) * spread,
    baseY = sideY + (-2.39 - sideY) * descent;
  c.position.set(
    baseX + (side * 2.32 - baseX) * edge,
    baseY + (sideY - baseY) * rise,
    -1.04 + Math.floor(i / 4) * 0.69,
  );
  c.rotation.set(
    0,
    0,
    (-side * ((1 - spread) * (1 - avoid) + rise) * Math.PI) / 2,
  );
}
for (const [p, i] of [
  [0.235, 1],
  [0.725, 0],
]) {
  legacyPlacement(plastids[i], i, p);
  model.group.updateMatrixWorld(true);
  assert(
    geometryResult(plastids[i], vertexSets[i]).clearance < -0.1,
    `Legacy p=${p} must fail containment`,
  );
}
model.update(0);
// plantWater-02: publisher-confirmed author/title/DOI identity.
const source = process.sources.find(
  (s) => s.url === "https://www.nature.com/articles/35073622",
);
assert.equal(
  source.title,
  "Jarillo et al. — Phototropin-related NPL1 controls chloroplast relocation induced by blue light",
);
console.log(
  `plantWater science PASS: ${samples.size} progress inputs × 2 genotypes × 16 complete plastids; minimum cell clearance ${minCellClearance.toFixed(4)}, conservative vacuole distance ${minVacDistance.toFixed(4)}; legacy failures detected; citation, endpoints and resources verified.`,
);
