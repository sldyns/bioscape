import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import gal from "./yeastGalProcess.js";
import osm from "./yeastOsmoregulationProcess.js";
function snapshot(s) {
  const a = [];
  s.group.traverse((o) =>
    a.push([
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
  return JSON.stringify([a, s.group.userData, s.labels]);
}
for (const model of [gal, osm]) {
  const scene = model.create();
  const originals = [];
  scene.group.traverse((o) => originals.push([o, o.geometry]));
  const materialIds = new Set();
  scene.group.traverse((o) => {
    if (o.material) materialIds.add(o.material.uuid);
  });
  // Some pre-created materials become used only after a condition change.
  for (const a of model.controls[0].options)
    for (const b of model.controls[1].options) {
      const params = {
        [model.controls[0].id]: a.value,
        [model.controls[1].id]: b.value,
      };
      for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
        scene.update(p, params);
        scene.group.traverse((o) => {
          if (o.material) materialIds.add(o.material.uuid);
        });
      }
    }
  for (const s of model.stages)
    for (const key of ["title", "description"])
      for (const lang of ["zh", "en"]) assert(s[key][lang]);
  assert.equal(model.stages[0].at, 0);
  assert(model.stages.at(-1).at < 1);
  assert(
    fs.existsSync(
      new URL(
        `../../../../public/process-thumbnails/${model.id}.svg`,
        import.meta.url,
      ),
    ),
  );
  for (const a of model.controls[0].options)
    for (const b of model.controls[1].options) {
      const params = {
        [model.controls[0].id]: a.value,
        [model.controls[1].id]: b.value,
      };
      for (const p of [NaN, 0, 0.2, 0.4, 0.6, 0.8, 1]) {
        scene.update(p, params);
        scene.group.updateMatrixWorld(true);
        const size = new THREE.Box3()
          .setFromObject(scene.group)
          .getSize(new THREE.Vector3())
          .toArray();
        assert(size.every(Number.isFinite));
        assert(Math.max(...size) > 2 && Math.max(...size) < 20);
        const now = [];
        scene.group.traverse((o) => {
          now.push([o, o.geometry]);
          if (o.material) assert(materialIds.has(o.material.uuid));
          if (o.geometry)
            assert(
              [...o.geometry.attributes.position.array].every(Number.isFinite),
            );
        });
        assert.deepEqual(now, originals);
      }
      scene.update(0.7, params);
      const expected = snapshot(scene);
      scene.update(0, params);
      scene.update(0.2, params);
      scene.update(1, params);
      scene.update(0.7, params);
      assert.equal(snapshot(scene), expected);
      scene.update(1, params);
      const state = scene.group.userData;
      if (model.id === "yeastGal") {
        assert.equal(state.gal4DNABound, true);
        assert.equal(
          state.gal80InhibitionRelieved,
          params.galactose === "present",
        );
        assert.equal(state.mig1Repression, params.glucose === "high");
        assert.equal(
          state.transcription,
          params.galactose === "present" && params.glucose === "low"
            ? "induced"
            : "repressed-representative",
        );
      } else {
        assert.equal(state.fps1Closed, params.osmolarity === "high");
        assert.equal(
          state.glycerolAccumulation,
          params.osmolarity === "high" && params.hog1 === "active"
            ? "adaptive"
            : "basal",
        );
        scene.update(0.65, params);
        assert.equal(
          scene.group.userData.hog1Nuclear,
          params.osmolarity === "high" && params.hog1 === "active",
        );
      }
    }
  scene.update(0.7);
  const expected = snapshot(scene);
  scene.update(
    0.7,
    Object.fromEntries(model.controls.map((c) => [c.id, c.default])),
  );
  assert.equal(snapshot(scene), expected);
  console.log(
    `${model.id}: four scenarios, defaults, deterministic seek, finite bounds and stable allocations PASS`,
  );
}
