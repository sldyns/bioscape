import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import { build } from "esbuild";
for (const id of [
  "signalTransduction",
  "apoptosis",
  "differentiation",
  "immuneResponse",
]) {
  const source = new URL(`./${id}Process.js`, import.meta.url);
  const spec = (await import(source)).default;
  assert.equal(spec.id, id);
  assert.equal(spec.stages[0].at, 0);
  assert(spec.stages.length >= 4 && spec.stages.length <= 7);
  for (const stage of spec.stages) {
    assert(stage.at < 1);
    for (const field of ["title", "description"])
      assert(stage[field].zh && stage[field].en);
  }
  const model = spec.create({ rootId: "cell" });
  const nodes = [],
    geometries = new Map();
  model.group.traverse((node) => {
    nodes.push(node);
    if (node.geometry) geometries.set(node, node.geometry);
  });
  const resources = new Set(model.materials || []);
  assert(
    resources.size > 0,
    "model must expose the complete material inventory",
  );
  for (const [node, geometry] of geometries) {
    for (const attribute of Object.values(geometry.attributes))
      assert(
        Array.from(attribute.array).every(Number.isFinite),
        `${id}: finite geometry buffer`,
      );
    if (node.isInstancedMesh)
      assert(
        Array.from(node.instanceMatrix.array).every(Number.isFinite),
        `${id}: finite instance buffer`,
      );
  }
  const snapshot = () => {
    const values = [];
    model.group.traverse((node) =>
      values.push([
        node.uuid,
        node.visible,
        ...node.position.toArray(),
        ...node.scale.toArray(),
        ...node.quaternion.toArray(),
        node.material?.uuid,
        node.material?.color?.getHex(),
      ]),
    );
    return JSON.stringify(values);
  };
  const stageStates = new Set();
  for (let i = 0; i < spec.stages.length; i++) {
    model.update((spec.stages[i].at + (spec.stages[i + 1]?.at ?? 1)) / 2);
    stageStates.add(snapshot());
  }
  assert.equal(stageStates.size, spec.stages.length);
  for (const option of spec.controls[0].options) {
    const parameters = { [spec.controls[0].id]: option.value };
    for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1, NaN]) {
      model.update(p, parameters);
      model.group.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model.group),
        size = bounds.getSize(new THREE.Vector3());
      assert(
        [...bounds.min.toArray(), ...bounds.max.toArray()].every(
          Number.isFinite,
        ),
      );
      assert(
        Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
      );
      const current = [];
      model.group.traverse((node) => current.push(node));
      assert.deepEqual(current, nodes);
      for (const [node, geometry] of geometries)
        assert.equal(node.geometry, geometry);
      model.group.traverse((node) => {
        if (node.material)
          for (const material of Array.isArray(node.material)
            ? node.material
            : [node.material])
            assert(resources.has(material), `${id}: stable material resources`);
      });
    }
    model.update(0.7, parameters);
    const saved = snapshot();
    model.update(0.2, parameters);
    model.update(0.7, parameters);
    assert.equal(snapshot(), saved);
  }
  model.update(1);
  if (id === "signalTransduction") {
    assert.equal(model.group.userData.erkNuclear, true);
    model.update(1, { condition: "kinaseInactive" });
    assert.equal(model.group.userData.receptorDimerized, true);
    assert.equal(model.group.userData.erkNuclear, false);
    model.update(1, { condition: "noLigand" });
    assert.equal(model.group.userData.receptorDimerized, false);
  } else if (id === "apoptosis") {
    assert.equal(model.group.userData.apoptoticBodies, 5);
    assert.equal(model.group.userData.plasmaMembraneRupture, false);
    model.update(1, { condition: "noStress" });
    assert.equal(model.group.userData.outerMembranePermeabilized, false);
    assert.equal(model.group.userData.apoptoticBodies, 0);
  } else if (id === "differentiation") {
    assert.equal(model.group.userData.reticulocyte, true);
    assert.equal(model.group.userData.matureErythrocyte, false);
    model.update(1, { program: "impaired" });
    assert.equal(model.group.userData.nucleusExtruded, false);
    assert.equal(model.group.userData.hemoglobinAccumulating, false);
  } else if (id === "immuneResponse") {
    assert.equal(model.group.userData.participatingCells, 2);
    assert.equal(model.group.userData.tcrRecognized, true);
    assert.equal(model.group.userData.granulesPolarized, true);
    model.update(1, { epitope: "unmatched" });
    assert.equal(model.group.userData.surfacePresentation, true);
    assert.equal(model.group.userData.tcrRecognized, false);
    assert.equal(model.group.userData.granulesPolarized, false);
  }
  assert(
    fs
      .readFileSync(
        new URL(
          `../../../../public/process-thumbnails/${id}.svg`,
          import.meta.url,
        ),
        "utf8",
      )
      .includes('viewBox="0 0 320 320"'),
  );
  await build({
    entryPoints: [source.pathname],
    bundle: true,
    write: false,
    platform: "browser",
    format: "esm",
  });
  console.log(
    `${id}: bilingual stages, geometry, deterministic seek, condition branches and bundle PASS`,
  );
}
