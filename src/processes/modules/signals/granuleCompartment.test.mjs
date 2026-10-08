import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import immune from "./immuneResponseProcess.js";

test("immune cytotoxic granules remain cytoplasmic throughout recognition and polarization", () => {
  const scene = immune.create(),
    { tcell } = scene.science;
  const nucleus = tcell.children.find(
      (o) => o.isMesh && o.scale.x === 0.66 && o.scale.y === 0.85,
    ),
    cell = tcell.children.find(
      (o) =>
        o.isMesh &&
        o.scale.x === 1.3 &&
        o.geometry.parameters.phiLength === Math.PI * 2,
    ),
    granules = tcell.children.filter(
      (o) => o.isMesh && o.material?.color.getHexString() === "af9a7c",
    );
  assert.ok(nucleus && cell);
  assert.equal(granules.length, 5);
  scene.group.updateMatrixWorld(true);
  const nucleusGeometry = nucleus.geometry.clone().applyMatrix4(nucleus.matrix),
    cellGeometry = cell.geometry.clone().applyMatrix4(cell.matrix),
    nuclearTree = new MeshBVH(nucleusGeometry),
    cellTree = new MeshBVH(cellGeometry),
    nuclearInverse = nucleus.matrix.clone().invert(),
    cellInverse = cell.matrix.clone().invert(),
    point = new THREE.Vector3();
  const progress = [
    0,
    0.19,
    0.35,
    0.5,
    0.72,
    0.81,
    0.9,
    ...Array.from({ length: 401 }, (_, i) => 0.92 + (0.08 * i) / 400),
  ];
  let poses = 0,
    vertices = 0,
    minimumNuclearClearance = Infinity,
    minimumCellClearance = Infinity,
    minimumPairClearance = Infinity;
  const snapshot = () =>
    JSON.stringify(granules.map((o) => [o.visible, ...o.position.toArray()]));
  function check(p, epitope) {
    scene.update(p, { epitope });
    for (const [i, granule] of granules.entries()) {
      assert.ok(granule.visible);
      const radius = granule.scale.x,
        center = granule.position;
      assert.equal(radius, 0.1, "do not shrink the original granules");
      assert.ok(
        center.clone().applyMatrix4(nuclearInverse).length() > 1,
        `granule ${i} center is nuclear: ${epitope}, p=${p}`,
      );
      assert.ok(
        center.clone().applyMatrix4(cellInverse).length() < 1,
        `granule ${i} center is extracellular: ${epitope}, p=${p}`,
      );
      const nuclearClearance =
          nuclearTree.closestPointToPoint(center).distance - radius,
        cellClearance = cellTree.closestPointToPoint(center).distance - radius;
      minimumNuclearClearance = Math.min(
        minimumNuclearClearance,
        nuclearClearance,
      );
      minimumCellClearance = Math.min(minimumCellClearance, cellClearance);
      assert.ok(
        nuclearClearance > 1e-4,
        `whole granule ${i} intersects nucleus`,
      );
      assert.ok(
        cellClearance > 1e-4,
        `whole granule ${i} crosses cell membrane`,
      );
      granule.updateMatrix();
      const position = granule.geometry.attributes.position;
      for (let v = 0; v < position.count; v++) {
        point.fromBufferAttribute(position, v).applyMatrix4(granule.matrix);
        assert.ok(point.clone().applyMatrix4(nuclearInverse).length() > 1);
        assert.ok(point.applyMatrix4(cellInverse).length() < 1);
        vertices++;
      }
      for (let j = 0; j < i; j++) {
        const clearance =
          center.distanceTo(granules[j].position) -
          radius -
          granules[j].scale.x;
        minimumPairClearance = Math.min(minimumPairClearance, clearance);
        assert.ok(
          clearance > 1e-4,
          "retain five separated granules, including the final cluster",
        );
      }
    }
    poses++;
  }
  for (const epitope of ["matched", "unmatched"]) {
    scene.update(0, { epitope });
    const start = snapshot();
    for (const p of progress) {
      check(p, epitope);
      if (epitope === "unmatched") assert.equal(snapshot(), start);
    }
    for (const p of [0.96, 0, 0.997, 0.934, 1, 0.951]) {
      check(p, epitope);
      const saved = snapshot();
      scene.update(0.98, {
        epitope: epitope === "matched" ? "unmatched" : "matched",
      });
      scene.update(0.05, { epitope });
      check(p, epitope);
      assert.equal(
        snapshot(),
        saved,
        "condition changes and reverse seeks must reset all granules",
      );
    }
  }
  console.log(
    `immune granule compartments: ${poses} poses, ${vertices} vertices; min nucleus/cell/pair clearances ${minimumNuclearClearance.toFixed(6)}/${minimumCellClearance.toFixed(6)}/${minimumPairClearance.toFixed(6)}`,
  );
});
