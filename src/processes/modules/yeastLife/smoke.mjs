import assert from "node:assert/strict";
import * as THREE from "three";
import { build } from "esbuild";

function capture(scene) {
  scene.group.updateMatrixWorld(true);
  const result = [];
  scene.group.traverse((object) => {
    result.push(object.uuid, object.visible, ...object.matrix.elements);
    if (object.geometry)
      result.push(
        object.geometry.uuid,
        ...object.geometry.attributes.position.array,
      );
    if (object.isInstancedMesh) result.push(...object.instanceMatrix.array);
    if (object.material)
      result.push(
        object.material.uuid,
        object.material.color?.getHex(),
        object.material.opacity,
      );
  });
  return JSON.stringify(result);
}
for (const id of [
  "yeastBudding",
  "yeastMating",
  "yeastSporulation",
  "yeastFermentation",
]) {
  const url = new URL(`./${id}Process.js`, import.meta.url);
  const model = (await import(url.href)).default,
    scene = model.create(),
    control = model.controls?.[0];
  const materials = new Set(scene.materials),
    resources = new Set(),
    nodes = [];
  scene.group.traverse((o) => {
    nodes.push(o.uuid);
    if (o.geometry) resources.add(o.geometry.uuid);
  });
  const options = control
    ? control.options.map((o) => ({ [control.id]: o.value }))
    : [{}];
  for (const params of options) {
    for (const p of [NaN, -1, 0, 0.12, 0.3, 0.47, 0.63, 0.71, 0.86, 1, 2]) {
      scene.update(p, params);
      const current = [];
      scene.group.traverse((o) => {
        current.push(o.uuid);
        if (o.geometry) {
          assert(resources.has(o.geometry.uuid));
          for (const attr of Object.values(o.geometry.attributes))
            assert([...attr.array].every(Number.isFinite));
        }
        if (o.isInstancedMesh) {
          assert([...o.instanceMatrix.array].every(Number.isFinite));
          assert(Number.isFinite(o.boundingSphere?.radius));
        }
        if (o.material)
          assert(
            materials.has(o.material),
            "material inventory must include swaps",
          );
      });
      assert.deepEqual(current, nodes);
      const size = new THREE.Box3()
        .setFromObject(scene.group)
        .getSize(new THREE.Vector3())
        .toArray();
      assert(size.every(Number.isFinite));
      assert(Math.max(...size) > 2 && Math.max(...size) < 20);
    }
    scene.update(0.7, params);
    const a = capture(scene);
    scene.update(0, params);
    scene.update(0.2, params);
    scene.update(0.7, params);
    assert.equal(capture(scene), a);
  }
  scene.update(0.08);
  const start = capture(scene);
  scene.update(0.86);
  assert.notEqual(capture(scene), start);
  if (control) {
    scene.update(1, options[0]);
    const a = capture(scene);
    scene.update(1, options[1]);
    assert.notEqual(capture(scene), a);
  }
  for (const stage of model.stages)
    for (const language of ["zh", "en"]) {
      assert(stage.title[language]);
      assert(stage.description[language]);
    }
  await build({
    entryPoints: [url.pathname],
    bundle: true,
    write: false,
    platform: "browser",
    format: "esm",
    logLevel: "error",
  });
  console.log(
    `${id}: PASS — ${nodes.length} nodes, ${resources.size} geometries, ${materials.size} materials`,
  );
}
