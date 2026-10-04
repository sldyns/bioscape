import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import apoptosis from "./apoptosisProcess.js";

function visible(node) {
  for (let p = node; p; p = p.parent) if (!p.visible) return false;
  return true;
}
function meshes(nodes) {
  const result = [];
  for (const node of nodes)
    node.traverse((o) => {
      if (o.isMesh) result.push(o);
    });
  return result;
}
// Bake complete visible triangles, including each lipid-head instance with its
// actual instance matrix. An untransformed unit sphere is not that head's wall.
function trianglesInFrame(nodes, frame) {
  const array = [],
    point = new THREE.Vector3();
  const inverse = frame.matrixWorld.clone().invert();
  for (const mesh of meshes(nodes)) {
    if (!visible(mesh)) continue;
    const geometry = mesh.geometry,
      p = geometry.attributes.position,
      index = geometry.index;
    const start = geometry.drawRange.start;
    const end = Math.min(
      index ? index.count : p.count,
      start + geometry.drawRange.count,
    );
    const base = inverse.clone().multiply(mesh.matrixWorld);
    const instances = mesh.isInstancedMesh ? mesh.count : 1;
    for (let instance = 0; instance < instances; instance++) {
      const matrix = base.clone();
      if (mesh.isInstancedMesh) {
        const local = new THREE.Matrix4();
        mesh.getMatrixAt(instance, local);
        matrix.multiply(local);
      }
      for (let i = start; i < end; i++) {
        point
          .fromBufferAttribute(p, index ? index.getX(i) : i)
          .applyMatrix4(matrix);
        array.push(point.x, point.y, point.z);
      }
    }
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.Float32BufferAttribute(array, 3));
  result.boundsTree = new MeshBVH(result);
  return result;
}

const model = apoptosis.create();
const {
  apoptosome,
  arms,
  nuclearSurfaces,
  mitochondrialMembranes,
  mito,
  plasma,
} = model.science;
const cell = apoptosome.parent;
const parts = meshes([apoptosome]);
const originalGeometry = new Map(parts.map((mesh) => [mesh, mesh.geometry]));
const geometryHash = () => {
  const hash = createHash("sha256");
  for (const mesh of parts)
    hash.update(Buffer.from(mesh.geometry.attributes.position.array.buffer));
  return hash.digest("hex");
};
const originalHash = geometryHash();
model.update(0.36);
model.group.updateMatrixWorld(true);
const mitochondrialGeometry = trianglesInFrame(mitochondrialMembranes, mito);
const nuclearTrees = nuclearSurfaces.map((mesh) => ({
  mesh,
  tree: new MeshBVH(mesh.geometry.clone()),
}));
const poses = new Map(),
  clearances = [];
let verticesChecked = 0,
  testedPoses = 0;
const progress = [
  0,
  0.175,
  0.305,
  ...Array.from({ length: 21 }, (_, i) => 0.36 + i * 0.01),
  0.445,
  0.46,
  0.605,
  0.62,
  0.7,
  0.76,
  0.78,
  0.81,
  0.825,
  0.89,
  0.94,
  0.97,
  1,
  0.445,
  0.94,
  0.36,
  0.605,
];
for (const condition of ["stress", "noStress"]) {
  for (const p of progress) {
    model.update(p, { condition });
    model.group.updateMatrixWorld(true);
    if (condition === "noStress" || p < 0.36) {
      assert.equal(
        apoptosome.visible,
        false,
        "blocked/before-release conditions retain the hidden assembly",
      );
      continue;
    }
    const binding = model.science.labelAnchors[3];
    const expectedAnchor = new THREE.Vector3()
      .fromArray(binding.local || [0, 0, 0])
      .applyMatrix4(binding.target.matrixWorld);
    assert(
      expectedAnchor.distanceTo(
        new THREE.Vector3().fromArray(binding.label.position),
      ) < 1e-8,
      "label follows the actual moved Apaf domain",
    );
    const snapshot = JSON.stringify(
      parts.map((mesh) => mesh.matrixWorld.elements),
    );
    const key = `${condition}:${p}`;
    if (poses.has(key))
      assert.equal(
        snapshot,
        poses.get(key),
        "arbitrary seek restores the same complete protein pose",
      );
    poses.set(key, snapshot);
    const mitoInverse = mito.matrixWorld.clone().invert();
    const cellInverse = cell.matrixWorld.clone().invert();
    const plasmaGeometry = trianglesInFrame([plasma.mesh], cell);
    let maxField = -Infinity;
    for (const mesh of parts) {
      if (!visible(mesh)) continue;
      assert.equal(
        mesh.geometry,
        originalGeometry.get(mesh),
        "retain complete original Apaf geometry",
      );
      for (const { mesh: barrier, tree } of nuclearTrees) {
        if (!visible(barrier)) continue;
        const matrix = barrier.matrixWorld
          .clone()
          .invert()
          .multiply(mesh.matrixWorld);
        assert.equal(
          tree.intersectsGeometry(mesh.geometry, matrix),
          false,
          `Apaf crosses intact nuclear surface at p=${p}`,
        );
      }
      assert.equal(
        mitochondrialGeometry.boundsTree.intersectsGeometry(
          mesh.geometry,
          mitoInverse.clone().multiply(mesh.matrixWorld),
        ),
        false,
        `Apaf crosses actual mitochondrial membranes/heads at p=${p}`,
      );
      const matrix = cellInverse.clone().multiply(mesh.matrixWorld);
      assert.equal(
        plasmaGeometry.boundsTree.intersectsGeometry(mesh.geometry, matrix),
        false,
        `Apaf crosses actual plasma membrane at p=${p}`,
      );
      const v = new THREE.Vector3(),
        positions = mesh.geometry.attributes.position;
      const nuclearInverse = nuclearSurfaces[0].matrixWorld
        .clone()
        .invert()
        .multiply(mesh.matrixWorld);
      const nuclearPoint = new THREE.Vector3();
      for (let i = 0; i < positions.count; i++) {
        v.fromBufferAttribute(positions, i).applyMatrix4(matrix);
        const field = plasma.field(v.x, v.y, v.z);
        assert(field < 0, `complete protein vertex outside cell at p=${p}`);
        maxField = Math.max(maxField, field);
        if (visible(nuclearSurfaces[0])) {
          nuclearPoint
            .fromBufferAttribute(positions, i)
            .applyMatrix4(nuclearInverse);
          assert(
            nuclearPoint.length() > 1,
            `complete protein vertex inside intact nucleus at p=${p}`,
          );
        }
        verticesChecked++;
      }
    }
    if (
      [0.36, 0.445, 0.46].includes(p) &&
      !clearances.some((row) => row.p === p)
    ) {
      const protein = trianglesInFrame([apoptosome], cell);
      const ne = trianglesInFrame(nuclearSurfaces, cell);
      const mt = trianglesInFrame(mitochondrialMembranes, cell);
      const distance = (geometry) =>
        geometry.boundsTree.closestPointToGeometry(protein, new THREE.Matrix4())
          .distance;
      clearances.push({
        p,
        nuclearSurfaceGap: distance(ne),
        mitochondrialSurfaceGap: distance(mt),
        plasmaSurfaceGap: distance(plasmaGeometry),
        maxCellField: maxField,
        intersections: 0,
      });
      ne.dispose();
      mt.dispose();
      protein.dispose();
    }
    if (p >= 0.56) {
      assert.equal(arms.length, 7, "retain the seven original Apaf subunits");
      for (const arm of arms)
        assert(
          arm.position.length() < 1e-12,
          "same assembled heptamer endpoint",
        );
    }
    plasmaGeometry.dispose();
    testedPoses++;
  }
}
// Negative controls restore the former trajectory/terminal center on the same
// complete surfaces: the geometric regressions must reject those exact errors.
model.update(0.445, { condition: "stress" });
for (const arm of arms) arm.position.multiplyScalar(0.72 / 0.4);
model.group.updateMatrixWorld(true);
const oldRadiusNuclearIntersections = parts.filter(
  (mesh) =>
    visible(mesh) &&
    nuclearTrees[0].tree.intersectsGeometry(
      mesh.geometry,
      nuclearSurfaces[0].matrixWorld
        .clone()
        .invert()
        .multiply(mesh.matrixWorld),
    ),
).length;
assert(
  oldRadiusNuclearIntersections > 0,
  "restoring former free-arm radius must reproduce a real nuclear-wall crossing",
);
model.update(1, { condition: "stress" });
apoptosome.position.set(1.25, -0.88, 0.1);
model.group.updateMatrixWorld(true);
const oldCellInverse = cell.matrixWorld.clone().invert();
let oldTerminalCenterVerticesOutsideCell = 0;
for (const mesh of parts) {
  if (!visible(mesh)) continue;
  const matrix = oldCellInverse.clone().multiply(mesh.matrixWorld),
    v = new THREE.Vector3(),
    position = mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).applyMatrix4(matrix);
    if (plasma.field(v.x, v.y, v.z) > 0) oldTerminalCenterVerticesOutsideCell++;
  }
}
assert(
  oldTerminalCenterVerticesOutsideCell > 0,
  "restoring the stationary center must reproduce escape from the contracting remnant",
);
model.update(1, { condition: "stress" });

assert.equal(
  geometryHash(),
  originalHash,
  "all original protein surface position bytes are unchanged",
);
assert.equal(
  clearances.length,
  3,
  "all three required critical poses have exact surface-clearance evidence",
);
const report = {
  testedPoses,
  verticesChecked,
  mitochondrialTriangleCount:
    mitochondrialGeometry.attributes.position.count / 3,
  clearances,
  geometryUnchanged: true,
  negativeControls: {
    oldRadiusNuclearIntersections,
    oldTerminalCenterVerticesOutsideCell,
  },
  conditions: ["stress", "noStress"],
};
if (process.env.SIGNALS_CYTOSOL_REPORT)
  fs.writeFileSync(
    process.env.SIGNALS_CYTOSOL_REPORT,
    JSON.stringify(report, null, 2) + "\n",
  );
console.log(
  `signals-apoptosome-cytosol: ${testedPoses} visible poses, ${verticesChecked} full protein vertex checks; actual nuclear/mitochondrial/plasma triangles clear, both controls and reverse seeks PASS`,
);
