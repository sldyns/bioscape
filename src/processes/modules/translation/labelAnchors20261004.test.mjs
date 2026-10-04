import assert from "node:assert/strict";
import * as THREE from "three";
import { processesByRoot } from "../../catalog.js";
import translation from "./translationProcess.js";
import folding from "./proteinFoldingProcess.js";
import splicing from "./alternativeSplicingProcess.js";
import nitrogen from "./nitrogenFixationProcess.js";

const V = () => new THREE.Vector3();
const object = (s, name) => {
  const found = s.group.getObjectByName(name);
  assert(found, `missing actual geometry: ${name}`);
  return found;
};
const world = (o) => o.getWorldPosition(V());
function visible(o) {
  for (let n = o; n; n = n.parent) if (!n.visible) return false;
  return true;
}
function anchor(s, i, expected, target, tolerance = 1e-6) {
  const p = new THREE.Vector3(...s.labels[i].position);
  assert(
    p.distanceTo(expected) < tolerance,
    `${s.group.userData.process} label ${i} detached from geometry`,
  );
  if (s.labels[i].active !== false)
    assert(visible(target), `active label ${i} points to hidden geometry`);
}
function atObject(s, i, name) {
  const o = object(s, name);
  anchor(s, i, world(o), o);
}
function atSurface(s, i, name) {
  const o = object(s, name),
    a = o.geometry.attributes.position;
  // Check against the rendered BufferGeometry, not label metadata.
  const point = V().fromBufferAttribute(a, Math.floor(a.count / 2));
  anchor(s, i, o.localToWorld(point), o);
}
function rings(o) {
  const { radialSegments, tubularSegments } = o.geometry.parameters;
  const a = o.geometry.attributes.position;
  return Array.from({ length: tubularSegments + 1 }, (_, j) => {
    const p = V();
    for (let i = 0; i < radialSegments; i++)
      p.add(V().fromBufferAttribute(a, j * (radialSegments + 1) + i));
    return o.localToWorld(p.multiplyScalar(1 / radialSegments));
  });
}
function translationAnchors(s) {
  atObject(s, 0, "experimental-4ug0");
  atObject(s, 3, "PTC-region-guide");
  const guide = object(s, "schematic-exit-guide-1");
  const guideRings = rings(guide);
  anchor(s, 4, guideRings[(guideRings.length - 1) / 2], guide);
  atObject(s, 5, "peptide-residue-25");
  atObject(s, 11, "release-factor-head");
  const mRNA = object(s, "schematic-mRNA-backbone"),
    points = rings(mRNA);
  anchor(s, 9, points[0], mRNA);
  anchor(s, 10, points.at(-1), mRNA);
  for (let i = 0; i < 3; i++) {
    const point = new THREE.Vector3(...s.labels[6 + i].position);
    let distance = Infinity;
    for (let j = 0; j < points.length - 1; j++)
      distance = Math.min(
        distance,
        new THREE.Line3(points[j], points[j + 1])
          .closestPointToPoint(point, true, V())
          .distanceTo(point),
      );
    assert(distance < 0.002, "site anchor left actual mRNA backbone");
    assert(
      Math.abs(point.x - (1.3 + (i - 1) * 1.35)) < 1e-6,
      "E/P/A site moved with codon",
    );
  }
}
function foldingAnchors(s) {
  for (const [i, name] of [
    [0, "experimental-4ug0"],
    [1, "folding-chain-residue-75"],
    [2, "folding-chain-residue-40"],
    [4, "folding-J-protein"],
    [5, "folding-exchange-factor"],
    [6, "folding-chain-residue-12"],
    [7, "folding-chain-residue-0"],
    [8, "Hsp70-nucleotide-base"],
  ])
    atObject(s, i, name);
  atSurface(s, 3, "Hsp70-substrate-sheet");
}
function splicingAnchors(s) {
  for (const [i, name] of [
    [0, "splice-rna-residue-7"],
    [1, "splice-rna-residue-40"],
    [2, "splice-rna-residue-72"],
    [3, "splice-rna-residue-23"],
    [4, "splice-rna-residue-56"],
    [6, "splice-branch-node-0"],
    [7, "splice-exon-junction-0"],
    [8, "splice-rna-residue-0"],
    [9, "splice-rna-residue-80"],
  ])
    atObject(s, i, name);
  atSurface(s, 5, "spliceosome-scaffold-0");
}
function nitrogenAnchors(s) {
  for (const [i, name] of [
    [0, "MoFe-protein"],
    [4, "nitrogen-reduced-donor"],
    [5, "Fe-protein-lower-nucleotide"],
    [6, "nitrogen-atom-0"],
    [7, "nitrogen-atom-0"],
    [8, "hydrogen-coproduct"],
    [10, "nitrogen-oxygen-inactivation"],
  ])
    atObject(s, i, name);
  for (const [i, name] of [
    [1, "Fe-protein-upper-domain"],
    [11, "alpha-domain-right"],
    [12, "beta-domain-right"],
  ])
    atSurface(s, i, name);
  const feMo = object(s, "FeMo-alpha-left");
  const carbide = feMo.children.find(
    (o) =>
      o.geometry?.type === "SphereGeometry" &&
      o.material.color.getHexString() === "5f6768",
  );
  assert(carbide, "missing actual FeMo carbide");
  anchor(s, 2, world(carbide), carbide);
  const pCluster = object(s, "P-cluster-left");
  const atoms = pCluster.children.filter(
    (o) => o.geometry?.type === "SphereGeometry",
  );
  assert.equal(atoms.length, 15, "P cluster atom topology changed");
  const center = atoms
    .reduce((p, o) => p.add(world(o)), V())
    .multiplyScalar(1 / atoms.length);
  anchor(s, 3, center, pCluster);
}

const cases = [
  [translation, [{}], translationAnchors],
  [folding, [{ cycle: "complete" }, { cycle: "hold" }], foldingAnchors],
  [splicing, [{ isoform: "include" }, { isoform: "skip" }], splicingAnchors],
  [nitrogen, [{ oxygen: "protected" }, { oxygen: "exposed" }], nitrogenAnchors],
];
const progress = [
  ...new Set([
    ...Array.from({ length: 201 }, (_, i) => i / 200),
    0.189999,
    0.19,
    0.339999,
    0.34,
    0.589999,
    0.59,
    0.79999999,
    0.8,
    0.80000001,
    0.805,
    0.81,
    0.845,
    0.989999,
    0.99,
    0.999999,
    1,
  ]),
];
let frames = 0,
  combinations = 0;
for (const [model, conditions, verify] of cases) {
  const roots = Object.entries(processesByRoot)
    .filter(([, ids]) => ids.includes(model.id))
    .map(([root]) => root);
  for (const rootId of roots) {
    const s = model.create({ rootId });
    for (const condition of conditions) {
      combinations++;
      for (const p of progress) {
        s.update(p, condition);
        verify(s);
        frames++;
      }
      s.update(0.615, condition);
      const labels = JSON.stringify(s.labels);
      for (const p of [1, 0, 0.805, 0.34, 0.99, 0.615]) {
        s.update(p, condition);
        verify(s);
      }
      assert.equal(
        JSON.stringify(s.labels),
        labels,
        "label anchors depend on seek history",
      );
    }
  }
}
// Reinsert the exact former offsets so the regression must reject each failure.
for (const [model, condition, verify, i, offset] of [
  [translation, {}, translationAnchors, 5, [0, 0.2, 0.2]],
  [folding, {}, foldingAnchors, 1, [0, 1.3, 0]],
  [splicing, {}, splicingAnchors, 0, [0, -0.55, 0.3]],
  [nitrogen, {}, nitrogenAnchors, 2, [0, 0.6, 0.6]],
]) {
  const s = model.create();
  s.update(0.845, condition);
  s.labels[i].position = s.labels[i].position.map((v, j) => v + offset[j]);
  assert.throws(() => verify(s), /detached from geometry/);
}
console.log(
  `PASS: actual molecular label targets across ${combinations} root/control combinations, ${frames} frames; irregular seeks and four restored-offset mutations rejected.`,
);
