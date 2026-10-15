import assert from "node:assert/strict";
import { test } from "node:test";
import proteasome from "./proteasomeProcess.js";

function contribution(object) {
  let opacity = 0;
  object.traverseVisible((child) => {
    if (child.isMesh) opacity += child.material.opacity;
  });
  return opacity;
}
function signature(scene) {
  const records = [];
  scene.group.traverse((object) => {
    records.push([
      object.uuid,
      object.geometry?.uuid,
      object.material?.uuid,
      object.visible,
      object.position.toArray(),
      object.scale.toArray(),
      object.material?.opacity,
    ]);
  });
  return JSON.stringify(records);
}
function progressAtRecycle(amount) {
  // Invert the existing smoothstep to sample on either side of link release.
  let lo = 0.83,
    hi = 1;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2,
      t = (mid - 0.83) / 0.17;
    if (t * t * (3 - 2 * t) < amount) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

test("proteasome release has vanishing visual contribution at cut and peptide birth", () => {
  const scene = proteasome.create();
  const attachment = scene.group.getObjectByName("substrate ubiquitin linkage");
  scene.update(0.46);
  assert.equal(contribution(attachment), 1);
  scene.update(0.48 - 1e-5);
  assert.ok(contribution(attachment) < 1e-5);
  scene.update(0.48 + 1e-5);
  assert.equal(contribution(attachment), 0);
  const fragment = scene.group.getObjectByName("product peptide 0");
  let lo = 0.5,
    hi = 0.93;
  for (let i = 0; i < 48; i++) {
    const p = (lo + hi) / 2;
    scene.update(p);
    if (fragment.visible) hi = p;
    else lo = p;
  }
  scene.update(hi + 1e-6);
  assert.ok(fragment.visible);
  assert.ok(contribution(fragment) < 1e-6);
  scene.update(0.8);
  assert.equal(contribution(fragment), 1);
});

test("ubiquitin recycling links fade before the existing separation boundary", () => {
  const scene = proteasome.create();
  // Locate the actual inter-ubiquitin bonds by their shared faded material.
  scene.update(progressAtRecycle(0.075));
  const fading = [];
  scene.group.traverse((object) => {
    if (object.isMesh && Math.abs(object.material.opacity - 0.5) < 1e-9)
      fading.push(object);
  });
  assert.equal(fading.length, 3);
  scene.update(progressAtRecycle(0.15 - 1e-6));
  for (const link of fading) assert.ok(contribution(link) < 1e-8);
  scene.update(progressAtRecycle(0.15 + 1e-6));
  for (const link of fading) assert.equal(contribution(link), 0);
});

test("release fades are seek deterministic and all materials remain owned", () => {
  const scene = proteasome.create();
  scene.update(0.72);
  const expected = signature(scene);
  const inventory = new Set(scene.materials);
  for (const p of [0, 1, 0.48, 0.72]) scene.update(p);
  assert.equal(signature(scene), expected);
  scene.group.traverse((object) => {
    if (object.isMesh) assert.ok(inventory.has(object.material));
  });
  for (const p of [0, 0.4, 0.8, 1]) {
    scene.update(p, { tag: "untagged" });
    for (let j = 0; j < 7; j++)
      assert.equal(
        scene.group.getObjectByName(`product peptide ${j}`).visible,
        false,
      );
  }
});
