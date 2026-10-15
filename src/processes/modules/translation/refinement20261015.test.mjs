import assert from "node:assert/strict";
import translation from "./translationProcess.js";
import folding from "./proteinFoldingProcess.js";
import splicing from "./alternativeSplicingProcess.js";
import fixation from "./nitrogenFixationProcess.js";
for (const [model, names] of [
  [
    translation,
    [
      "P-tRNA-paired-stem-1-0",
      "A-tRNA-paired-stem-2-0",
      "release-factor-decoding-sheet",
      "release-factor-catalytic-helix",
    ],
  ],
  [folding, ["Hsp70-lid-hinge", "Hsp70-interdomain-linker"]],
  [splicing, ["Sm-continuous-heptamer-support"]],
  [
    fixation,
    [
      "MoFe-interface-support--1",
      "MoFe-interface-support-1",
      "MoFe-dimer-interface",
    ],
  ],
]) {
  const scene = model.create();
  const resources = [];
  scene.group.traverse((o) =>
    resources.push(o.uuid, o.geometry?.uuid, o.material?.uuid),
  );
  for (const name of names)
    assert(scene.group.getObjectByName(name), `${model.id}: ${name}`);
  const state = () => {
    scene.group.updateMatrixWorld(true);
    const values = [];
    scene.group.traverse((o) => values.push(o.visible, ...o.matrix.elements));
    return values;
  };
  for (const p of [0, 0.25, 0.7, 1, 0.2, 0.7]) scene.update(p);
  const expected = state();
  scene.update(0.1);
  scene.update(0.7);
  assert.deepEqual(state(), expected);
  const after = [];
  scene.group.traverse((o) =>
    after.push(o.uuid, o.geometry?.uuid, o.material?.uuid),
  );
  assert.deepEqual(after, resources);
}
console.log(
  "PASS: anatomical supports remain in the owning graph; resource identities and absolute seeking stable.",
);
