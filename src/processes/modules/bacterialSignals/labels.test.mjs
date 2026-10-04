import assert from "node:assert/strict";
import * as THREE from "three";
import chemotaxis from "./chemotaxisProcess.js";
import twoComponent from "./twoComponentProcess.js";
import quorumSensing from "./quorumSensingProcess.js";
import biofilm from "./biofilmProcess.js";

// Compare leader endpoints to real mesh triangles, not a copy of the update
// coordinate formula. Include parent transforms and actual instance matrices.
function surfaceDistance(position, mesh, instanceIndex) {
  const point = new THREE.Vector3(...position);
  const matrix = mesh.matrixWorld.clone();
  if (instanceIndex !== undefined) {
    const instance = new THREE.Matrix4();
    mesh.getMatrixAt(instanceIndex, instance);
    matrix.multiply(instance);
  }
  const vertices = mesh.geometry.attributes.position;
  const indices = mesh.geometry.index;
  const triangle = new THREE.Triangle();
  const nearest = new THREE.Vector3();
  let distance = Infinity;
  for (let i = 0; i < (indices?.count ?? vertices.count); i += 3) {
    [triangle.a, triangle.b, triangle.c].forEach((v, j) =>
      v
        .fromBufferAttribute(vertices, indices ? indices.getX(i + j) : i + j)
        .applyMatrix4(matrix),
    );
    triangle.closestPointToPoint(point, nearest);
    distance = Math.min(distance, nearest.distanceTo(point));
  }
  return distance;
}
function visible(node) {
  for (; node; node = node.parent) if (!node.visible) return false;
  return true;
}
function targets(model, scene, parameters, p) {
  const get = (name) => {
    const node = scene.group.getObjectByName(name);
    assert(node, name);
    return node;
  };
  const dna = scene.group.getObjectByName("DNA-0-backbone");
  const rna = scene.group.getObjectByName("RNA-backbone");
  if (model.id === "chemotaxis")
    return [
      [0, get("chemotactic-cell-envelope")],
      [1, get("MCP-ligand-binding-tip")],
      [2, get("CheA")],
      [3, get("CheZ")],
      [4, get("CheY-P-0")],
      [5, get("flagellar-basal-motor")],
      [6, get(`illustrative-track-${parameters.environment}`).children[2]],
    ];
  if (model.id === "twoComponent") {
    const asp = get("NarL-Asp-site");
    const heads = get("paired-phospholipid-headgroups");
    const atp = get("ATP-ADP");
    assert.equal(
      scene.labels[4].text.en,
      atp.children[3].visible ? "ATP" : "ADP",
    );
    assert.equal(scene.labels[5].text.en, asp.visible ? "NarL · Asp" : "NarL");
    for (const index of [0, 8])
      assert.match(scene.labels[index].text.en, /region/);
    return [
      [1, heads, Math.floor(heads.count * 0.8)],
      [2, get("NarX-sensor-loop-0")],
      [3, get("NarX-His-donor-atom")],
      [4, atp.children[0]],
      [5, asp.visible ? asp : get("NarL").children[0]],
      [6, dna, 84],
      [7, rna, rna.count - 1],
      [9, dna, 0],
      [10, dna, dna.count - 1],
      [11, get("periplasmic-nitrate").children[0]],
    ];
  }
  if (model.id === "quorumSensing") {
    assert.equal(
      scene.labels[3].text.en,
      parameters.exchange === "retained" && p > 0.51 ? "LuxR + AHL" : "LuxR",
      "unliganded LuxR must not be labeled as AHL-bound",
    );
    return [
      [0, get("quorum-population-cell-0")],
      [1, get("quorum-cell-cutaway-envelope")],
      [2, get("LuxI")],
      [3, get("LuxR-regulatory-complex").children[0]],
      [4, get("lux-box-region-marker")],
      [5, get("lux-operon-gene-tab-3")],
      [6, get("free-AHL-0").children[0]],
      [7, rna, rna.count - 1],
      [8, dna, 0],
      [9, dna, dna.count - 1],
    ];
  }
  const psl = get("Psl-fiber-bundle-and-oligosaccharide-repeat-motifs");
  const dnaStrand = get("extracellular-DNA-double-helix").children.find(
    (n) => n.geometry?.type === "TubeGeometry",
  );
  const proteins = scene.group.children.filter(
    (n) => n.isMesh && n.scale.x === 0.065 && n.scale.y === 0.12,
  );
  const leaver = get("biofilm-cell-12");
  assert.equal(
    scene.labels[7].active,
    parameters.cue === "NO" && leaver.position.y > -0.2 + 2 * 0.25,
    "release label follows a visibly displaced viable cell",
  );
  return [
    [0, get("biofilm-solid-surface")],
    [1, get("biofilm-cell-0").children[0]],
    [2, psl.visible ? psl.children[0] : get("Psl-adhesion-tether-0")],
    [3, dnaStrand],
    [4, proteins[0]],
    [5, get("c-di-GMP-conceptual-inset").children[0]],
    [6, get("NO-cue-0").children[0]],
    [7, get("biofilm-cell-12").children[0]],
  ];
}
let checks = 0;
for (const model of [chemotaxis, twoComponent, quorumSensing, biofilm]) {
  const scene = model.create();
  const labelReferences = scene.labels.map((label) => [
    label,
    label.position,
    label.text,
  ]);
  const states = [
    0, 0.175, 0.355, 0.525, 0.715, 0.895, 1, 0.17, 0.1700001, 0.32, 0.3200001,
    0.35, 0.46, 0.51, 0.68, 0.7, 0.7000001, 0.72, 0.7200001, 0.79, 0.8,
    0.8000001, 0.83, 0.96, 0.3, 0.01,
  ];
  for (const transformed of [false, true]) {
    scene.group.position.set(transformed ? 0.7 : 0, -0.1, 0.4);
    scene.group.rotation.set(0.08, transformed ? 0.45 : 0, -0.13);
    scene.group.scale.set(1.07, 0.92, 1.04);
    for (const option of model.controls[0].options) {
      const parameters = { [model.controls[0].id]: option.value };
      for (const p of states) {
        scene.update(p, parameters);
        scene.group.updateMatrixWorld(true);
        for (const [index, mesh, instanceIndex] of targets(
          model,
          scene,
          parameters,
          p,
        )) {
          const label = scene.labels[index];
          if (!(model.id === "biofilm" && index === 7))
            assert.equal(
              label.active,
              visible(mesh),
              `${model.id} label ${index}: visibility follows its actual target`,
            );
          if (label.active) {
            assert(
              visible(mesh),
              `${model.id} label ${index} has a visible target`,
            );
            assert(
              surfaceDistance(label.position, mesh, instanceIndex) < 2e-6,
              `${model.id} label ${index}: leader ends on the actual moving mesh surface`,
            );
            checks++;
          }
        }
        scene.labels.forEach((label, i) => {
          assert.equal(label, labelReferences[i][0]);
          assert.equal(
            label.position,
            labelReferences[i][1],
            "label position arrays remain stable on seek",
          );
          assert.equal(
            label.text,
            labelReferences[i][2],
            "bilingual text object remains stable",
          );
          assert(label.position.every(Number.isFinite));
        });
      }
      scene.update(0.713, parameters);
      const expected = JSON.stringify(scene.labels);
      for (const p of [1, 0, 0.9, 0.713]) scene.update(p, parameters);
      assert.equal(
        JSON.stringify(scene.labels),
        expected,
        `${model.id}: label seeks are deterministic`,
      );
    }
  }
}
console.log(
  `bacterialSignals labels: ${checks} actual triangle-surface checks, both conditions, parent transforms, visibility, molecular wording and stable deterministic seeks passed`,
);
