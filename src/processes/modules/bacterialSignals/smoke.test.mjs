import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import * as esbuild from "esbuild";
import chemotaxis from "./chemotaxisProcess.js";
import twoComponent from "./twoComponentProcess.js";
import quorumSensing from "./quorumSensingProcess.js";
import biofilm from "./biofilmProcess.js";

for (const model of [chemotaxis, twoComponent, quorumSensing, biofilm]) {
  assert.equal(model.stages[0].at, 0);
  assert(model.stages.at(-1).at < 1);
  for (const stage of model.stages)
    for (const field of ["title", "description"])
      for (const lang of ["zh", "en"]) assert(stage[field][lang]);
  const scene = model.create();
  const original = [];
  scene.group.traverse((node) => original.push(node));
  const geometries = original.map((node) => node.geometry);
  const materials = new Set(original.map((node) => node.material));
  const snapshot = () => {
    scene.group.updateMatrixWorld(true);
    return JSON.stringify(
      original.map((node) => [
        node.visible,
        node.matrixWorld.elements,
        node.material?.uuid,
        node.material?.opacity,
        node.isInstancedMesh ? Array.from(node.instanceMatrix.array) : null,
      ]),
    );
  };
  const variants = [];
  for (const option of model.controls[0].options) {
    const parameters = { [model.controls[0].id]: option.value };
    for (const progress of [NaN, -0.1, 0, 0.2, 0.4, 0.6, 0.8, 1, 1.1]) {
      scene.update(progress, parameters);
      scene.group.updateMatrixWorld(true);
      const size = new THREE.Box3()
        .setFromObject(scene.group)
        .getSize(new THREE.Vector3());
      assert(size.toArray().every(Number.isFinite));
      assert(
        Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
      );
    }
    scene.update(0.7, parameters);
    const saved = snapshot();
    scene.update(0, parameters);
    scene.update(0.2, parameters);
    scene.update(0.7, parameters);
    assert.equal(snapshot(), saved, `${model.id}: seeking is deterministic`);
    scene.update(0.93, parameters);
    variants.push(snapshot());
  }
  assert.notEqual(
    variants[0],
    variants[1],
    "Condition changes real scene state",
  );
  scene.update(0);
  const start = snapshot();
  scene.update(0.8);
  assert.notEqual(snapshot(), start);
  const after = [];
  scene.group.traverse((node) => after.push(node));
  assert.equal(after.length, original.length);
  after.forEach((node, i) => {
    assert.equal(node, original[i]);
    assert.equal(node.geometry, geometries[i]);
    assert(materials.has(node.material));
    if (node.geometry) {
      for (const attr of Object.values(node.geometry.attributes))
        assert(attr.array.every(Number.isFinite));
    }
    if (node.isInstancedMesh)
      assert(node.instanceMatrix.array.every(Number.isFinite));
  });
  assert(
    fs.existsSync(
      new URL(
        `../../../../public/process-thumbnails/${model.id}.svg`,
        import.meta.url,
      ),
    ),
  );
  await esbuild.build({
    entryPoints: [new URL(`./${model.id}Process.js`, import.meta.url).pathname],
    bundle: true,
    platform: "node",
    write: false,
    logLevel: "silent",
  });
  console.log(
    `${model.id}: bilingual stages, bounds, conditions, deterministic seeks, stable resources and esbuild passed`,
  );
}
const chemo = chemotaxis.create();
chemo.update(0.55, { environment: "uniform" });
assert.equal(chemo.group.userData.behavior, "tumble");
chemo.update(0.55, { environment: "gradient" });
assert.equal(chemo.group.userData.behavior, "run");
assert.equal(chemo.group.userData.directionIsCommanded, false);
const two = twoComponent.create();
two.update(0.95, { nitrate: "present" });
assert(
  two.group.userData.enhancedTranscript &&
    two.group.userData.narLPhosphorylated,
);
two.update(0.95, { nitrate: "absent" });
assert(
  !two.group.userData.enhancedTranscript &&
    !two.group.userData.narLPhosphorylated,
);

const quorum = quorumSensing.create();
quorum.update(0.95, { exchange: "retained" });
assert(
  quorum.group.userData.lightOutput && quorum.group.userData.luxBoxOccupied,
);
quorum.update(0.95, { exchange: "diluted" });
assert(
  !quorum.group.userData.lightOutput && !quorum.group.userData.luxBoxOccupied,
);
const film = biofilm.create();
film.update(0.95, { cue: "NO" });
assert.equal(film.group.userData.releasedCells, 4);
assert.equal(film.group.userData.cellKilling, false);
film.update(0.95, { cue: "none" });
assert.equal(film.group.userData.releasedCells, 0);
