import assert from "node:assert/strict";
import * as THREE from "three";
import { chromatinDetail } from "../src/scene/chromatinDetails.js";
import { nuclearDetail } from "../src/scene/nuclearDetails.js";
const view = new THREE.Vector3(
  0.05084271097105143,
  0.06609552426236684,
  0.9965171350326081,
).normalize();
function firstHit(group, anchor) {
  group.updateMatrixWorld(true);
  const point = new THREE.Vector3(...anchor).applyMatrix4(group.matrixWorld);
  const hit = new THREE.Raycaster(
    point.clone().addScaledVector(view, 10),
    view.clone().negate(),
  ).intersectObject(group, true)[0];
  assert.ok(hit, "landmark has no surface");
  assert.ok(
    hit.point.distanceTo(point) < 1e-5,
    "landmark is occluded or not on the intended surface",
  );
  return hit.object;
}
function dispose(group) {
  group.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
}
for (const [id, parts] of [
  ["chromatin", ["nucleosome", "dna"]],
  ["nucleosome", ["histones", "dna"]],
]) {
  const group = chromatinDetail(id);
  for (const part of parts) {
    assert.ok(
      group.userData.partAnchors?.[part],
      id + " needs a surface anchor for " + part,
    );
    assert.equal(
      firstHit(group, group.userData.partAnchors[part]).userData.hitId,
      part,
    );
  }
  dispose(group);
}
const histones = chromatinDetail("histones");
const colors = ["a58bbc", "c4a2ad", "849db3", "b8b097"];
const names = ["H2A × 2", "H2B × 2", "H3 × 2", "H4 × 2"];
assert.equal(histones.userData.landmarks.length, 4);
histones.userData.landmarks.forEach((landmark, i) => {
  assert.equal(landmark.zh, names[i]);
  assert.equal(landmark.en, names[i]);
  assert.equal(
    firstHit(histones, landmark.position).material.color.getHexString(),
    colors[i],
  );
});
dispose(histones);
for (const [id, expected] of [
  [
    "envelope",
    [
      ["细胞质侧", "Cytoplasmic side"],
      ["核质侧", "Nucleoplasmic side"],
      ["核周隙", "Perinuclear space"],
    ],
  ],
  [
    "outerNuclear",
    [
      ["细胞质侧", "Cytoplasmic side"],
      ["核周隙侧", "Perinuclear-space side"],
    ],
  ],
  [
    "innerNuclear",
    [
      ["核周隙侧", "Perinuclear-space side"],
      ["核质侧", "Nucleoplasmic side"],
      ["核纤层（示意）", "Nuclear lamina (schematic)"],
    ],
  ],
]) {
  const group = nuclearDetail(id);
  assert.deepEqual(
    group.userData.landmarks.map((l) => [l.zh, l.en]),
    expected,
  );
  if (id === "outerNuclear")
    assert.ok(
      group.userData.landmarks[1].position[1] < 0.14,
      "outer membrane inward face borders perinuclear space",
    );
  if (id === "innerNuclear")
    assert.ok(
      group.userData.landmarks[0].position[1] > -0.19,
      "inner membrane outward face borders perinuclear space",
    );
  dispose(group);
}
console.log(
  "Molecular structure labels: membrane compartments bilingual; chromatin/nucleosome and all histone anchors land on correct visible surfaces.",
);
