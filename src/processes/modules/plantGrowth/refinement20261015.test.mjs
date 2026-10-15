import assert from "node:assert/strict";
import division from "./plantDivisionProcess.js";
import wall from "./cellWallGrowthProcess.js";
import hypha from "./fungalHyphaeProcess.js";
const named = (g, name) => {
  const result = [];
  g.traverse((n) => {
    if (n.name === name) result.push(n);
  });
  return result;
};
const w = wall.create();
const fibers = named(w.group, "Deposited cellulose microfibril");
assert.equal(fibers.length, 18);
assert.equal(
  new Set(fibers.map((n) => n.geometry)).size,
  1,
  "deposition shares buffer",
);
const geometry = fibers[0].geometry;
const original = geometry.attributes.position.array.slice();
w.update(0.35);
const short = geometry.drawRange.count;
w.update(0.7);
assert(geometry.drawRange.count > short);
for (const fiber of fibers)
  assert.equal(fiber.scale.x, 1, "revealing does not stretch microfibrils");
assert.deepEqual(
  geometry.attributes.position.array,
  original,
  "chain pitch stays fixed",
);
w.update(0.35);
assert.equal(
  geometry.drawRange.count,
  short,
  "reverse seek restores deposition",
);
w.update(1, { extensibility: "restrained" });
const restrained = fibers[0].scale.y;
w.update(1);
assert(
  fibers[0].scale.y < restrained,
  "bundle thickness compensates wall expansion",
);
const d = division.create();
d.update(1);
const shells = named(d.group, "Daughter nuclear envelope cutaway");
assert.equal(shells.length, 2);
assert.equal(
  named(d.group, "Paired daughter nuclear envelope cut rim").length,
  4,
);
assert.equal(
  named(d.group, "Decondensing daughter chromatin domains").length,
  2,
);
for (const n of shells)
  assert(n.visible && n.geometry.parameters.phiLength === Math.PI);
const h = hypha.create();
const pores = named(h.group, "Continuous septal pore lumen");
assert.equal(pores.length, 2);
assert.equal(pores[0].geometry, pores[1].geometry);
assert.equal(
  pores[0].geometry.parameters.openEnded,
  true,
  "pore is traversable",
);
assert.equal(pores[0].geometry.parameters.radiusTop, 0.19);
console.log(
  "Plant-growth refinement: shared fixed-pitch deposition, cutaway nuclei, and open pore linings passed.",
);
