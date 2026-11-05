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

// Read the rendered RNA segments rather than recomputing the animation path.
// The newest primer is the rightmost separated RNA cluster in this fork.
function newestPrimerEnd(mesh) {
  const segments = [],
    instance = new THREE.Matrix4(),
    world = new THREE.Matrix4();
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, instance);
    if (Math.hypot(...instance.elements.slice(0, 3)) < 1e-7) continue;
    world.multiplyMatrices(mesh.matrixWorld, instance);
    const a = new THREE.Vector3(0, -0.5, 0).applyMatrix4(world),
      b = new THREE.Vector3(0, 0.5, 0).applyMatrix4(world);
    segments.push(a.x < b.x ? [a, b] : [b, a]);
  }
  segments.sort((a, b) => b[1].x - a[1].x);
  assert.ok(segments.length, "a newly forming RNA primer must be visible");
  let end = segments[0][0];
  for (const [left, right] of segments.slice(1)) {
    if (end.distanceTo(right) > 0.08) break;
    end = left;
  }
  return end;
}
const primase = scene.group.getObjectByName("primase-functional-domains"),
  lag = scene.group.getObjectByName("lagging-DNA-polymerase-recruitment"),
  primers = scene.group.getObjectByName("RNA-primers-sugar-phosphate-backbone");
scene.update(0.25);
assert.equal(scene.labels[7].active, true, "identify the initial RNA primer");
assert.equal(
  scene.labels[5].active,
  false,
  "do not stack RNA and fragment annotations on the first RNA-only start",
);
scene.update(0.28);
assert.equal(scene.labels[5].active, true, "identify visible DNA fragments");
for (const p of [0.25, 0.37, 0.49, 0.61, 0.73, 0.49, 0.25]) {
  scene.update(p);
  scene.group.updateMatrixWorld(true);
  const end = newestPrimerEnd(primers),
    enzyme = new THREE.Box3().setFromObject(primase);
  assert.ok(primase.visible, `p=${p}: primase accompanies nascent RNA`);
  assert.ok(
    enzyme.distanceToPoint(end) < 0.12,
    `p=${p}: primase is visibly separated from the newest RNA end`,
  );
  assert.ok(
    scene.annotationTargets.length > 0,
    "visible enzyme protects its domains",
  );
  for (const target of scene.annotationTargets)
    assert.ok(
      enzyme.distanceToPoint(new THREE.Vector3(...target)) < 0.01,
      "annotation protection follows the visible enzyme",
    );
  assert.equal(
    lag.visible,
    false,
    `p=${p}: RNA synthesis precedes DNA extension`,
  );
}
for (const p of [0.28, 0.4, 0.52, 0.64, 0.76, 0.4]) {
  scene.update(p);
  assert.equal(primase.visible, false, `p=${p}: RNA synthesis has finished`);
  assert.equal(
    scene.annotationTargets.length,
    0,
    "hidden enzyme leaves no stale targets",
  );
  assert.equal(lag.visible, true, `p=${p}: DNA polymerase continues extension`);
}
assert.deepEqual(inventory(), initial);
console.log(
  "Genome refinement: four distinct assemblies; RNA-end contact and ordered polymerase handoff; stable seek resources.",
);
