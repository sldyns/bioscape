import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import { build } from "esbuild";
import rna from "./rnaSilencingProcess.js";
import proteasome from "./proteasomeProcess.js";
import crispr from "./crisprProcess.js";
import bacterialRepair from "./bacterialRepairProcess.js";
const serialize = (group) => {
  const data = [];
  group.traverse((o) =>
    data.push([
      o.uuid,
      o.visible,
      o.position.toArray(),
      o.quaternion.toArray(),
      o.scale.toArray(),
      o.geometry?.uuid,
      o.material?.uuid,
      o.isInstancedMesh ? Array.from(o.instanceMatrix.array) : null,
    ]),
  );
  return JSON.stringify(data);
};
for (const model of [rna, proteasome, crispr, bacterialRepair]) {
  assert.equal(model.stages[0].at, 0);
  for (const s of model.stages)
    for (const key of ["title", "description"])
      for (const lang of ["zh", "en"]) assert.ok(s[key][lang]);
  assert.ok(fs.existsSync(`public/process-thumbnails/${model.id}.svg`));
  await build({
    entryPoints: [`src/processes/modules/turnover/${model.id}Process.js`],
    bundle: true,
    write: false,
    platform: "browser",
    logLevel: "silent",
  });
  for (const rootId of model.id === "proteasome"
    ? ["cell", "plant", "yeast"]
    : model.id === "rnaSilencing"
      ? ["cell"]
      : ["bacterium"]) {
    const scene = model.create({ rootId });
    const resources = () => {
      const geometries = new Set(),
        materials = new Set(scene.materials ?? []),
        nodes = [];
      scene.group.traverse((o) => {
        nodes.push(o.uuid);
        if (o.geometry) geometries.add(o.geometry.uuid);
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
      });
      return JSON.stringify([
        nodes,
        [...geometries].sort(),
        [...materials].map((m) => m.uuid).sort(),
      ]);
    };
    const resourceBaseline = resources();
    const checkedGeometry = new Set();
    scene.group.traverse((o) => {
      if (o.geometry && !checkedGeometry.has(o.geometry.uuid)) {
        checkedGeometry.add(o.geometry.uuid);
        for (const attr of Object.values(o.geometry.attributes))
          assert.ok(Array.from(attr.array).every(Number.isFinite));
      }
    });
    let count = 0;
    scene.group.traverse(() => count++);
    for (const option of model.controls[0].options) {
      const params = { [model.controls[0].id]: option.value };
      let previous = "";
      let distinct = 0;
      for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1, NaN]) {
        scene.update(p, params);
        const size = new THREE.Box3()
          .setFromObject(scene.group)
          .getSize(new THREE.Vector3());
        assert.ok(size.toArray().every(Number.isFinite));
        assert.ok(
          Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
        );
        let nextCount = 0;
        scene.group.traverse((o) => {
          nextCount++;
          assert.ok(
            [
              ...o.position.toArray(),
              ...o.scale.toArray(),
              ...o.quaternion.toArray(),
            ].every(Number.isFinite),
          );
        });
        assert.equal(nextCount, count);
        assert.equal(resources(), resourceBaseline);
        scene.group.traverse((o) => {
          if (o.isInstancedMesh) {
            assert.ok(
              Array.from(o.instanceMatrix.array).every(Number.isFinite),
            );
            assert.ok(o.boundingBox);
            assert.ok(o.boundingSphere);
          }
        });
        const next = serialize(scene.group);
        if (next !== previous) distinct++;
        previous = next;
      }
      assert.ok(distinct >= 4);
      scene.update(0.7, params);
      const expected = serialize(scene.group),
        state = JSON.stringify(scene.group.userData);
      scene.update(0, params);
      scene.update(0.2, params);
      scene.update(0.7, params);
      assert.equal(serialize(scene.group), expected);
      assert.equal(JSON.stringify(scene.group.userData), state);
    }
  }
  console.log(
    `${model.id}: bundle, bilingual stages, finite bounds, branches and deterministic seeks PASS`,
  );
}

for (const model of [crispr, bacterialRepair]) {
  const scene = model.create({ rootId: "bacterium" });
  const key = model.controls[0].id;
  for (const option of model.controls[0].options) {
    scene.update(1, { [key]: option.value });
    if (model.id === "crispr") {
      assert.equal(
        scene.group.userData.doubleStrandBreak,
        option.value === "matched",
      );
      assert.equal(scene.group.userData.rLoop, option.value === "matched");
    } else {
      assert.equal(
        scene.group.userData.sosDerepressed,
        option.value === "wildtype",
      );
      assert.equal(
        scene.group.userData.lexACleaved,
        option.value === "wildtype",
      );
      assert.equal(scene.group.userData.repairCompletionShown, false);
    }
  }
}
console.log("Cas9 target recognition and LexA branch scientific state PASS");

{
  const scene = proteasome.create();
  for (const p of [0, 0.4, 0.7, 1]) {
    scene.update(p);
    let catalyticSites = 0;
    scene.group.traverse((o) => {
      if (o.name.startsWith("beta catalytic site")) {
        catalyticSites++;
        assert.ok(Math.max(...o.scale.toArray()) < 0.13);
      }
    });
    assert.equal(catalyticSites, 6);
  }
}
console.log("Proteasome catalytic pockets retain small dimensions PASS");
