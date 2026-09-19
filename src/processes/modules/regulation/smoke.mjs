import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import * as THREE from "three";
import promoter from "./promoterRegulationProcess.js";
import enhancer from "./enhancerRegulationProcess.js";
import { sceneKit } from "../../kit.js";
import { chromatinFiber } from "./chromatinGeometry.js";

function snapshot(model) {
  model.group.updateMatrixWorld(true);
  const data = [];
  model.group.traverse((object) => {
    data.push(object.visible, ...object.matrix.elements);
    for (const attribute of Object.values(object.geometry?.attributes ?? {}))
      data.push(...attribute.array);
    if (object.instanceMatrix) data.push(...object.instanceMatrix.array);
    if (object.instanceColor) data.push(...object.instanceColor.array);
    if (object.material?.color) data.push(...object.material.color.toArray());
  });
  return data;
}
function resources(model) {
  const data = [];
  model.group.traverse((object) =>
    data.push([object.uuid, object.geometry?.uuid, object.material?.uuid]),
  );
  return data;
}
for (const definition of [promoter, enhancer]) {
  const model = definition.create({ rootId: "cell" }),
    originalResources = resources(model);
  assert.equal(definition.stages[0].at, 0);
  assert.ok(definition.stages.length >= 4 && definition.stages.length <= 7);
  assert.ok(definition.stages.at(-1).at < 1);
  for (const stage of definition.stages)
    for (const locale of ["zh", "en"])
      assert.ok(stage.title[locale] && stage.description[locale]);
  const stageSnapshots = new Set();
  for (const stage of definition.stages) {
    model.update(stage.at);
    stageSnapshots.add(JSON.stringify(snapshot(model)));
  }
  assert.equal(
    stageSnapshots.size,
    definition.stages.length,
    "Each stage changes real geometry",
  );
  for (const option of definition.controls[0].options) {
    const parameters = { [definition.controls[0].id]: option.value };
    for (const progress of [0, 0.12, 0.35, 0.53, 0.7, 0.9, 1, NaN, -1, 2]) {
      model.update(progress, parameters);
      const box = new THREE.Box3().setFromObject(model.group),
        size = box.getSize(new THREE.Vector3());
      assert.ok([...box.min, ...box.max].every(Number.isFinite));
      assert.ok(Math.max(...size) > 2 && Math.max(...size) < 20);
      assert.ok(
        snapshot(model).every(
          (value) => typeof value === "boolean" || Number.isFinite(value),
        ),
      );
    }
    model.update(0.7, parameters);
    const expected = snapshot(model),
      state = JSON.stringify(model.group.userData);
    model.update(0, parameters);
    model.update(0.2, parameters);
    model.update(0.7, parameters);
    assert.deepEqual(snapshot(model), expected);
    assert.equal(JSON.stringify(model.group.userData), state);
  }
  model.update(0.9);
  const defaultState = snapshot(model);
  model.update(0.9, {
    [definition.controls[0].id]: definition.controls[0].default,
  });
  assert.deepEqual(snapshot(model), defaultState);
  assert.deepEqual(
    resources(model),
    originalResources,
    "update reuses all nodes, geometries and materials",
  );
  await access(
    new URL(
      `../../../../public/process-thumbnails/${definition.id}.svg`,
      import.meta.url,
    ),
  );
  await build({
    entryPoints: [
      fileURLToPath(new URL(`./${definition.id}Process.js`, import.meta.url)),
    ],
    bundle: true,
    platform: "browser",
    format: "esm",
    write: false,
    logLevel: "silent",
  });
  console.log(
    `PASS ${definition.id}: stages, both controls, finite buffers and bounds, deterministic seeks, stable resources, thumbnail, esbuild`,
  );
}
const p = promoter.create();
p.update(0.9);
assert.equal(p.group.userData.rnaSynthesis, true);
p.update(0.9, { bindingSite: "altered" });
assert.equal(p.group.userData.dnaOpen, false);
assert.equal(p.group.userData.rnaSynthesis, false);
const e = enhancer.create();
for (const t of [0.55, 0.65, 0.79, 0.92]) {
  e.update(t);
  const distance = e.group.userData.enhancerPromoterDistance,
    burst = e.group.userData.transcriptionBurst;
  e.update(t, { coactivator: "impaired" });
  assert.equal(e.group.userData.enhancerPromoterDistance, distance);
  assert.equal(e.group.userData.transcriptionBurst, false);
  assert.equal(burst, t === 0.65 || t === 0.92);
}
console.log(
  "PASS scientific branches: promoter opening/RNA; identical enhancer spatial paths with distinct burst output",
);

// Linker rails must retain exact strand attachment to each moving nucleosome.
const kit = sceneKit(),
  fiber = chromatinFiber(kit),
  probe = new THREE.Vector3();
for (const progress of [0, 0.2, 0.55, 0.9, 1]) {
  fiber.update(progress, 0.3 + 0.62 * Math.sin(progress * Math.PI * 2.5) ** 2);
  for (const link of fiber.links)
    for (let strand = 0; strand < 2; strand++)
      for (const end of [0, 1]) {
        link.point(end, strand, probe);
        assert.ok(
          probe.distanceTo(link.controls[strand][end ? 3 : 0]) < 1e-9,
          "No DNA strand gap at nucleosome/linker attachment",
        );
      }
  for (let i = 0; i < fiber.cores.length - 1; i++)
    assert.ok(
      fiber.cores[i].object.position.distanceTo(
        fiber.cores[i + 1].object.position,
      ) > 0.9,
      "Neighboring cores do not collapse into one bead",
    );
}
assert.equal(fiber.basePairs, 1365);
console.log(
  "PASS refinement: instance matrices/colors included in deterministic snapshots; exact linker endpoints and nucleosome spacing",
);
