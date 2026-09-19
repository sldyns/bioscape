import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import lac from "./lacOperonProcess.js";
import trp from "./trpOperonProcess.js";
const scenarios = {
  lacOperon: [
    { lactose: "absent", glucose: "low" },
    { lactose: "absent", glucose: "high" },
    { lactose: "present", glucose: "low" },
    { lactose: "present", glucose: "high" },
  ],
  trpOperon: [
    { tryptophan: "low", charging: "normal" },
    { tryptophan: "low", charging: "limited" },
    { tryptophan: "high", charging: "normal" },
    { tryptophan: "high", charging: "limited" },
  ],
};
function snapshot(scene) {
  const objects = [];
  scene.group.traverse((o) =>
    objects.push([
      o.uuid,
      o.visible,
      o.position.toArray(),
      o.quaternion.toArray(),
      o.scale.toArray(),
      o.geometry?.uuid,
      o.geometry?.drawRange.count,
      o.material?.uuid,
    ]),
  );
  return JSON.stringify([objects, scene.group.userData, scene.labels]);
}
for (const model of [lac, trp]) {
  assert.equal(model.stages[0].at, 0);
  assert(model.stages.length >= 4 && model.stages.length <= 7);
  assert(model.stages.at(-1).at < 1);
  for (const s of model.stages)
    for (const key of ["title", "description"])
      for (const lang of ["zh", "en"]) assert(s[key][lang]);
  assert(
    fs.existsSync(
      new URL(
        `../../../../public/process-thumbnails/${model.id}.svg`,
        import.meta.url,
      ),
    ),
  );
  const scene = model.create(),
    original = [];
  scene.group.traverse((o) => original.push([o, o.geometry, o.material]));
  for (const params of scenarios[model.id]) {
    const distinct = new Set();
    for (const p of [NaN, 0, 0.2, 0.4, 0.6, 0.8, 1]) {
      scene.update(p, params);
      scene.group.updateMatrixWorld(true);
      distinct.add(snapshot(scene));
      const box = new THREE.Box3().setFromObject(scene.group),
        size = box.getSize(new THREE.Vector3());
      assert(size.toArray().every(Number.isFinite));
      assert(
        Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
      );
      const now = [];
      scene.group.traverse((o) => {
        now.push([o, o.geometry, o.material]);
        if (o.geometry)
          for (const v of o.geometry.attributes.position.array)
            assert(Number.isFinite(v));
      });
      assert.deepEqual(now, original);
    }
    assert(distinct.size >= 5);
    scene.update(0.7, params);
    const expected = snapshot(scene);
    scene.update(0.2, params);
    scene.update(1, params);
    scene.update(0, params);
    scene.update(0.7, params);
    assert.equal(snapshot(scene), expected);
    scene.update(1, params);
    const s = scene.group.userData;
    if (model.id === "lacOperon") {
      assert.equal(s.lacIBound, params.lactose === "absent");
      assert.equal(s.capCampBound, params.glucose === "low");
      assert.equal(
        s.illustrativeTranscriptCount,
        params.lactose === "absent" ? 0 : params.glucose === "low" ? 3 : 1,
      );
    } else {
      const charged =
        params.tryptophan === "high" && params.charging === "normal";
      assert.equal(s.trpRBound, params.tryptophan === "high");
      assert.equal(s.ribosomeStalled, !charged);
      assert.equal(s.hairpin, charged ? "3:4" : "2:3");
      assert.equal(s.attenuation, charged);
      assert.equal(s.readthrough, !charged);
    }
  }
  scene.update(0.7);
  const defaults = snapshot(scene);
  scene.update(
    0.7,
    Object.fromEntries(model.controls.map((c) => [c.id, c.default])),
  );
  assert.equal(snapshot(scene), defaults);
  console.log(
    `${model.id}: four conditions, stage variation, bounds, identity stability and repeated seeking PASS`,
  );
}
