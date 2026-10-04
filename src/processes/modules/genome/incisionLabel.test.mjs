import assert from "node:assert/strict";
import * as THREE from "three";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const moduleRoot = process.env.GENOME_MODULE_ROOT
  ? pathToFileURL(resolve(process.env.GENOME_MODULE_ROOT) + "/")
  : new URL("./", import.meta.url);
const repair = (await import(new URL("dnaRepairProcess.js", moduleRoot)))
  .default;
const matrix = new THREE.Matrix4();
function present(mesh, index) {
  mesh.getMatrixAt(index, matrix);
  return Math.hypot(...matrix.elements.slice(0, 3)) > 1e-7;
}

let cases = 0;
let seeks = 0;
for (const rootId of ["cell", "plant", "yeast"])
  for (const incision of ["active", "blocked"]) {
    const model = repair.create({ rootId });
    const label = model.labels.find(
      (item) => item.text.en === "Two incisions on one strand",
    );
    assert.ok(label, "keep the incision annotation and its existing anchor");
    const rail = model.group.getObjectByName(
      "damaged-strand-sugar-phosphate-backbone",
    );
    const ends = model.group.getObjectByName("exposed-phosphodiester-cut-ends");
    const snapshot = (p) => {
      model.update(p, { incision });
      model.group.updateMatrixWorld(true);
      const visibleEnds = Array.from({ length: ends.count }, (_, i) =>
        present(ends, i),
      ).filter(Boolean).length;
      // These four original backbone segments border the two actual nick
      // locations. A bound nuclease alone must never announce a completed cut.
      const removedAtCuts = [79, 80, 159, 160].filter(
        (index) => !present(rail, index),
      ).length;
      if (label.active) {
        assert.equal(
          model.group.userData.incisions,
          2,
          `${rootId}/${incision} p=${p}: annotation claims cuts before the event`,
        );
        assert.equal(visibleEnds, 4, "a dual cut exposes four actual ends");
        assert.equal(removedAtCuts, 4, "both real backbone gaps must exist");
        assert.ok(
          Math.abs(label.position[0] + 4 / 3) < 1e-8,
          "keep the annotation at the original left incision site",
        );
      }
      if (incision === "blocked") {
        assert.equal(label.active, false, "blocked branch never cuts");
        assert.equal(visibleEnds, 0, "blocked backbone has no exposed ends");
        assert.equal(removedAtCuts, 0, "blocked backbone remains intact");
      } else {
        assert.equal(
          label.active,
          p >= 0.43 && p < 0.54,
          "show the actual cut before switching to the excised-fragment label",
        );
      }
      return {
        active: label.active,
        anchor: [...label.position],
        visibleEnds,
        removedAtCuts,
        incisions: model.group.userData.incisions,
        blockedLabel: model.labels[10].active,
      };
    };
    const points = [
      0,
      0.3 - 1e-7,
      0.3,
      0.325,
      0.4 - 1e-7,
      0.4,
      0.4 + 1e-7,
      0.43 - 1e-7,
      0.43,
      0.43 + 1e-7,
      0.48,
      0.54 - 1e-7,
      0.54,
      0.64,
      0.97,
      1,
    ];
    for (const p of points) {
      const expected = snapshot(p);
      cases++;
      for (const jump of [1, 0.43, 0.3, 0.54, 0.4, 0]) snapshot(jump);
      assert.deepEqual(snapshot(p), expected, "arbitrary seeks must be stable");
      seeks += 7;
    }
  }
console.log(
  `PASS: ${cases} incision-label boundary states and ${seeks} arbitrary seeks across every root and both conditions; actual gaps/ends precede the incision annotation.`,
);
