import assert from "node:assert/strict";
import * as THREE from "three";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

for (const id of [
  "respiration",
  "glycolysis",
  "bacterialEnergetics",
  "bacterialPhotosynthesis",
]) {
  const url = new URL(`./${id}Process.js`, import.meta.url);
  const { default: definition } = await import(url);
  const roots =
    id === "respiration"
      ? ["cell", "plant", "yeast", "paramecium"]
      : id === "glycolysis"
        ? ["cell", "plant", "yeast"]
        : ["bacterium"];
  const control = definition.controls?.[0];
  const parameters = control
    ? control.options.map((option) => ({ [control.id]: option.value }))
    : [{}];
  for (const rootId of roots) {
    const model = definition.create({ rootId });
    const resources = [];
    model.group.traverse((object) =>
      resources.push([object, object.geometry, object.material]),
    );
    const geometries = new Set(resources.map((row) => row[1]).filter(Boolean));
    for (const geometry of geometries) {
      for (const attribute of Object.values(geometry.attributes)) {
        assert.ok(
          Array.from(attribute.array).every(Number.isFinite),
          `${id}: nonfinite geometry`,
        );
      }
    }
    const signature = () => {
      model.group.updateMatrixWorld(true);
      const transforms = [];
      model.group.traverse((object) => {
        transforms.push(...object.matrix.elements, Number(object.visible));
        if (object.isInstancedMesh)
          transforms.push(...object.instanceMatrix.array);
      });
      return JSON.stringify([transforms, model.group.userData, model.labels]);
    };
    for (const params of parameters) {
      const stageSignatures = new Set();
      for (const progress of [NaN, 0, 0.2, 0.4, 0.6, 0.8, 1]) {
        model.update(progress, params);
        const box = new THREE.Box3().setFromObject(model.group);
        assert.ok([...box.min, ...box.max].every(Number.isFinite));
        const extent = Math.max(...box.getSize(new THREE.Vector3()));
        assert.ok(extent > 2 && extent < 20);
        let index = 0;
        model.group.traverse((object) => {
          assert.equal(object, resources[index][0]);
          assert.equal(object.geometry, resources[index][1]);
          assert.equal(object.material, resources[index][2]);
          index++;
        });
        assert.equal(index, resources.length);
        stageSignatures.add(signature());
      }
      assert.ok(stageSignatures.size >= 5);
      model.update(0.7, params);
      const saved = signature();
      model.update(0.2, params);
      model.update(0.7, params);
      assert.equal(signature(), saved);
      model.update(1, params);
      const state = model.group.userData;
      if (id === "glycolysis") {
        assert.equal(state.carbonCount, 6);
        assert.equal(state.netATP, 2);
        assert.equal(state.nadhProduced, 2);
      } else if (id === "respiration") {
        assert.equal(state.f1Side, "matrix");
        assert.equal(
          state.nadhEntry,
          rootId === "yeast" ? "Ndi1-no-proton-pumping" : "complex-I",
        );
      } else if (id === "bacterialEnergetics") {
        assert.equal(state.ndhPumps, params.route !== "ndh2-bd");
        assert.equal(state.oxidasePumps, params.route !== "ndh2-bd");
        assert.equal(state.protonReturn, "periplasm-to-cytoplasm");
      } else {
        assert.equal(state.hasChloroplast, false);
        assert.equal(state.f1Side, "cytoplasm");
        assert.equal(state.oxygenProduced, params.light !== "dark");
      }
    }
    model.update(0.7);
    const defaults = signature();
    model.update(0.2, parameters.at(-1));
    model.update(0.7);
    assert.equal(signature(), defaults, `${id}: control reset failed`);
  }
  await build({
    entryPoints: [fileURLToPath(url)],
    bundle: true,
    write: false,
    platform: "browser",
    logLevel: "silent",
  });
  console.log(
    `${id}: finite geometry and bounds; deterministic seeks; stable scene resources; controls and scientific invariants; esbuild PASS`,
  );
}
