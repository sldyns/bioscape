import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import access from "./chromatinAccessProcess.js";
import tad from "./tadProcess.js";
import genome from "./plantGenomeProcess.js";
import rddm from "./plantRdDMProcess.js";

// Require connected domain envelopes, rather than detached decorative rings.
for (const definition of [access, tad, rddm]) {
  const scene = definition.create();
  const folds = [];
  scene.group.traverse((o) => {
    if (o.geometry?.type === "DomedFoldGeometry") folds.push(o);
  });
  assert.ok(folds.length >= (definition === tad ? 1 : 3));
  for (const fold of folds) {
    const p = fold.geometry.attributes.position;
    assert.ok(p.array.every(Number.isFinite));
    assert.equal(fold.geometry.userData.roundedOutline, true);
    const normal = fold.geometry.attributes.normal;
    assert.ok(normal.array.every(Number.isFinite));
    let curved = 0,
      front = 0,
      rear = 0;
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i),
        nz = normal.getZ(i);
      if (z > 0.08) {
        front++;
        assert.ok(nz > 0, "front dome normals face outward");
      }
      if (z < -0.08) {
        rear++;
        assert.ok(nz < 0, "rear dome normals face outward");
      }
      if (Math.abs(z) > 0.05 && Math.abs(z) < 0.12) curved++;
    }
    assert.ok(
      front > 5 && rear > 5 && curved > 5,
      "surface has continuous curved depth rather than a flat face",
    );
    const edges = new Map();
    const ix = fold.geometry.index.array;
    for (let i = 0; i < ix.length; i += 3)
      for (const [a, b] of [
        [ix[i], ix[i + 1]],
        [ix[i + 1], ix[i + 2]],
        [ix[i + 2], ix[i]],
      ]) {
        const key = a < b ? a + ":" + b : b + ":" + a;
        edges.set(key, (edges.get(key) || 0) + 1);
      }
    assert.ok(
      [...edges.values()].every((n) => n === 2),
      "all domain edges have exactly two incident faces",
    );

    fold.geometry.computeBoundingBox();
    assert.ok(
      fold.geometry.boundingBox.max.z - fold.geometry.boundingBox.min.z > 0.15,
    );
  }
  const hash = () =>
    createHash("sha256")
      .update(
        JSON.stringify(
          folds.map((o) => [
            o.matrix.toArray(),
            Array.from(o.geometry.attributes.position.array),
          ]),
        ),
      )
      .digest("hex");
  scene.update(0.77);
  const expected = hash();
  scene.update(0.1);
  scene.update(0.77);
  assert.equal(hash(), expected);
}
const plant = genome.create();
const cuts = [],
  grana = [];
plant.group.traverse((o) => {
  if (o.name === "envelope-membrane-cut-thickness") cuts.push(o);
  if (o.name === "granal-thylakoid-open-lumen-and-visible-dorsal-face")
    grana.push(o);
});
assert.equal(
  cuts.length,
  6,
  "three compartments each expose both membrane cut faces",
);
assert.equal(grana.length, 8, "two four-sac stacks retain lumina");
assert.ok(grana.every((o) => o.rotation.x > 0.3 && o.rotation.x < 0.5));
assert.ok(
  cuts.every((o) => !o.material.transparent && o.geometry.index.count > 500),
);
console.log(
  "Connected domain envelopes, deterministic seeks, envelope cut thickness, and thylakoid dorsal/lumen visibility pass.",
);
