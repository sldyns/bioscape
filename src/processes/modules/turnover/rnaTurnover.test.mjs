import assert from "node:assert/strict";
import { test } from "node:test";
import rna from "./rnaSilencingProcess.js";

const find = (scene, name) => {
  const object = scene.group.getObjectByName(name);
  assert.ok(object, `missing rendered RNA object: ${name}`);
  return object;
};
const objects = (scene, prefix, count) =>
  Array.from({ length: count }, (_, i) => find(scene, `${prefix} ${i}`));
const setup = () => {
  const scene = rna.create();
  return {
    scene,
    tail: objects(scene, "poly(A) residue", 12),
    backbone: objects(scene, "target backbone", 28),
    bases: objects(scene, "target base", 28),
    cap: find(scene, "target 5-prime cap"),
    guides: objects(scene, "miRNA backbone", 22),
  };
};

test("seed tail remains attached to a visible RNA 3-prime end throughout turnover", () => {
  const { scene, tail, backbone, bases, cap } = setup();
  let previousTailCount = 12;
  let shortenedBeforeDecay = false;
  for (let step = 0; step <= 1000; step++) {
    const p = step / 1000;
    scene.update(p, { pairing: "seed" });
    const visibleTail = tail.filter((object) => object.visible);
    assert.ok(visibleTail.length <= previousTailCount, `tail regrew at p=${p}`);
    previousTailCount = visibleTail.length;
    if (p < 0.83 && visibleTail.length > 0 && visibleTail.length < 12)
      shortenedBeforeDecay = true;
    if (visibleTail.length) {
      assert.ok(
        bases[27].visible && backbone[27].visible,
        `orphan poly(A) tail remains after its attached 3-prime end decayed at p=${p}`,
      );
      assert.ok(tail[0].position.x > bases[27].position.x);
      assert.ok(cap.position.x < bases[0].position.x);
      assert.deepEqual(
        scene.labels[2].position,
        visibleTail.at(-1).position.toArray(),
      );
    }
    assert.equal(scene.labels[2].active, visibleTail.length > 0);
  }
  assert.ok(shortenedBeforeDecay, "preserve deadenylation before target decay");
  assert.ok(backbone.every((object) => !object.visible));
  assert.ok(bases.every((object) => !object.visible));
  assert.ok(tail.every((object) => !object.visible));
  assert.equal(cap.visible, false);
  assert.equal(scene.labels[2].active, false);
});

test("slicing and mismatch retain distinct complete RNA lifecycles", () => {
  const { scene, tail, backbone, bases, cap, guides } = setup();
  for (const pairing of ["slice", "mismatch"]) {
    let previousTailCount = 12;
    for (let step = 0; step <= 1000; step++) {
      const p = step / 1000;
      scene.update(p, { pairing });
      const visibleTail = tail.filter((object) => object.visible);
      assert.equal(scene.labels[2].active, visibleTail.length > 0);
      assert.ok(guides.slice(0, 21).every((object) => object.visible));
      assert.ok(tail[0].position.x > bases[27].position.x);
      assert.ok(cap.position.x < bases[0].position.x);
      if (pairing === "mismatch") {
        assert.equal(visibleTail.length, 12);
        assert.ok(backbone.every((object) => object.visible));
        assert.ok(bases.every((object) => object.visible));
        assert.equal(cap.visible, true);
      } else {
        assert.ok(visibleTail.length <= previousTailCount);
        previousTailCount = visibleTail.length;
        if (p < 0.83) assert.equal(visibleTail.length, 12);
        if (p > 0.56) assert.equal(backbone[14].visible, false);
      }
    }
    if (pairing === "slice") {
      assert.ok(backbone.every((object) => !object.visible));
      assert.ok(bases.every((object) => !object.visible));
      assert.ok(tail.every((object) => !object.visible));
      assert.equal(cap.visible, false);
    }
  }
});

test("RNA tail and labels restore exactly after reverse and cross-condition seeks", () => {
  const current = setup();
  const reference = setup();
  const snapshot = ({ scene, tail, backbone, bases, cap, guides }) => ({
    objects: [...tail, ...backbone, ...bases, cap, ...guides].map((object) => [
      object.name,
      object.visible,
      ...object.position.toArray(),
      ...object.quaternion.toArray(),
      ...object.scale.toArray(),
    ]),
    labels: scene.labels.map((label) => [label.active, [...label.position]]),
  });
  const modes = ["seed", "slice", "mismatch"];
  const samples = [
    ...Array.from({ length: 101 }, (_, i) => i / 100),
    0.829999,
    0.830001,
    0.849999,
    0.850001,
    0.999999,
  ];
  for (const pairing of modes) {
    for (const p of samples) {
      reference.scene.update(p, { pairing });
      for (const other of modes) {
        current.scene.update(1, { pairing: other });
        current.scene.update(0, { pairing: other });
        current.scene.update(0.91, { pairing: other });
      }
      current.scene.update(p, { pairing });
      assert.deepEqual(
        snapshot(current),
        snapshot(reference),
        `${pairing} ${p}`,
      );
    }
  }
});
