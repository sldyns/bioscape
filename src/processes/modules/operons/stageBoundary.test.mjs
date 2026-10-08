import assert from "node:assert/strict";
import * as THREE from "three";
import hog from "./yeastOsmoregulationProcess.js";

const scene = hog.create();
const ssk1 = scene.group.getObjectByName("Ssk1 response regulator");
const ypd1 = scene.group.getObjectByName("Ypd1 phosphorelay protein");
assert(ssk1 && ypd1);

// Identify the rendered phosphate at its protein, independently of the state
// metadata. A gold sphere nearest Ssk1 is its phosphate; it is retained when
// hidden, so the same real marker can be followed over the stage boundary.
scene.group.updateMatrixWorld(true);
const center = ssk1.getWorldPosition(new THREE.Vector3());
const candidates = [];
scene.group.traverse((node) => {
  if (
    node.geometry?.type === "SphereGeometry" &&
    node.material?.color?.getHexString() === "cba667"
  )
    candidates.push({
      node,
      distance: node.getWorldPosition(new THREE.Vector3()).distanceTo(center),
    });
});
candidates.sort((a, b) => a.distance - b.distance);
assert(candidates[0].distance < 0.35 && candidates[1].distance > 0.5);
const phosphate = candidates[0].node;

scene.update(0);
const relayMaterials = [ssk1.material, ypd1.material];
scene.update(0.49);
const stressMaterials = [ssk1.material, ypd1.material];
assert.notEqual(relayMaterials[0], stressMaterials[0]);
assert.notEqual(relayMaterials[1], stressMaterials[1]);

const stage = hog.stages.find(
  (s) => s.title.en === "Less phosphorelay activates the branch",
);
assert.equal(
  stage.at,
  0.32,
  "exercise the exact selectable stage, not a rounded neighborhood",
);
const epsilon = 1e-9;
let checks = 0;
for (const osmolarity of ["high", "unchanged"])
  for (const hog1 of ["active", "inhibited"])
    for (const progress of [
      stage.at - epsilon,
      stage.at,
      stage.at + epsilon,
      1,
      stage.at,
    ]) {
      scene.update(progress, { osmolarity, hog1 });
      const shouldBePhosphorylated =
        osmolarity === "unchanged" ||
        progress < stage.at ||
        (progress === 1 && hog1 === "active");
      const message = `osmolarity=${osmolarity}, hog1=${hog1}, p=${progress}`;
      assert.equal(
        phosphate.visible,
        shouldBePhosphorylated,
        `actual Ssk1 phosphate: ${message}`,
      );
      assert.equal(
        scene.group.userData.ssk1Phosphorylated,
        phosphate.visible,
        message,
      );
      assert.equal(
        scene.labels[2].text.en,
        shouldBePhosphorylated
          ? "Ssk1-P: branch restrained"
          : "Ssk1 dephosphorylated",
        `Ssk1 label must match its actual phosphate: ${message}`,
      );
      assert.equal(
        scene.labels[2].text.zh,
        shouldBePhosphorylated ? "Ssk1-P：抑制支路" : "Ssk1 去磷酸化",
        `Chinese Ssk1 label must match its actual phosphate: ${message}`,
      );
      const materials = shouldBePhosphorylated
        ? relayMaterials
        : stressMaterials;
      assert.equal(
        ssk1.material,
        materials[0],
        `Ssk1 material must match phosphate state: ${message}`,
      );
      assert.equal(
        ypd1.material,
        materials[1],
        `Ypd1 material must match relay state: ${message}`,
      );
      checks++;
    }
console.log(
  `HOG selectable-stage boundary: ${checks} exact/adjacent/end/return checks, both languages, actual phosphate and relay materials PASS.`,
);
