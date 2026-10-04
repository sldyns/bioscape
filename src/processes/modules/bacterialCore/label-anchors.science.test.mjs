import assert from "node:assert/strict";
import * as THREE from "three";
import expression from "./bacterialExpressionProcess.js";
import division from "./bacterialDivisionProcess.js";
import conjugation from "./conjugationProcess.js";
import transformation from "./transformationProcess.js";

const visible = (object) => {
  for (let p = object; p; p = p.parent) if (!p.visible) return false;
  return true;
};
const named = (scene, prefix, count) =>
  Array.from({ length: count }, (_, i) => {
    const node = scene.group.getObjectByName(`${prefix}${i}`);
    assert(node, `${prefix}${i} exists`);
    return node;
  });
const point = (object, x = 0, y = 0, z = 0) =>
  object.localToWorld(new THREE.Vector3(x, y, z));
const near = (label, target, message) =>
  assert(
    new THREE.Vector3(...label.position).distanceTo(target) < 2e-5,
    `${message}: label must target actual world geometry`,
  );
const segment = (label, mesh, fraction = 0.5) =>
  near(label, point(mesh, 0, fraction - 0.5, 0), mesh.name || "DNA segment");
const object = (label, mesh) =>
  near(label, point(mesh), mesh.name || "protein");
const vertex = (label, mesh, index) =>
  near(
    label,
    new THREE.Vector3()
      .fromBufferAttribute(mesh.geometry.attributes.position, index)
      .applyMatrix4(mesh.matrixWorld),
    "envelope surface",
  );
const mouth = (label, mesh) =>
  near(
    label,
    point(
      mesh,
      -mesh.geometry.parameters.radius - mesh.geometry.parameters.tube,
      0,
      0,
    ),
    "visible transfer apparatus rim",
  );

function expressionCheck(scene, p, parameters) {
  const labels = scene.labels,
    available = parameters.sigma !== "absent";
  segment(labels[1], scene.group.getObjectByName("DNA-strand-0-10"));
  segment(labels[2], scene.group.getObjectByName("DNA-strand-1-85"));
  object(labels[3], scene.group.getObjectByName("bacterial-RNAP").children[2]);
  assert.equal(labels[4].active, available);
  if (labels[4].active)
    object(
      labels[4],
      scene.group.getObjectByName("sigma70-factor").children[0],
    );
  const rna = scene.group.getObjectByName("nascent-RNA-69");
  assert.equal(labels[5].active, visible(rna));
  assert.equal(labels[6].active, visible(rna));
  if (labels[5].active) {
    segment(labels[5], rna, 1);
    object(labels[6], scene.group.getObjectByName("RNAP-active-3prime"));
  }
  const large = scene.group.getObjectByName("50S-body-protuberance-exit");
  assert.equal(labels[7].active, visible(large));
  if (labels[7].active) object(labels[7], large.children[0]);
  const peptide = named(scene, "nascent-peptide-", 24).filter(visible);
  assert.equal(labels[8].active, peptide.length > 0);
  if (peptide.length)
    object(labels[8], peptide[Math.floor((peptide.length - 1) / 2)]);
}

function divisionCheck(scene, p, parameters) {
  const labels = scene.labels,
    fork = scene.group.getObjectByName("replication-fork-0");
  vertex(labels[0], scene.group.getObjectByName("envelope-0-1.04"), 20 * 53);
  vertex(labels[1], scene.group.getObjectByName("envelope-1-1.04"), 20 * 53);
  if (labels[2].active) {
    const original = scene.group.getObjectByName("unreplicated-DNA-72");
    segment(
      labels[2],
      visible(original)
        ? original
        : scene.group.getObjectByName("replicated-arm-0-144"),
    );
  }
  assert.equal(labels[3].active, visible(fork));
  if (labels[3].active) object(labels[3], fork);
  const fts = named(scene, "FtsZ-filament-", 40).filter(visible);
  if (!fts.length) assert.equal(labels[4].active, false);
  if (labels[4].active) segment(labels[4], fts[0]);
  if (labels[5].active) {
    const synthase = scene.group.getObjectByName("FtsWI-0");
    assert(visible(synthase));
    object(labels[5], synthase);
  }
  if (labels[6].active)
    vertex(labels[6], scene.group.getObjectByName("envelope-0-0.9"), 0);
  for (const side of [0, 1]) {
    assert.equal(
      labels[7 + side].active,
      parameters.septalSynthesis !== "blocked" && p >= 0.9,
    );
    if (labels[7 + side].active)
      segment(
        labels[7 + side],
        scene.group.getObjectByName(`replicated-arm-${side}-72`),
      );
  }
}

function conjugationCheck(scene, p, parameters) {
  const labels = scene.labels,
    pilus = scene.group.getObjectByName("conjugative-pilus-15"),
    relaxase = scene.group.getObjectByName("TraI-leading-5prime");
  assert.equal(labels[2].active, p > 0.03 && p < 0.34);
  if (labels[2].active) {
    assert(visible(pilus));
    segment(labels[2], pilus);
  }
  if (labels[3].active)
    mouth(labels[3], scene.group.getObjectByName("F-transfer-donor-mouth"));
  if (labels[4].active)
    segment(labels[4], scene.group.getObjectByName("donor-template-0"), 0);
  assert.equal(labels[5].active, visible(relaxase));
  if (labels[5].active) object(labels[5], relaxase);
  for (const [index, name] of [
    [6, "donor-replacement-36"],
    [7, "recipient-complement-36"],
  ]) {
    if (parameters.oriT === "blocked")
      assert.equal(labels[index].active, false);
    if (labels[index].active) {
      const strand = scene.group.getObjectByName(name);
      assert(visible(strand));
      segment(labels[index], strand);
    }
  }
}

function transformationCheck(scene, p, parameters) {
  const labels = scene.labels,
    environmental = named(scene, "external-strand-0-", 54).filter(visible);
  assert.equal(labels[1].active, environmental.length > 0);
  if (labels[1].active)
    segment(labels[1], environmental[Math.floor(environmental.length / 2)]);
  if (labels[2].active)
    mouth(labels[2], scene.group.getObjectByName("ComEC-outer-mouth"));
  const fragments = named(scene, "degraded-partner-strand-", 16).filter(
    visible,
  );
  if (!fragments.length) assert.equal(labels[3].active, false);
  if (labels[3].active)
    object(labels[3], fragments[Math.floor(fragments.length / 2)]);
  if (labels[4].active) {
    const dprA = scene.group.getObjectByName("DprA-RecA-loader");
    assert(visible(dprA));
    object(labels[4], dprA);
  }
  const recA = named(scene, "RecA-subunit-", 27).filter(visible);
  if (!recA.length) assert.equal(labels[5].active, false);
  if (labels[5].active) object(labels[5], recA[Math.floor(recA.length / 2)]);
  segment(labels[6], scene.group.getObjectByName("resident-strand-1-80"));
  if (labels[7].active) {
    const name =
      parameters.homology === "absent"
        ? "resident-strand-1-27"
        : "incoming-strand-17";
    const strand = scene.group.getObjectByName(name);
    assert(visible(strand));
    segment(labels[7], strand);
    if (parameters.homology === "absent")
      assert.match(labels[7].text.en, /Chromosome retained/);
  }
}

const checks = [
  expressionCheck,
  divisionCheck,
  conjugationCheck,
  transformationCheck,
];
let states = 0;
for (const [index, model] of [
  expression,
  division,
  conjugation,
  transformation,
].entries()) {
  const scene = model.create();
  const samples = [
    0, 0.03, 0.031, 0.175, 0.185, 0.195, 0.345, 0.355, 0.445, 0.48, 0.505,
    0.525, 0.535, 0.565, 0.57, 0.579, 0.585, 0.665, 0.695, 0.705, 0.815, 0.855,
    0.89, 0.915, 0.999, 1,
  ];
  for (const option of model.controls[0].options) {
    const parameters = { [model.controls[0].id]: option.value };
    for (const p of samples) {
      scene.update(p, parameters);
      scene.group.updateMatrixWorld(true);
      checks[index](scene, p, parameters);
      states++;
    }
    scene.update(0.705, parameters);
    const labels = JSON.stringify(scene.labels);
    scene.update(0.03, parameters);
    scene.update(1, parameters);
    scene.update(0.705, parameters);
    assert.equal(
      JSON.stringify(scene.labels),
      labels,
      "label anchors and active states seek deterministically",
    );
  }
  const p = [0.855, 0.185, 0.505, 0.855][index];
  scene.update(p);
  scene.group.updateMatrixWorld(true);
  const labelIndex = [5, 3, 5, 6][index];
  scene.labels[labelIndex].position[0] += 0.4;
  assert.throws(() => checks[index](scene, p, {}), assert.AssertionError);
}
const ghostPilus = conjugation.create();
ghostPilus.update(0);
ghostPilus.group.updateMatrixWorld(true);
ghostPilus.labels[2].active = true;
assert.throws(() => conjugationCheck(ghostPilus, 0, {}), assert.AssertionError);
const ghostEnvironment = transformation.create();
ghostEnvironment.update(0.58);
ghostEnvironment.group.updateMatrixWorld(true);
ghostEnvironment.labels[1].active = true;
assert.throws(
  () => transformationCheck(ghostEnvironment, 0.58, {}),
  assert.AssertionError,
);
console.log(
  `bacterialCore labels: ${states} states, actual world anchors, both conditions, deterministic seeks and 6 negative controls passed`,
);
