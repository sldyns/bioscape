import assert from "node:assert/strict";
import fermentation from "./yeastFermentationProcess.js";
import sporulation from "./yeastSporulationProcess.js";

const enzymeScene = fermentation.create();
for (const name of ["fermentation-pdc", "fermentation-adh"]) {
  const enzyme = enzymeScene.group.getObjectByName(name);
  const domains = enzyme.children.filter(
    (o) => o.name === "enzyme-folded-domain" || o.name.endsWith("label-target"),
  );
  assert.equal(domains.length, 7);
  const lips = enzyme.children.filter(
    (o) => o.name === "open-enzyme-cleft-lip",
  );
  assert.equal(lips.length, 2);
  assert.equal(lips[0].geometry, lips[1].geometry, "cleft lips share a buffer");
  assert(
    lips[0].geometry.parameters.arc < Math.PI,
    "pocket lips leave open substrate entry",
  );
  assert.notEqual(
    Math.abs(domains[0].position.x),
    Math.abs(domains[3].position.x),
    "enzyme contour is not a radial flower",
  );
}
const scene = sporulation.create();
const bundles = [];
scene.group.traverse((o) => {
  if (o.name === "meiotic-spindle-parallel-fibers") bundles.push(o);
});
assert.equal(bundles.length, 3);
assert.equal(
  new Set(bundles.map((o) => o.geometry)).size,
  1,
  "all spindle fibers reuse the kit cylinder",
);
const identities = bundles.map((o) => [
  o.uuid,
  o.geometry.uuid,
  Array.from(o.instanceMatrix.array),
]);
for (const p of [0, 0.4, 0.51, 0.65, 1, 0.4]) {
  scene.update(p);
  scene.group.updateMatrixWorld(true);
  for (let i = 0; i < bundles.length; i++) {
    const bundle = bundles[i];
    assert.deepEqual(
      [
        bundle.uuid,
        bundle.geometry.uuid,
        Array.from(bundle.instanceMatrix.array),
      ],
      identities[i],
    );
    assert.equal(bundle.count, 6);
    // Local fibers span exactly the original spindle length. Their transverse
    // endpoints stay inside each pole body rather than floating past it.
    const m = bundle.instanceMatrix.array;
    for (let j = 0; j < 6; j++) {
      assert.equal(m[j * 16 + 5], 1);
      const radial =
        Math.hypot(m[j * 16 + 12], m[j * 16 + 14]) * bundle.parent.scale.x;
      assert(radial <= 0.04 + 1e-7);
    }
  }
}
console.log("2026-10-15 enzyme cleft / shared spindle bundle invariants pass");

for (const p of [0.7, 1, 0.7, 1]) {
  scene.update(p);
  for (let i = 0; i < 4; i++) {
    for (const kind of ["outer-prospore-membrane", "persistent-spore-pm"]) {
      const geometry = scene.group.getObjectByName(
        `sporulation-${kind}-${i}`,
      ).geometry;
      assert.equal(
        geometry.index.count,
        24 * 36 * 6,
        "closed topology retained",
      );
      assert.equal(
        geometry.drawRange.count,
        (p >= 0.84 ? 14 : 24) * 36 * 6,
        "mature viewing cut is deterministic and resets",
      );
    }
  }
}
