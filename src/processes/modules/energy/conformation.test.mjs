import assert from "node:assert/strict";
import respiration from "./respirationProcess.js";
import glycolysis from "./glycolysisProcess.js";
import bacteria from "./bacterialEnergeticsProcess.js";
import photo from "./bacterialPhotosynthesisProcess.js";
import original from "../../photosynthesisProcess.js";
for (const definition of [respiration, bacteria, photo]) {
  const m = definition.create();
  const beta = [];
  m.group.traverse((o) => {
    if (o.userData.catalyticBeta) beta.push(o);
  });
  assert.equal(beta.length, 3);
  m.update(0.66);
  const first = beta.map((o) => o.scale.x);
  m.update(0.71);
  assert.notDeepEqual(
    beta.map((o) => o.scale.x),
    first,
  );
  assert.ok(new Set(first).size > 1, "sequential catalytic conformations");
  m.update(0.66);
  assert.deepEqual(
    beta.map((o) => o.scale.x),
    first,
  );
  assert.ok(m.group.getObjectByName("transmembrane-protein-envelope"));
}
const g = glycolysis.create();
const enzyme = [];
g.group.traverse((o) => {
  if (o.name === "schematic-protein-domain-cleft") enzyme.push(o);
});
const cleft = enzyme[0];
g.update(0.53);
const open = cleft.position.x;
g.update(0.64);
assert.ok(cleft.position.x > open);
g.update(0.75);
assert.ok(Math.abs(cleft.position.x - open) < 1e-10);
g.update(0.85);
assert.ok(cleft.position.x > open, "second ATP event closes cleft");
const p = photo.create();
assert.ok(p.group.getObjectByName("continuous-thylakoid-rim-bilayer"));
const o = original.create();
o.update(0.7);
// Fixed head domains retain their original small scale rather than growing to unit scale.
let betaScaleCount = 0;
o.group.traverse((n) => {
  if (n.scale.x > 0.2 && n.scale.x <= 0.23 && n.scale.y === 0.34)
    betaScaleCount++;
});
assert.ok(betaScaleCount >= 3);
console.log(
  "energy refinement: sequential beta breathing; two glycolysis closures; continuous rim; bounded original head PASS",
);
