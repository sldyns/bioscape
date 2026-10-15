import assert from "node:assert/strict";
import * as THREE from "three";
import { molecularKit } from "./molecularDetail.js";
import replication from "./replicationProcess.js";

// Assembly silhouettes must differ in actual domain geometry, not color.
const group = new THREE.Group();
const kit = molecularKit(group);
const silhouettes = new Set();
for (const kind of ["recognition", "TFIIH", "primase", "ligase"]) {
  const assembly = kit.protein(kind, "#a597b3");
  assert.equal(assembly.userData.schematicAssembly, kind);
  const domains = assembly.children.slice(0, assembly.userData.domainCount);
  silhouettes.add(
    JSON.stringify(
      domains.map((o) => [o.position.toArray(), o.scale.toArray()]),
    ),
  );
  // Both flanks frame a visible open central cleft.
  assert.ok(domains[0].position.x < -0.2);
  assert.ok(domains[1].position.x > 0.2);
  assert.ok(domains.every((o) => o.geometry === kit.sphere));
}
assert.equal(silhouettes.size, 4);
const scene = replication.create();
const inventory = () => {
  const ids = [];
  scene.group.traverse((o) =>
    ids.push(o.uuid, o.geometry?.uuid, o.material?.uuid),
  );
  return ids;
};
const initial = inventory();
for (const p of [0, 0.4, 0.7, 0.2, 0.7, 1, NaN]) scene.update(p);
assert.deepEqual(inventory(), initial);
console.log(
  "Genome refinement: four distinct shared-geometry assemblies; stable seek resources.",
);
