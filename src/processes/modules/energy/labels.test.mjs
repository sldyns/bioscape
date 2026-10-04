import assert from "node:assert/strict";
import { Vector3 } from "three";
import respiration from "./respirationProcess.js";
import glycolysis from "./glycolysisProcess.js";
import bacterialEnergetics from "./bacterialEnergeticsProcess.js";
import bacterialPhotosynthesis from "./bacterialPhotosynthesisProcess.js";

const named = (m, name) => {
  const object = m.group.getObjectByName(name);
  assert.ok(object, name);
  return object;
};
function anchored(m, index, target) {
  target.updateWorldMatrix(true, false);
  const physicalPoint = new Vector3()
    .fromBufferAttribute(target.geometry.attributes.position, 0)
    .applyMatrix4(target.matrixWorld);
  const endpoint = new Vector3(...m.labels[index].position);
  assert.ok(
    endpoint.distanceTo(physicalPoint) < 1e-8,
    `${m.labels[index].text.en}: leader must end on the intended object's actual transformed surface`,
  );
  let current = target;
  while (current) {
    if (m.labels[index].active !== false)
      assert.ok(
        current.visible,
        "an active label must use the selected, visible object",
      );
    current = current.parent;
  }
}

let assertions = 0;
const times = [
  0,
  0.095,
  0.175,
  0.285,
  1 / 3,
  0.345,
  0.455,
  0.5,
  0.595,
  0.685,
  0.735,
  0.755,
  0.795,
  0.875,
  0.945,
  1,
];
const models = [];
for (const rootId of ["cell", "plant", "yeast", "paramecium"]) {
  const m = respiration.create({ rootId });
  models.push(m);
  for (const coupling of ["coupled", "leak"])
    for (const p of times) {
      m.update(p, { coupling });
      for (const [index, name] of [
        [3, "NADH-entry-label-surface"],
        [7, "F1-label-surface"],
        [8, "Fo-label-surface"],
        [10, "ubiquinone-carrier"],
        [11, "cytochrome-c-carrier"],
      ]) {
        anchored(m, index, named(m, name));
        assertions++;
      }
      for (const [index, name] of [
        [5, "complex-III-proton-transfer-domain"],
        [6, "complex-IV-proton-transfer-domain"],
      ]) {
        anchored(m, index, named(m, name).children[2]);
        assertions++;
      }
    }
}
for (const rootId of ["cell", "plant", "yeast"]) {
  const m = glycolysis.create({ rootId });
  models.push(m);
  for (const p of times) {
    m.update(p);
    for (const [index, name] of [
      [1, "carbon-2"],
      [4, "carbon-1"],
      [5, "carbon-4"],
      [7, "adenylate-label-0-0"],
      [8, "adenylate-label-0-1"],
      [9, "adenylate-label-1-0"],
      [10, "adenylate-label-1-1"],
      [12, "NAD-label-surface-0"],
      [13, "NAD-label-surface-1"],
    ]) {
      anchored(m, index, named(m, name));
      assertions++;
    }
    const reactionTarget =
      p > 0.71 && p <= 0.77
        ? named(m, "inherited-phosphate-1").children[0]
        : named(m, "glycolysis-reaction-label-surface");
    anchored(m, 6, reactionTarget);
    assertions++;
  }
}
const bacteria = bacterialEnergetics.create();
models.push(bacteria);
for (const route of ["ndh1-bo", "ndh2-bd"])
  for (const p of times) {
    bacteria.update(p, { route });
    for (const [index, name] of [
      [3, route === "ndh1-bo" ? "NDH-I-label-surface" : "NDH-II-label-surface"],
      [5, "F1-label-surface"],
      [6, "ubiquinone-carrier"],
      [9, "Fo-label-surface"],
    ]) {
      anchored(bacteria, index, named(bacteria, name));
      assertions++;
    }
  }
const cyano = bacterialPhotosynthesis.create();
models.push(cyano);
for (const light of ["light", "dark"])
  for (const p of times) {
    cyano.update(p, { light });
    for (const [index, name] of [
      [2, "phycobilisome-label-surface"],
      [3, "PSII-water-oxidation-label-surface"],
      [5, "PSI-label-surface"],
      [6, "FNR-protein"],
      [7, "F1-label-surface"],
      [8, "plastoquinone-carrier"],
      [9, "lumenal-PC-c6-carrier"],
    ]) {
      anchored(cyano, index, named(cyano, name));
      assertions++;
    }
    anchored(cyano, 4, named(cyano, "b6f-proton-transfer-domain").children[2]);
    assertions++;
  }

// A real protein transform, rather than label metadata or a coincident hardcoded
// position, determines the endpoint. No renderer or browser is needed here.
const shifted = models[0];
const stator = named(shifted, "stationary-a-subunit-and-peripheral-stator");
const originalX = stator.position.x;
stator.position.x += 0.21;
shifted.update(0.71);
anchored(shifted, 7, named(shifted, "F1-label-surface"));
stator.position.x = originalX;
shifted.update(0.71);
anchored(shifted, 7, named(shifted, "F1-label-surface"));

// Reinstating the photographed offset endpoint must fail the same geometry test.
shifted.labels[11].position.splice(0, 3, 0.65, 1.13, 0);
assert.throws(() =>
  anchored(shifted, 11, named(shifted, "cytochrome-c-carrier")),
);
shifted.update(0.71);
const glucose = models[4];
glucose.update(0.595);
glucose.labels[4].position[1] += 0.6;
assert.throws(() => anchored(glucose, 4, named(glucose, "carbon-1")));
glucose.update(0.595);

console.log(
  JSON.stringify({
    test: "20261004-energy-07 actual label endpoints",
    assertions,
    rootConditionContexts: 15,
    transformedProteinCheck: "PASS",
    originalOffsetNegativeControls: "PASS",
    result: "PASS",
  }),
);
